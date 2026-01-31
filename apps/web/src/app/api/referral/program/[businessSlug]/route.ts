import { referralQuerySchema } from "@/lib/schemas/referral";
import {
  sanitizeErrorMessage,
  validateSchema,
} from "@/lib/utils/error-handler";
import { prisma } from "@reelo/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessSlug: string }> },
) {
  try {
    const { businessSlug } = await params;

    // Find business by slug
    const business = await prisma.business.findUnique({
      where: { slug: businessSlug },
      include: {
        referralProgram: true,
        loyalty: true,
      },
    });

    if (!business) {
      return NextResponse.json(
        { referralProgram: null, error: "Business not found" },
        { status: 404 },
      );
    }

    if (!business.referralEnabled) {
      return NextResponse.json(
        {
          referralProgram: null,
          error: "Referral is not enabled for this business",
        },
        { status: 404 },
      );
    }

    if (!business.referralProgram || !business.referralProgram.isEnabled) {
      return NextResponse.json(
        { referralProgram: null, error: "Referral program not enabled" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      referralProgram: business.referralProgram,
      business: {
        name: business.name,
        slug: business.slug,
        defaultPointsName: business.defaultPointsName,
        defaultCurrencySymbol: business.defaultCurrencySymbol,
        defaultCurrencyCode: business.defaultCurrencyCode,
      },
    });
  } catch (error: any) {
    console.error("Failed to fetch public referral program:", error);
    return NextResponse.json(
      {
        referralProgram: null,
        error:
          sanitizeErrorMessage(error) ||
          "Failed to fetch referral program. Please try again.",
      },
      { status: 500 },
    );
  }
}
