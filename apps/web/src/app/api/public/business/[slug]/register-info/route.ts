import { slugParamSchema } from "@/lib/schemas/common";
import { getReadSignedUrl } from "@/lib/storage/r2";
import { validateSchema } from "@/lib/utils/error-handler";
import {
  type IsServiceEnabled,
  isServiceEnabled,
} from "@/lib/utils/service-enabled";
import { db } from "@reelo/db";
import { NextResponse } from "next/server";

/**
 * Public endpoint: returns registration bonus points, points name, business name,
 * and optional branding for the loyalty login/register page. No auth required.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const resolved = await params;
    const validation = validateSchema(slugParamSchema, resolved);
    if (!validation.success) {
      return NextResponse.json(
        {
          registrationBonusPoints: 0,
          pointsName: "Points",
          businessName: null,
          branding: null,
          error: validation.error,
        },
        { status: 400 },
      );
    }
    const { slug } = validation.data;

    const business = await db.business.findUnique({
      where: { slug },
      select: {
        name: true,
        registrationBonusPoints: true,
        defaultPointsName: true,
        isServiceEnabled: true,
        loyalty: {
          select: {
            branding: {
              select: {
                logo: true,
                bannerImage: true,
                themeColor: true,
                textColor: true,
                header: true,
                subtitle: true,
              },
            },
          },
        },
      },
    });

    if (!business) {
      return NextResponse.json({
        registrationBonusPoints: 0,
        pointsName: "Points",
        businessName: null,
        branding: null,
      });
    }

    const loyaltyEnabled = isServiceEnabled(
      business.isServiceEnabled as IsServiceEnabled | null | undefined,
      "loyalty",
    );

    let branding = null;
    const b = business.loyalty?.branding;
    if (b) {
      const [logoUrl, bannerImageUrl] = await Promise.all([
        b.logo ? getReadSignedUrl(b.logo).catch(() => null) : null,
        b.bannerImage
          ? getReadSignedUrl(b.bannerImage).catch(() => null)
          : null,
      ]);
      branding = {
        logoUrl,
        bannerImageUrl,
        themeColor: b.themeColor ?? null,
        textColor: b.textColor ?? null,
        header: b.header ?? null,
        subtitle: b.subtitle ?? null,
      };
    }

    return NextResponse.json({
      registrationBonusPoints: loyaltyEnabled
        ? (business.registrationBonusPoints ?? 0)
        : 0,
      pointsName: business.defaultPointsName ?? "Points",
      businessName: business.name,
      branding,
    });
  } catch (error) {
    console.error("Failed to fetch register info:", error);
    return NextResponse.json({
      registrationBonusPoints: 0,
      pointsName: "Points",
      businessName: null,
      branding: null,
    });
  }
}
