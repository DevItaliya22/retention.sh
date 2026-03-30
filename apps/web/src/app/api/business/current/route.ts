import {
  withAdminAuth,
  withAdminAuthOptionalBusiness,
} from "@/lib/auth/middleware";
import { FEEDBACK_FORM_DEFAULTS } from "@/lib/constants/forms/feedback";
import { updateBusinessSchema } from "@/lib/schemas/business";
import {
  sanitizeErrorMessage,
  validateSchema,
} from "@/lib/utils/error-handler";
import {
  type IsServiceEnabled,
  mergeServiceEnabled,
} from "@/lib/utils/service-enabled";
import { db } from "@reelo/db";
import { NextResponse } from "next/server";

type BrandingShape = {
  logo?: string | null;
  themeColor?: string | null;
  textColor?: string | null;
  bannerImage?: string | null;
  header?: string | null;
  subtitle?: string | null;
};

function isMissing(value: unknown) {
  if (value === null || value === undefined || value === "") return true;
  if (typeof value === "string" && value.trim() === "") return true;
  return false;
}

function fillMissingBranding(
  current: BrandingShape | null | undefined,
  defaults: BrandingShape,
): BrandingShape {
  return {
    logo: isMissing(current?.logo) ? (defaults.logo ?? null) : current?.logo,
    themeColor: isMissing(current?.themeColor)
      ? (defaults.themeColor ?? null)
      : current?.themeColor,
    textColor: isMissing(current?.textColor)
      ? (defaults.textColor ?? null)
      : current?.textColor,
    bannerImage: isMissing(current?.bannerImage)
      ? (defaults.bannerImage ?? null)
      : current?.bannerImage,
    header: isMissing(current?.header)
      ? (defaults.header ?? null)
      : current?.header,
    subtitle: isMissing(current?.subtitle)
      ? (defaults.subtitle ?? null)
      : current?.subtitle,
  };
}

/** GET returns current business or null when admin has no business (onboarding). */
export const GET = withAdminAuthOptionalBusiness(async (request, context) => {
  try {
    if (!context.business) {
      return NextResponse.json({ business: null });
    }

    const business = await db.business.findUnique({
      where: { id: context.business.id },
      include: {
        defaultBranding: true,
        referralProgram: { select: { id: true } },
        loyalty: { select: { id: true } },
        feedbackConfig: { select: { id: true } },
      },
    });

    if (!business) {
      return NextResponse.json({ business: null });
    }

    const businessWithComputed = {
      ...business,
    };

    return NextResponse.json({ business: businessWithComputed });
  } catch (error: any) {
    console.error("Failed to fetch current business:", error);
    return NextResponse.json(
      {
        business: null,
        error:
          sanitizeErrorMessage(error) ||
          "Failed to fetch business. Please try again.",
      },
      { status: 500 },
    );
  }
});

