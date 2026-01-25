import { auth } from "@/lib/auth/auth";
import { updateBusinessSchema } from "@/lib/schemas/business";
import { sanitizeErrorMessage } from "@/lib/utils/error-handler";
import { prisma } from "@reelo/db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session || !session.user) {
      return NextResponse.json(
        { business: null, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const admin = await prisma.admin.findFirst({
      where: { userId: session.user.id },
      include: {
        business: {
          include: {
            defaultBranding: true,
          },
        },
      },
    });

    if (!admin || !admin.business) {
      return NextResponse.json({ business: null });
    }

    return NextResponse.json({ business: admin.business });
  } catch (error: any) {
    console.error("Failed to fetch current business:", error);
    return NextResponse.json(
      {
        business: null,
        error: sanitizeErrorMessage(error) || "Failed to fetch business. Please try again.",
      },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session || !session.user) {
      return NextResponse.json(
        { business: null, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await request.json();

    let validatedData;
    try {
      validatedData = updateBusinessSchema.parse(body);
    } catch (error: any) {
      if (error.name === "ZodError") {
        const firstError = error.errors?.[0];
        const errorMessage = firstError
          ? `${firstError.path.join(".")}: ${firstError.message}`
          : "Invalid input data";
        return NextResponse.json(
          { business: null, error: errorMessage },
          { status: 400 },
        );
      }
      return NextResponse.json(
        { business: null, error: "Invalid input data" },
        { status: 400 },
      );
    }

    const admin = await prisma.admin.findFirst({
      where: { userId: session.user.id },
      include: {
        business: {
          include: {
            defaultBranding: true,
          },
        },
      },
    });

    if (!admin || !admin.business) {
      return NextResponse.json(
        { business: null, error: "Business not found" },
        { status: 404 },
      );
    }

    const businessId = admin.business.id;

    const updated = await prisma.business.update({
      where: { id: businessId },
      data: {
        name: validatedData.name ?? undefined,
        defaultPointsName: validatedData.defaultPointsName ?? undefined,
        defaultCurrencySymbol: validatedData.defaultCurrencySymbol ?? undefined,
        defaultCurrencyCode: validatedData.defaultCurrencyCode ?? undefined,
        defaultBranding: validatedData.defaultBranding
          ? {
              upsert: {
                create: {
                  logo: validatedData.defaultBranding.logo ?? null,
                  themeColor: validatedData.defaultBranding.themeColor ?? null,
                  textColor: validatedData.defaultBranding.textColor ?? null,
                  bannerImage: validatedData.defaultBranding.bannerImage ?? null,
                  header: validatedData.defaultBranding.header ?? null,
                  subtitle: validatedData.defaultBranding.subtitle ?? null,
                },
                update: {
                  logo: validatedData.defaultBranding.logo ?? null,
                  themeColor: validatedData.defaultBranding.themeColor ?? null,
                  textColor: validatedData.defaultBranding.textColor ?? null,
                  bannerImage: validatedData.defaultBranding.bannerImage ?? null,
                  header: validatedData.defaultBranding.header ?? null,
                  subtitle: validatedData.defaultBranding.subtitle ?? null,
                },
              },
            }
          : undefined,
      },
      include: {
        defaultBranding: true,
      },
    });

    return NextResponse.json({ business: updated });
  } catch (error: any) {
    console.error("Failed to update current business:", error);
    return NextResponse.json(
      {
        business: null,
        error: sanitizeErrorMessage(error) || "Failed to update business. Please try again.",
      },
      { status: 500 },
    );
  }
}


