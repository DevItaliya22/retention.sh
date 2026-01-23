import { auth } from "@/lib/auth/auth";
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
        error: error.message || "Failed to fetch business",
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
        name: body.name ?? undefined,
        defaultPointsName: body.defaultPointsName ?? undefined,
        defaultCurrencySymbol: body.defaultCurrencySymbol ?? undefined,
        defaultCurrencyCode: body.defaultCurrencyCode ?? undefined,
        defaultBranding: body.defaultBranding
          ? {
              upsert: {
                create: {
                  logo: body.defaultBranding.logo ?? null,
                  themeColor: body.defaultBranding.themeColor ?? null,
                  textColor: body.defaultBranding.textColor ?? null,
                  bannerImage: body.defaultBranding.bannerImage ?? null,
                  header: body.defaultBranding.header ?? null,
                  subtitle: body.defaultBranding.subtitle ?? null,
                },
                update: {
                  logo: body.defaultBranding.logo ?? null,
                  themeColor: body.defaultBranding.themeColor ?? null,
                  textColor: body.defaultBranding.textColor ?? null,
                  bannerImage: body.defaultBranding.bannerImage ?? null,
                  header: body.defaultBranding.header ?? null,
                  subtitle: body.defaultBranding.subtitle ?? null,
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
        error: error.message || "Failed to update business",
      },
      { status: 500 },
    );
  }
}


