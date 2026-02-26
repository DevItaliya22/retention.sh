import {
  expirePointsForCustomer,
  getBusinessLoyaltyContext,
} from "@/lib/actions/loyalty";
import { withCashierAuth } from "@/lib/auth/middleware";
import { runTransaction } from "@/lib/db/transaction";
import {
  calculatePointsEarnedForBill,
  getAmountForEarning,
  getPartnerRedeemableInfo,
  getRedeemableInfo,
} from "@/lib/loyalty";
import { loyaltyPreviewSchema } from "@/lib/schemas/loyalty";
import {
  sanitizeErrorMessage,
  validateSchema,
} from "@/lib/utils/error-handler";
import { parseFreeItems } from "@/lib/utils/free-items";
import { formatPhoneNumber } from "@/lib/utils/phone";
import {
  type IsServiceEnabled,
  isServiceEnabled,
} from "@/lib/utils/service-enabled";
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

    const { phone, businessId, billAmount, subtotal } = validation.data;

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

    const result = await runTransaction(async (tx) => {
      const loyaltyContext = await getBusinessLoyaltyContext(tx, businessId);
      if (!loyaltyContext) {
        return {
          loyaltyType: "NONE" as const,
          pointsBalance: 0,
          redeemablePoints: 0,
          earnablePoints: 0,
          expiringBuckets: [] as {
            id: string;
            remainingAmount: number;
            expiresAt: string;
          }[],
          cashbackInFinalAmount: false,
          tierInfo: null,
          tierMessage: null as string | null,
          rewardStages: [] as {
            id: string;
            rewardName: string;
            rewardType: string;
            pointsRequired: number;
            canRedeem: boolean;
            freeItemName: string | null;
            percentageValue: number | null;
            cashAmount: number | null;
          }[],
          visitCount: null as number | null,
          freeItems: [],
          partnerRedeemable: [],
        };
      }

      const user = await tx.user.findUnique({
        where: { phoneNumber: formattedPhone },
        include: { customer: true },
      });

      const amountForEarning = getAmountForEarning(
        loyaltyContext,
        billAmount,
        subtotal ?? null,
        billAmount,
      );

      if (!user?.customer) {
        const earnablePoints = calculatePointsEarnedForBill(
          amountForEarning,
          loyaltyContext,
        );
        return {
          loyaltyType: loyaltyContext.type,
          pointsBalance: 0,
          redeemablePoints: 0,
          earnablePoints,
          expiringBuckets: [],
          cashbackInFinalAmount:
            loyaltyContext.type === "CASHBACK"
              ? loyaltyContext.config.onFinalAmount
              : false,
          tierInfo: null,
          tierMessage: null,
          rewardStages: [],
          visitCount: null,
          freeItems: [],
          partnerRedeemable: [],
        };
      }

      await expirePointsForCustomer(tx, {
        businessId,
        customerId: user.customer.id,
      });

      const redeemInfo = await getRedeemableInfo(tx, {
        businessId,
        customerId: user.customer.id,
        billAmount,
        billSubtotal: subtotal,
      });

      if (!redeemInfo) {
        const earnablePoints = calculatePointsEarnedForBill(
          amountForEarning,
          loyaltyContext,
        );
        return {
          loyaltyType: loyaltyContext.type,
          pointsBalance: 0,
          redeemablePoints: 0,
          earnablePoints,
          expiringBuckets: [],
          cashbackInFinalAmount: false,
          tierInfo: null,
          tierMessage: null,
          rewardStages: [],
          visitCount: null,
          freeItems: [],
          partnerRedeemable: [],
        };
      }

      const wallet = await tx.wallet.findUnique({
        where: {
          businessId_customerId: {
            businessId,
            customerId: user.customer.id,
          },
        },
      });

      const earnablePoints = redeemInfo.earnablePoints;

      const redeemablePoints =
        redeemInfo.loyaltyType === "CASHBACK" ||
        redeemInfo.loyaltyType === "TIER"
          ? Math.floor(redeemInfo.maxRedeemable * 100) / 100
          : Math.floor(redeemInfo.maxRedeemable);

      const partnerRedeemable = await getPartnerRedeemableInfo(tx, {
        currentBusinessId: businessId,
        customerId: user.customer.id,
        billAmount,
      });

      return {
        loyaltyType: redeemInfo.loyaltyType,
        pointsBalance: redeemInfo.pointsBalance ?? 0,
        cashbackBalance: redeemInfo.cashbackBalance,
        redeemablePoints,
        earnablePoints,
        expiringBuckets: [],
        cashbackInFinalAmount:
          loyaltyContext.type === "CASHBACK"
            ? loyaltyContext.config.onFinalAmount
            : loyaltyContext.type === "TIER"
              ? loyaltyContext.config.onFinalAmount
              : false,
        tierInfo: redeemInfo.tierInfo,
        tierMessage: redeemInfo.tierMessage ?? null,
        rewardStages: redeemInfo.rewardStages,
        visitCount: redeemInfo.visitCount,
        freeItems: parseFreeItems(wallet?.freeItems),
        partnerRedeemable,
      };
    });

    return NextResponse.json({ preview: result });
  } catch (error: unknown) {
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
