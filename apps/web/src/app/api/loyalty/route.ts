import { withAdminAuth } from "@/lib/auth/middleware";
import { loyaltySettingsSchema } from "@/lib/schemas/loyalty";
import {
  sanitizeErrorMessage,
  validateSchema,
} from "@/lib/utils/error-handler";
import { db } from "@reelo/db";
import { NextResponse } from "next/server";

export const GET = withAdminAuth(async (_request, context) => {
  try {
    const loyalty = await db.loyalty.findUnique({
      where: { businessId: context.business.id },
      include: {
        termsAndConditions: { orderBy: { createdAt: "asc" } },
        branding: true,
      },
    });

    if (!loyalty) {
      return NextResponse.json({ loyalty: null });
    }

    const mapped = {
      ...loyalty,
      termsAndConditions: loyalty.termsAndConditions.map((t) => ({
        id: t.id,
        content: t.content,
      })),
      branding: loyalty.branding
        ? {
            logo: loyalty.branding.logo,
            themeColor: loyalty.branding.themeColor,
            textColor: loyalty.branding.textColor,
            bannerImage: loyalty.branding.bannerImage,
            header: loyalty.branding.header,
            subtitle: loyalty.branding.subtitle,
          }
        : null,
    };

    return NextResponse.json({ loyalty: mapped });
  } catch (error: any) {
    console.error("Failed to fetch loyalty settings:", error);
    return NextResponse.json(
      {
        loyalty: null,
        error:
          sanitizeErrorMessage(error) ||
          "Failed to fetch loyalty settings. Please try again.",
      },
      { status: 500 },
    );
  }
});

export const POST = withAdminAuth(async (request, context) => {
  try {
    const body = await request.json();
    const validation = validateSchema(loyaltySettingsSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { loyalty: null, error: validation.error },
        { status: 400 },
      );
    }

    const data = validation.data;
    const businessId = context.business.id;

    let brandingId: string | null = null;
    if (data.branding != null) {
      const branding = await db.branding.upsert({
        where: { businessId },
        create: {
          businessId,
          logo: data.branding.logo ?? null,
          themeColor: data.branding.themeColor ?? null,
          textColor: data.branding.textColor ?? null,
          bannerImage: data.branding.bannerImage ?? null,
          header: data.branding.header ?? null,
          subtitle: data.branding.subtitle ?? null,
        },
        update: {
          logo: data.branding.logo ?? null,
          themeColor: data.branding.themeColor ?? null,
          textColor: data.branding.textColor ?? null,
          bannerImage: data.branding.bannerImage ?? null,
          header: data.branding.header ?? null,
          subtitle: data.branding.subtitle ?? null,
        },
      });
      brandingId = branding.id;
    }

    const loyalty = await db.loyalty.upsert({
      where: { businessId },
      create: {
        businessId,
        brandingId,
        earningPercentage: data.earningPercentage,
        earnPointsOnPaidAmountOnly: data.earnPointsOnPaidAmountOnly ?? true,
        cashbackInFinalAmount: data.cashbackInFinalAmount ?? false,
        cashbackBranding: data.cashbackBranding ?? null,
        minPurchaseForEarning: data.minPurchaseForEarning ?? 0,
        minPurchaseForRedemption: data.minPurchaseForRedemption ?? 0,
        upperLimitBillAmount: data.upperLimitBillAmount ?? null,
        upperLimitClaimableAmount: data.upperLimitClaimableAmount ?? null,
        pointReminderDays: data.pointReminderDays ?? null,
        pointExpiryDays: data.pointExpiryDays ?? null,
        whatsappEnabled: data.whatsappEnabled ?? false,
        emailEnabled: data.emailEnabled ?? false,
        smsEnabled: data.smsEnabled ?? false,
      },
      update: {
        ...(brandingId != null && { brandingId }),
        earningPercentage: data.earningPercentage,
        earnPointsOnPaidAmountOnly: data.earnPointsOnPaidAmountOnly ?? true,
        cashbackInFinalAmount: data.cashbackInFinalAmount ?? false,
        cashbackBranding: data.cashbackBranding ?? null,
        minPurchaseForEarning: data.minPurchaseForEarning ?? 0,
        minPurchaseForRedemption: data.minPurchaseForRedemption ?? 0,
        upperLimitBillAmount: data.upperLimitBillAmount ?? null,
        upperLimitClaimableAmount: data.upperLimitClaimableAmount ?? null,
        pointReminderDays: data.pointReminderDays ?? null,
        pointExpiryDays: data.pointExpiryDays ?? null,
        whatsappEnabled: data.whatsappEnabled ?? false,
        emailEnabled: data.emailEnabled ?? false,
        smsEnabled: data.smsEnabled ?? false,
      },
    });

    const rawTerms = data.termsAndConditions ?? [];
    const terms = rawTerms.filter(
      (s): s is string => typeof s === "string" && s.trim().length > 0,
    );

    await db.$transaction([
      db.termsAndConditions.deleteMany({
        where: { loyaltyId: loyalty.id },
      }),
      ...terms.map((content) =>
        db.termsAndConditions.create({
          data: {
            content: content.trim(),
            loyaltyId: loyalty.id,
          },
        }),
      ),
    ]);

    const updated = await db.loyalty.findUnique({
      where: { businessId },
      include: {
        termsAndConditions: { orderBy: { createdAt: "asc" } },
        branding: true,
      },
    });

    const mapped = updated
      ? {
          ...updated,
          termsAndConditions: updated.termsAndConditions.map((t) => ({
            id: t.id,
            content: t.content,
          })),
          branding: updated.branding
            ? {
                logo: updated.branding.logo,
                themeColor: updated.branding.themeColor,
                textColor: updated.branding.textColor,
                bannerImage: updated.branding.bannerImage,
                header: updated.branding.header,
                subtitle: updated.branding.subtitle,
              }
            : null,
        }
      : loyalty;

    return NextResponse.json({ loyalty: mapped });
  } catch (error: any) {
    console.error("Failed to create/update loyalty settings:", error);
    return NextResponse.json(
      {
        loyalty: null,
        error:
          sanitizeErrorMessage(error) ||
          "Failed to save loyalty settings. Please try again.",
      },
      { status: 500 },
    );
  }
});

