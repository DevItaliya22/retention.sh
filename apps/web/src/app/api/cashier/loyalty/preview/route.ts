import { withCashierAuth } from "@/lib/auth/middleware";
import {
  type IsServiceEnabled,
  isServiceEnabled,
} from "@/lib/utils/service-enabled";
import {
  calculateEarnedPoints,
  calculateRedeemablePoints,
  expireBucketsForCustomer,
  getBusinessLoyaltySettings,
} from "@/lib/actions/loyalty";
import { loyaltyPreviewSchema } from "@/lib/schemas/loyalty";
import {
  sanitizeErrorMessage,
  validateSchema,
} from "@/lib/utils/error-handler";
import { formatPhoneNumber } from "@/lib/utils/phone";
import { db } from "@reelo/db";
import { NextRequest, NextResponse } from "next/server";

export const GET = withCashierAuth(async (request: NextRequest, context) => {
  try {
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    const validation = validateSchema(loyaltyPreviewSchema, queryParams);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error, preview: null },
        { status: 400 },
      );
    }

    const { phone, businessId, billAmount } = validation.data;

    if (businessId !== context.business.id) {
      return NextResponse.json(
        { error: "Invalid business", preview: null },
        { status: 403 },
      );
    }

    const formattedPhone = formatPhoneNumber(phone);

    const business = await db.business.findUnique({
      where: { id: businessId },
      select: { isServiceEnabled: true },
    });
    if (
      !isServiceEnabled(
        business?.isServiceEnabled as IsServiceEnabled | null | undefined,
        "loyalty",
      )
    ) {
      return NextResponse.json({
        preview: {
          pointsBalance: 0,
          redeemablePoints: 0,
          earnablePoints: 0,
          expiringBuckets: [],
          cashbackInFinalAmount: false,
        },
      });
    }

    const result = await db.$transaction(async (tx) => {
      const settings = await getBusinessLoyaltySettings(tx, businessId);
      if (!settings) {
        return {
          pointsBalance: 0,
          redeemablePoints: 0,
          earnablePoints: 0,
          expiringBuckets: [],
          cashbackInFinalAmount: false,
        };
      }

      const user = await tx.user.findUnique({
        where: { phoneNumber: formattedPhone },
        include: { customer: true },
      });

      if (!user?.customer) {
        return {
          pointsBalance: 0,
          redeemablePoints: 0,
          earnablePoints: calculateEarnedPoints(billAmount, settings),
          expiringBuckets: [],
          cashbackInFinalAmount: settings.cashbackInFinalAmount,
        };
      }

      const businessCustomer = await tx.businessCustomer.findUnique({
        where: {
          businessId_customerId: {
            businessId,
            customerId: user.customer.id,
          },
        },
      });

      if (!businessCustomer) {
        return {
          pointsBalance: 0,
          redeemablePoints: 0,
          earnablePoints: calculateEarnedPoints(billAmount, settings),
          expiringBuckets: [],
          cashbackInFinalAmount: settings.cashbackInFinalAmount,
        };
      }

      await expireBucketsForCustomer(tx, {
        businessId,
        customerId: businessCustomer.customerId,
      });

      const refreshed = await tx.businessCustomer.findUnique({
        where: {
          businessId_customerId: {
            businessId,
            customerId: businessCustomer.customerId,
          },
        },
        select: { pointsBalance: true },
      });

      const pointsBalance = refreshed?.pointsBalance ?? 0;

      const redeemablePoints = calculateRedeemablePoints(
        billAmount,
        settings,
        pointsBalance,
      );

      const expiringBuckets = await tx.pointsBucket.findMany({
        where: {
          businessId,
          customerId: businessCustomer.customerId,
          remainingAmount: { gt: 0 },
          status: "ACTIVE",
        },
        orderBy: { expiresAt: "asc" },
        take: 3,
        select: {
          id: true,
          remainingAmount: true,
          expiresAt: true,
        },
      });

      return {
        pointsBalance,
        redeemablePoints,
        earnablePoints: calculateEarnedPoints(billAmount, settings),
        expiringBuckets: expiringBuckets.map((b) => ({
          id: b.id,
          remainingAmount: b.remainingAmount,
          expiresAt: b.expiresAt.toISOString(),
        })),
        cashbackInFinalAmount: settings.cashbackInFinalAmount,
      };
    });

    return NextResponse.json({ preview: result });
  } catch (error: any) {
    console.error("Failed to fetch loyalty preview:", error);
    return NextResponse.json(
      {
        preview: null,
        error:
          sanitizeErrorMessage(error) ||
          "Failed to fetch loyalty preview. Please try again.",
      },
      { status: 500 },
    );
  }
});
