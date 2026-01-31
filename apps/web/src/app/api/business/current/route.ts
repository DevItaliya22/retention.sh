import { withAdminAuth } from "@/lib/auth/middleware";
import { updateBusinessSchema } from "@/lib/schemas/business";
import {
  sanitizeErrorMessage,
  validateSchema,
} from "@/lib/utils/error-handler";
import { prisma } from "@reelo/db";
import { NextResponse } from "next/server";

export const GET = withAdminAuth(async (request, context) => {
  try {
    const business = await prisma.business.findUnique({
      where: { id: context.business.id },
      include: {
        defaultBranding: true,
        referralProgram: { select: { id: true } },
      },
    });

    if (!business) {
      return NextResponse.json({ business: null });
    }

    return NextResponse.json({ business });
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

    const updated = await prisma.business.update({
      where: { id: businessId },
      data: {
        name: validatedData.name ?? undefined,
        defaultPointsName: validatedData.defaultPointsName ?? undefined,
        defaultCurrencySymbol: validatedData.defaultCurrencySymbol ?? undefined,
        defaultCurrencyCode: validatedData.defaultCurrencyCode ?? undefined,
        referralEnabled: validatedData.referralEnabled ?? undefined,
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
      },
    });

    return NextResponse.json({ business: updated });
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
