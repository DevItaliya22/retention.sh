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
import { z } from "zod";

const referralSlugParamSchema = z.object({
  referralSlug: z.string().uuid("Invalid referral link"),
});

/**
 * GET /api/referral/program/by-claim/[referralSlug]
 * Public: returns referral program + business (including branding) for the claim page.
 * Looks up by BusinessCustomer.referralSlug so the claim page can show the same branding as the dev/landing page.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ referralSlug: string }> },
) {
  try {
    const resolved = await params;
    const validation = validateSchema(referralSlugParamSchema, resolved);
    if (!validation.success) {
      return NextResponse.json(
        { referralProgram: null, business: null, error: validation.error },
        { status: 400 },
      );
    }
    const { referralSlug } = validation.data;

    const referrer = await db.businessCustomer.findUnique({
      where: { referralSlug },
      include: {
        business: {
          include: {
            referralProgram: {
              include: {
                newCustomerFreeItemSku: { select: { id: true, name: true } },
                existingCustomerFreeItemSku: {
                  select: { id: true, name: true },
                },
              },
            },
          },
        },
      },
    });

    if (!referrer) {
      return NextResponse.json(
        {
          referralProgram: null,
          business: null,
          error: "Referral link not found",
        },
        { status: 404 },
      );
    }

    const business = referrer.business;

    if (
      !isServiceEnabled(
        business.isServiceEnabled as IsServiceEnabled | null,
        "referral",
      )
    ) {
      return NextResponse.json(
        {
          referralProgram: null,
          business: null,
          error: "Referral is not enabled for this business",
        },
        { status: 404 },
      );
    }

    if (!business.referralProgram || !business.referralProgram.isEnabled) {
      return NextResponse.json(
        {
          referralProgram: null,
          business: null,
          error: "Referral program is not enabled",
        },
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
  } catch (error: unknown) {
    console.error("Failed to fetch referral program by claim slug:", error);
    return NextResponse.json(
      {
        referralProgram: null,
        business: null,
        error:
          sanitizeErrorMessage(error) ||
          "Failed to fetch referral program. Please try again.",
      },
      { status: 500 },
    );
  }
}
