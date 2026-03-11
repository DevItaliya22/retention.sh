import { businessSlugParamSchema } from "@/lib/schemas/common";
import {
  sanitizeErrorMessage,
  validateSchema,
} from "@/lib/utils/error-handler";
import {
  type IsServiceEnabled,
  isServiceEnabled,
} from "@/lib/utils/service-enabled";
import { db } from "@reelo/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessSlug: string }> },
) {
  try {
    const resolved = await params;
    const validation = validateSchema(businessSlugParamSchema, resolved);
    if (!validation.success) {
      return NextResponse.json(
        { referralProgram: null, error: validation.error },
        { status: 400 },
      );
    }
    const { businessSlug } = validation.data;

    // Find business by slug
    const business = await db.business.findUnique({
      where: { slug: businessSlug },
      include: {
        referralProgram: {
          include: {
            newCustomerFreeItemSku: { select: { id: true, name: true } },
            existingCustomerFreeItemSku: { select: { id: true, name: true } },
            termsAndConditionsNewCustomer: { orderBy: { createdAt: "asc" } },
            termsAndConditionsExistingCustomer: {
              orderBy: { createdAt: "asc" },
            },
          },
        },
        loyalty: true,
      },
    });

    if (!business) {
      return NextResponse.json(
        { referralProgram: null, error: "Business not found" },
        { status: 404 },
      );
    }

    if (
      !isServiceEnabled(
        business.isServiceEnabled as IsServiceEnabled | null,
        "referral",
      )
    ) {
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

    const referralProgram = business.referralProgram;
    const mapped = referralProgram
      ? {
          ...referralProgram,
          termsAndConditionsNewCustomer:
            referralProgram.termsAndConditionsNewCustomer.map((t) => ({
              id: t.id,
              content: t.content,
            })),
          termsAndConditionsExistingCustomer:
            referralProgram.termsAndConditionsExistingCustomer.map((t) => ({
              id: t.id,
              content: t.content,
            })),
        }
      : null;

    return NextResponse.json({
      referralProgram: mapped,
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
