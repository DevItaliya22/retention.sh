import {
  expireBucketsForCustomer,
  getBusinessLoyaltyContext,
} from "@/lib/actions/loyalty";
import { withCashierAuth } from "@/lib/auth/middleware";
import {
  calculatePointsEarnedForBill,
  calculateRedeemable,
  resolveTierForLifetimeSpend,
} from "@/lib/loyalty";
import { loyaltyPreviewSchema } from "@/lib/schemas/loyalty";
import {
  sanitizeErrorMessage,
  validateSchema,
} from "@/lib/utils/error-handler";
import { formatPhoneNumber } from "@/lib/utils/phone";
import {
  type IsServiceEnabled,
  isServiceEnabled,
} from "@/lib/utils/service-enabled";
import { db, TransactionType } from "@reelo/db";
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

    const result = await db.$transaction(async (tx) => {
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
        };
      }

      // Same amount-for-earning logic as applyLoyaltyForBill (no redemption in preview, so use billAmount for final)
      const amountForEarning =
        (loyaltyContext.type === "CASHBACK" &&
          loyaltyContext.config.onFinalAmount) ||
        (loyaltyContext.type === "AMOUNT_SPENT" &&
          loyaltyContext.config.onFinalAmount)
          ? billAmount
          : subtotal != null && subtotal > 0
            ? subtotal
            : billAmount;

      const user = await tx.user.findUnique({
        where: { phoneNumber: formattedPhone },
        include: { customer: true },
      });

      // Fetch reward stages for AMOUNT_SPENT / VISIT_MADE
      let rewardStagesData: Array<{
        id: string;
        rewardName: string;
        rewardType: string;
        pointsRequired: number;
        freeItemName: string | null;
        percentageValue: number | null;
        cashAmount: number | null;
      }> = [];

      if (
        loyaltyContext.type === "AMOUNT_SPENT" ||
        loyaltyContext.type === "VISIT_MADE"
      ) {
        const loyaltyRecord = await tx.loyalty.findUnique({
          where: { businessId },
          include: {
            amountSpentConfig: {
              include: {
                rewardStages: { orderBy: { pointsRequired: "asc" } },
              },
            },
            visitMadeConfig: {
              include: {
                rewardStages: { orderBy: { pointsRequired: "asc" } },
              },
            },
          },
        });

        const stages =
          loyaltyContext.type === "AMOUNT_SPENT"
            ? (loyaltyRecord?.amountSpentConfig?.rewardStages ?? [])
            : (loyaltyRecord?.visitMadeConfig?.rewardStages ?? []);

        rewardStagesData = stages.map((s) => ({
          id: s.id,
          rewardName: s.rewardName,
          rewardType: s.rewardType,
          pointsRequired: s.pointsRequired,
          freeItemName: s.freeItemName,
          percentageValue: s.percentageValue,
          cashAmount: s.cashAmount,
        }));
      }

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
          expiringBuckets: [] as {
            id: string;
            remainingAmount: number;
            expiresAt: string;
          }[],
          cashbackInFinalAmount:
            loyaltyContext.type === "CASHBACK"
              ? loyaltyContext.config.onFinalAmount
              : false,
          tierInfo: null,
          rewardStages: rewardStagesData.map((s) => ({
            ...s,
            canRedeem: false,
          })),
          visitCount: null as number | null,
        };
      }

      const businessCustomer = await tx.businessCustomer.findUnique({
        where: {
          businessId_customerId: {
            businessId,
            customerId: user.customer.id,
          },
        },
        select: {
          pointsBalance: true,
          lifetimeSpend: true,
          customerId: true,
          visitCount: true,
        },
      });

      if (!businessCustomer) {
        const earnablePoints = calculatePointsEarnedForBill(
          amountForEarning,
          loyaltyContext,
        );
        return {
          loyaltyType: loyaltyContext.type,
          pointsBalance: 0,
          redeemablePoints: 0,
          earnablePoints,
          expiringBuckets: [] as {
            id: string;
            remainingAmount: number;
            expiresAt: string;
          }[],
          cashbackInFinalAmount:
            loyaltyContext.type === "CASHBACK"
              ? loyaltyContext.config.onFinalAmount
              : false,
          tierInfo: null,
          rewardStages: rewardStagesData.map((s) => ({
            ...s,
            canRedeem: false,
          })),
          visitCount: null as number | null,
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

      const resolvedTier =
        loyaltyContext.type === "TIER"
          ? resolveTierForLifetimeSpend(
              loyaltyContext.config.tiers,
              businessCustomer?.lifetimeSpend ?? 0,
            )
          : null;

      const redeemablePoints = Math.floor(
        calculateRedeemable(billAmount, pointsBalance, loyaltyContext, {
          resolvedTier,
        }),
      );

      const expiringRows = await tx.pointsTransaction.findMany({
        where: {
          businessId,
          customerId: businessCustomer.customerId,
          type: TransactionType.EARNED,
          remainingAmount: { gt: 0 },
          expiresAt: { not: null },
        },
        orderBy: { expiresAt: "asc" },
        take: 3,
        select: {
          id: true,
          remainingAmount: true,
          expiresAt: true,
        },
      });

      // Build tier info
      const tierInfo =
        loyaltyContext.type === "TIER" && resolvedTier
          ? {
              currentTierName: resolvedTier.name,
              cashbackPercentage: resolvedTier.cashbackPercentage,
            }
          : null;

      return {
        loyaltyType: loyaltyContext.type,
        pointsBalance,
        redeemablePoints,
        earnablePoints: calculatePointsEarnedForBill(
          amountForEarning,
          loyaltyContext,
          { resolvedTier },
        ),
        expiringBuckets: expiringRows
          .filter((r) => r.expiresAt)
          .map((r) => ({
            id: r.id,
            remainingAmount: r.remainingAmount ?? 0,
            expiresAt: r.expiresAt!.toISOString(),
          })),
        cashbackInFinalAmount:
          loyaltyContext.type === "CASHBACK"
            ? loyaltyContext.config.onFinalAmount
            : false,
        tierInfo,
        rewardStages: rewardStagesData.map((s) => ({
          ...s,
          canRedeem: s.pointsRequired <= pointsBalance,
        })),
        visitCount: businessCustomer.visitCount ?? null,
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