export const PUT = withAdminAuth(async (request, context) => {
  try {
    const body = await request.json();

    const validation = validateSchema(updateBusinessSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { business: null, error: validation.error },
        { status: 400 },
      );
    }
    const validatedData = validation.data;

    const businessId = context.business.id;

    const business = await db.business.findUnique({
      where: { id: businessId },
      select: {
        isServiceEnabled: true,
        useDefaultBrandingForServices: true,
        feedbackConfig: { select: { id: true } },
      },
    });

    const mergedServiceEnabled =
      validatedData.serviceEnabled != null &&
      Object.keys(validatedData.serviceEnabled).length > 0
        ? mergeServiceEnabled(
            (business?.isServiceEnabled ?? null) as IsServiceEnabled | null,
            validatedData.serviceEnabled,
          )
        : undefined;

    const shouldSeedFeedback =
      mergedServiceEnabled?.feedback === true && !business?.feedbackConfig?.id;

    const updated = await db.$transaction(async (tx) => {
      if (shouldSeedFeedback) {
        await tx.feedbackConfig.create({
          data: {
            businessId,
            positiveFollowUp: FEEDBACK_FORM_DEFAULTS.followUpMessage,
            negativeFollowUp: FEEDBACK_FORM_DEFAULTS.followUpMessage,
            selectionOptions: {
              create: FEEDBACK_FORM_DEFAULTS.selectionOptions.map(
                (label, idx) => ({
                  label,
                  seq: idx,
                }),
              ),
            },
          },
        });
      }

      return tx.business.update({
        where: { id: businessId },
        data: {
          name: validatedData.name ?? undefined,
          website:
            validatedData.website !== undefined
              ? validatedData.website
              : undefined,
          defaultPointsName: validatedData.defaultPointsName ?? undefined,
          defaultCurrencySymbol:
            validatedData.defaultCurrencySymbol ?? undefined,
          defaultCurrencyCode: validatedData.defaultCurrencyCode ?? undefined,
          useDefaultBrandingForServices:
            validatedData.useDefaultBrandingForServices ?? undefined,
          registrationBonusPoints:
            validatedData.registrationBonusPoints ?? undefined,
          nextBillNumber: validatedData.nextBillNumber ?? undefined,
          ...(mergedServiceEnabled !== undefined && {
            isServiceEnabled: mergedServiceEnabled,
          }),
          defaultBranding: validatedData.defaultBranding
            ? {
                upsert: {
                  create: {
                    logo: validatedData.defaultBranding.logo ?? null,
                    themeColor:
                      validatedData.defaultBranding.themeColor ?? null,
                    textColor: validatedData.defaultBranding.textColor ?? null,
                    bannerImage:
                      validatedData.defaultBranding.bannerImage ?? null,
                    header: validatedData.defaultBranding.header ?? null,
                    subtitle: validatedData.defaultBranding.subtitle ?? null,
                  },
                  update: {
                    logo: validatedData.defaultBranding.logo ?? null,
                    themeColor:
                      validatedData.defaultBranding.themeColor ?? null,
                    textColor: validatedData.defaultBranding.textColor ?? null,
                    bannerImage:
                      validatedData.defaultBranding.bannerImage ?? null,
                    header: validatedData.defaultBranding.header ?? null,
                    subtitle: validatedData.defaultBranding.subtitle ?? null,
                  },
                },
              }
            : undefined,
        },
        include: {
          defaultBranding: true,
          referralProgram: { select: { id: true } },
          loyalty: { select: { id: true } },
          feedbackConfig: { select: { id: true } },
        },
      });
    });

    // Propagate default branding into referral / campaigns / feedback / loyalty when:
    // - "Use default branding" is on, and
    // - This request changed default branding (or turned that switch on).
    // Service on/off flags do not gate this; only whether a row exists (e.g. feedbackConfig).
    const previousUseDefault = business?.useDefaultBrandingForServices ?? false;
    const turnedOnDefaultBranding =
      validatedData.useDefaultBrandingForServices === true &&
      !previousUseDefault;
    const shouldCascadeBranding =
      updated.useDefaultBrandingForServices &&
      updated.defaultBranding &&
      (validatedData.defaultBranding !== undefined || turnedOnDefaultBranding);

    const defaultBrandingRow = updated.defaultBranding;
    if (shouldCascadeBranding && defaultBrandingRow) {
      const defaults: BrandingShape = {
        logo: defaultBrandingRow.logo ?? null,
        themeColor: defaultBrandingRow.themeColor ?? null,
        textColor: defaultBrandingRow.textColor ?? null,
        bannerImage: defaultBrandingRow.bannerImage ?? null,
        header: defaultBrandingRow.header ?? null,
        subtitle: defaultBrandingRow.subtitle ?? null,
      };

      // Referral keeps branding in JSON; backfill only missing fields.
      const referralProgram = await db.referralProgram.findUnique({
        where: { businessId },
        select: { id: true, branding: true },
      });
      if (referralProgram) {
        const mergedReferralBranding = fillMissingBranding(
          (referralProgram.branding as BrandingShape | null | undefined) ??
            null,
          defaults,
        );
        await db.referralProgram.update({
          where: { id: referralProgram.id },
          data: { branding: mergedReferralBranding as any },
        });
      }

      // Campaign stores branding columns directly; fill only null fields.
      if (defaults.logo != null) {
        await db.campaign.updateMany({
          where: { businessId, logo: null },
          data: { logo: defaults.logo },
        });
      }
      if (defaults.themeColor != null) {
        await db.campaign.updateMany({
          where: { businessId, themeColor: null },
          data: { themeColor: defaults.themeColor },
        });
      }
      if (defaults.textColor != null) {
        await db.campaign.updateMany({
          where: { businessId, textColor: null },
          data: { textColor: defaults.textColor },
        });
      }
      if (defaults.bannerImage != null) {
        await db.campaign.updateMany({
          where: { businessId, bannerImage: null },
          data: { bannerImage: defaults.bannerImage },
        });
      }

      const feedbackConfig = await db.feedbackConfig.findUnique({
        where: { businessId },
        include: { branding: true },
      });
      if (feedbackConfig) {
        const mergedFeedbackBranding = fillMissingBranding(
          feedbackConfig.branding ?? null,
          defaults,
        );
        const canUpdateFeedbackBrandingDirectly =
          !!feedbackConfig.brandingId && !feedbackConfig.branding?.businessId;
        const feedbackBrandingRecord = canUpdateFeedbackBrandingDirectly
          ? await db.branding.update({
              where: { id: feedbackConfig.brandingId! },
              data: mergedFeedbackBranding,
            })
          : await db.branding.create({
              data: mergedFeedbackBranding as any,
            });

        if (
          !feedbackConfig.brandingId ||
          feedbackConfig.branding?.businessId != null
        ) {
          await db.feedbackConfig.update({
            where: { id: feedbackConfig.id },
            data: { brandingId: feedbackBrandingRecord.id },
          });
        }
      }

      const loyalty = await db.loyalty.findUnique({
        where: { businessId },
        include: { branding: true },
      });
      if (loyalty) {
        const mergedLoyaltyBranding = fillMissingBranding(
          loyalty.branding ?? null,
          defaults,
        );
        const canUpdateLoyaltyBrandingDirectly =
          !!loyalty.brandingId && !loyalty.branding?.businessId;
        const loyaltyBrandingRecord = canUpdateLoyaltyBrandingDirectly
          ? await db.branding.update({
              where: { id: loyalty.brandingId! },
              data: mergedLoyaltyBranding,
            })
          : await db.branding.create({
              data: mergedLoyaltyBranding as any,
            });

        if (!loyalty.brandingId || loyalty.branding?.businessId != null) {
          await db.loyalty.update({
            where: { id: loyalty.id },
            data: { brandingId: loyaltyBrandingRecord.id },
          });
        }
      }
    }

    const updatedWithComputed = {
      ...updated,
    };

    return NextResponse.json({ business: updatedWithComputed });
  } catch (error: any) {
    console.error("Failed to update current business:", error);
    return NextResponse.json(
      {
        business: null,
        error:
          sanitizeErrorMessage(error) ||
          "Failed to update business. Please try again.",
      },
      { status: 500 },
    );
  }
});