export const PUT = withAdminAuth(async (request, context) => {
  try {
    const body = await request.json();
    const validation = validateSchema(loyaltySettingsSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { loyalty: null, error: validation.error },
        { status: 400 },
      );
    }

    const data = validation.data;
    const businessId = context.business.id;

    const existing = await db.loyalty.findUnique({
      where: { businessId },
    });

    if (!existing) {
      return NextResponse.json(
        { loyalty: null, error: "Loyalty settings not found" },
        { status: 404 },
      );
    }

    let brandingId: string | null | undefined = undefined;
    if (data.branding != null) {
      const branding = await db.branding.upsert({
        where: { businessId },
        create: {
          businessId,
          logo: data.branding.logo ?? null,
          themeColor: data.branding.themeColor ?? null,
          textColor: data.branding.textColor ?? null,
          bannerImage: data.branding.bannerImage ?? null,
          header: data.branding.header ?? null,
          subtitle: data.branding.subtitle ?? null,
        },
        update: {
          logo: data.branding.logo ?? null,
          themeColor: data.branding.themeColor ?? null,
          textColor: data.branding.textColor ?? null,
          bannerImage: data.branding.bannerImage ?? null,
          header: data.branding.header ?? null,
          subtitle: data.branding.subtitle ?? null,
        },
      });
      brandingId = branding.id;
    }

    const loyalty = await db.loyalty.update({
      where: { businessId },
      data: {
        ...(brandingId != null && { brandingId }),
        earningPercentage: data.earningPercentage,
        earnPointsOnPaidAmountOnly: data.earnPointsOnPaidAmountOnly ?? true,
        cashbackInFinalAmount: data.cashbackInFinalAmount ?? false,
        cashbackBranding: data.cashbackBranding ?? null,
        minPurchaseForEarning: data.minPurchaseForEarning ?? 0,
        minPurchaseForRedemption: data.minPurchaseForRedemption ?? 0,
        upperLimitBillAmount: data.upperLimitBillAmount ?? null,
        upperLimitClaimableAmount: data.upperLimitClaimableAmount ?? null,
        pointReminderDays: data.pointReminderDays ?? null,
        pointExpiryDays: data.pointExpiryDays ?? null,
        whatsappEnabled: data.whatsappEnabled ?? false,
        emailEnabled: data.emailEnabled ?? false,
        smsEnabled: data.smsEnabled ?? false,
      },
    });

    const rawTerms = data.termsAndConditions ?? [];
    const terms = rawTerms.filter(
      (s): s is string => typeof s === "string" && s.trim().length > 0,
    );

    await db.$transaction([
      db.termsAndConditions.deleteMany({
        where: { loyaltyId: loyalty.id },
      }),
      ...terms.map((content) =>
        db.termsAndConditions.create({
          data: {
            content: content.trim(),
            loyaltyId: loyalty.id,
          },
        }),
      ),
    ]);

    const updated = await db.loyalty.findUnique({
      where: { businessId },
      include: {
        termsAndConditions: { orderBy: { createdAt: "asc" } },
        branding: true,
      },
    });

    const mapped = updated
      ? {
          ...updated,
          termsAndConditions: updated.termsAndConditions.map((t) => ({
            id: t.id,
            content: t.content,
          })),
          branding: updated.branding
            ? {
                logo: updated.branding.logo,
                themeColor: updated.branding.themeColor,
                textColor: updated.branding.textColor,
                bannerImage: updated.branding.bannerImage,
                header: updated.branding.header,
                subtitle: updated.branding.subtitle,
              }
            : null,
        }
      : loyalty;

    return NextResponse.json({ loyalty: mapped });
  } catch (error: any) {
    console.error("Failed to update loyalty settings:", error);
    return NextResponse.json(
      {
        loyalty: null,
        error:
          sanitizeErrorMessage(error) ||
          "Failed to update loyalty settings. Please try again.",
      },
      { status: 500 },
    );
  }
});
