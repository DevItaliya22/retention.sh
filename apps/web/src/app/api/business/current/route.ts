import {
  withAdminAuth,
  withAdminAuthOptionalBusiness,
} from "@/lib/auth/middleware";
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
      select: { isServiceEnabled: true },
    });

    const mergedServiceEnabled =
      validatedData.serviceEnabled != null &&
      Object.keys(validatedData.serviceEnabled).length > 0
        ? mergeServiceEnabled(
            (business?.isServiceEnabled ?? null) as IsServiceEnabled | null,
            validatedData.serviceEnabled,
          )
        : undefined;

    const updated = await db.business.update({
      where: { id: businessId },
      data: {
        name: validatedData.name ?? undefined,
        website:
          validatedData.website !== undefined
            ? validatedData.website
            : undefined,
        defaultPointsName: validatedData.defaultPointsName ?? undefined,
        defaultCurrencySymbol: validatedData.defaultCurrencySymbol ?? undefined,
        defaultCurrencyCode: validatedData.defaultCurrencyCode ?? undefined,
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
                  themeColor: validatedData.defaultBranding.themeColor ?? null,
                  textColor: validatedData.defaultBranding.textColor ?? null,
                  bannerImage:
                    validatedData.defaultBranding.bannerImage ?? null,
                  header: validatedData.defaultBranding.header ?? null,
                  subtitle: validatedData.defaultBranding.subtitle ?? null,
                },
                update: {
                  logo: validatedData.defaultBranding.logo ?? null,
                  themeColor: validatedData.defaultBranding.themeColor ?? null,
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
