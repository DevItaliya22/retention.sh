/**
 * getRedeemableInfo — unified redeem/preview logic for a bill.
 * Returns formatted info for cashier API and loyalty application.
 *
 * Same-bill rule: Cashback earned on THIS bill cannot be redeemed on this bill.
 * Available for redeem = wallet.cashbackBalance - cashbackEarnedThisBill (when applicable).
 */

import { getLockedShopifyBalance } from "@/lib/actions/loyalty";
import type { Prisma } from "@reelo/db";
import { TransactionValueKind } from "@reelo/db";
import {
  calculatePointsEarnedForBill,
  calculateRedeemable,
  getAmountForEarning,
  isVisitQualifying,
  loyaltyRecordToContext,
  resolveTierForLifetimeSpend,
  safeAmount,
} from "./helpers";

export interface RewardStageRedeemInfo {
  id: string;
  rewardName: string;
  rewardType: string;
  pointsRequired: number;
  canRedeem: boolean;
  freeItemName: string | null;
  percentageValue: number | null;
  cashAmount: number | null;
}

export interface RewardStageInput {
  id: string;
  rewardType: string;
  pointsRequired: number;
  percentageValue?: number | null;
  cashAmount?: number | null;
  minPurchaseForRedemptionEnabled?: boolean;
  minPurchaseForRedemption?: number | null;
  maxDiscountCapEnabled?: boolean;
  maxDiscountCap?: number | null;
  freeItemSkuId?: string | null;
}

/** Compute discount (₹) from a reward stage. FREE_ITEM returns 0 (handled via line item). */
export function calculateDiscountFromStage(
  stage: RewardStageInput,
  billAmount: number,
): number {
  if (billAmount <= 0) return 0;
  if (
    stage.minPurchaseForRedemptionEnabled &&
    stage.minPurchaseForRedemption != null &&
    billAmount < stage.minPurchaseForRedemption
  ) {
    return 0;
  }
  let raw = 0;
  if (
    stage.rewardType === "PERCENTAGE_DISCOUNT" &&
    stage.percentageValue != null
  ) {
    raw = (billAmount * stage.percentageValue) / 100;
  } else if (stage.rewardType === "CASH_DISCOUNT" && stage.cashAmount != null) {
    raw = stage.cashAmount;
  }
  if (raw <= 0) return 0;
  const capped =
    stage.maxDiscountCapEnabled &&
    stage.maxDiscountCap != null &&
    stage.maxDiscountCap > 0
      ? Math.min(raw, stage.maxDiscountCap)
      : raw;
  return Math.min(Math.floor(capped * 100) / 100, billAmount);
}

export interface RedeemableInfoResult {
  loyaltyType: string;
  /** For CASHBACK/TIER: ₹. For points types: points. */
  availableForRedeem: number;
  /** Max redeemable on this bill (respecting min purchase, caps, same-bill rule). */
  maxRedeemable: number;
  /** Cashback earned this bill (before redeem) — for same-bill rule. CASHBACK/TIER only. */
  cashbackEarnedThisBill: number;
  /** Points/cashback that would be earned this bill (0 if visit doesn't qualify for VISIT_MADE). */
  earnablePoints: number;
  /** CASHBACK/TIER: wallet balance. Points types: points balance. */
  balance: number;
  /** Available cashback (₹). For AMOUNT_SPENT/VISIT_MADE: from feedback, scratch cards, etc. */
  cashbackBalance?: number;
  /** For AMOUNT_SPENT: amountSpentBalance. For VISIT_MADE: visitPointsBalance. */
  pointsBalance?: number;
  /** AMOUNT_SPENT/VISIT_MADE: max cashback redeemable on this bill. */
  maxRedeemableFromCashback?: number;
  /** AMOUNT_SPENT/VISIT_MADE: max points redeemable (1:1 or via reward stage). */
  maxRedeemableFromPoints?: number;
  tierInfo?: { currentTierName: string; cashbackPercentage: number } | null;
  /** TIER only: when resolvedTier is null (customer below first tier), explains why and what to do. */
  tierMessage?: string | null;
  rewardStages: RewardStageRedeemInfo[];
  /** VISIT_MADE: visitCount. */
  visitCount?: number | null;
}

export async function getRedeemableInfo(
  tx: Omit<
    Prisma.TransactionClient,
    "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
  >,
  params: {
    businessId: string;
    customerId: string;
    /** Bill amount (finalAmount or amount before loyalty). */
    billAmount: number;
    /** Subtotal for earning calc when onFinalAmount=false. */
    billSubtotal?: number | null;
    /** If bill exists and we've computed earn, pass it for same-bill rule. */
    cashbackEarnedThisBill?: number;
  },
): Promise<RedeemableInfoResult | null> {
  const {
    businessId,
    customerId,
    billAmount,
    billSubtotal,
    cashbackEarnedThisBill = 0,
  } = params;

  const loyalty = await tx.loyalty.findUnique({
    where: { businessId },
    include: {
      cashbackConfig: true,
      tierConfig: { include: { tiers: { orderBy: { rank: "asc" } } } },
      amountSpentConfig: {
        include: { rewardStages: { orderBy: { pointsRequired: "asc" } } },
      },
      visitMadeConfig: {
        include: { rewardStages: { orderBy: { pointsRequired: "asc" } } },
      },
    },
  });

  if (!loyalty) return null;

  const context = loyaltyRecordToContext(loyalty);
  if (!context) return null;

  const wallet = await tx.wallet.findUnique({
    where: {
      businessId_customerId: { businessId, customerId },
    },
  });

  // Compute lifetimeSpend for TIER: prefer wallet (denormalized), fallback to bills aggregate.
  const billsAgg = await tx.bill.aggregate({
    where: { businessId, customerId },
    _sum: { finalAmount: true },
  });
  const aggregateSpend = billsAgg._sum.finalAmount ?? 0;
  const lifetimeSpend =
    wallet?.lifetimeSpend != null && wallet.lifetimeSpend > 0
      ? wallet.lifetimeSpend
      : aggregateSpend;

  const resolvedTier =
    context.type === "TIER"
      ? resolveTierForLifetimeSpend(context.config.tiers, lifetimeSpend)
      : null;

  const isCashbackType = context.type === "CASHBACK" || context.type === "TIER";

  const amountForEarning = getAmountForEarning(
    context,
    billAmount,
    billSubtotal ?? null,
    billAmount,
  );

  const cashbackEarned = isCashbackType
    ? calculatePointsEarnedForBill(amountForEarning, context, { resolvedTier })
    : 0;

  const visitQualifies =
    context.type !== "VISIT_MADE" ||
    isVisitQualifying(context.config, wallet?.lastVisitAt ?? null);
  const rawEarnable = visitQualifies
    ? calculatePointsEarnedForBill(amountForEarning, context, { resolvedTier })
    : 0;

  const cashbackBal = wallet?.cashbackBalance ?? 0;
  const amountSpentBal = wallet?.amountSpentBalance ?? 0;
  const visitPointsBal = wallet?.visitPointsBalance ?? 0;

  const lockedCashback = await getLockedShopifyBalance(tx, {
    businessId,
    customerId,
    valueKind: TransactionValueKind.CASHBACK,
  });
  const lockedAmountSpent = await getLockedShopifyBalance(tx, {
    businessId,
    customerId,
    valueKind: TransactionValueKind.AMOUNT_SPENT_POINTS,
  });
  const lockedVisit = await getLockedShopifyBalance(tx, {
    businessId,
    customerId,
    valueKind: TransactionValueKind.VISIT_POINTS,
  });
  const effectiveCashbackBal = Math.max(0, cashbackBal - lockedCashback);
  const effectiveAmountSpentBal = Math.max(
    0,
    amountSpentBal - lockedAmountSpent,
  );
  const effectiveVisitPointsBal = Math.max(0, visitPointsBal - lockedVisit);

  // Same-bill rule: when allowSameBillRedemption is false, exclude earned this bill from redeemable.
  const allowSameBill =
    "allowSameBillRedemption" in context.config
      ? (context.config.allowSameBillRedemption ??
        (isCashbackType ? false : true))
      : isCashbackType
        ? false
        : true;
  const availableCashback =
    isCashbackType && !allowSameBill
      ? Math.max(0, effectiveCashbackBal - (cashbackEarnedThisBill || 0))
      : effectiveCashbackBal;

  const pointsBal =
    context.type === "AMOUNT_SPENT"
      ? effectiveAmountSpentBal
      : effectiveVisitPointsBal;
  const effectivePointsForRedeem =
    !isCashbackType && !allowSameBill
      ? Math.max(0, pointsBal - (rawEarnable > 0 ? rawEarnable : 0))
      : pointsBal;

  const balanceForRedeemable = isCashbackType
    ? availableCashback
    : effectivePointsForRedeem;

  const maxRedeemable = calculateRedeemable(
    safeAmount(billAmount),
    balanceForRedeemable,
    context,
    { resolvedTier },
  );

  const maxRedeemableCashback = isCashbackType
    ? Math.floor(maxRedeemable * 100) / 100
    : 0;
  const maxRedeemablePoints = !isCashbackType ? Math.floor(maxRedeemable) : 0;

  const stages =
    context.type === "AMOUNT_SPENT"
      ? (loyalty.amountSpentConfig?.rewardStages ?? [])
      : context.type === "VISIT_MADE"
        ? (loyalty.visitMadeConfig?.rewardStages ?? [])
        : [];

  const rewardStages: RewardStageRedeemInfo[] = stages.map((s) => ({
    id: s.id,
    rewardName: s.rewardName,
    rewardType: s.rewardType,
    pointsRequired: s.pointsRequired,
    canRedeem: s.pointsRequired <= effectivePointsForRedeem,
    freeItemName: s.freeItemName,
    percentageValue: s.percentageValue,
    cashAmount: s.cashAmount,
  }));

  const earnablePoints = isCashbackType
    ? cashbackEarned
    : Math.max(0, rawEarnable);

  // For AMOUNT_SPENT/VISIT_MADE: return both so redeem page shows "available cashback" and "available points"
  const cashbackBalanceValue = isCashbackType
    ? effectiveCashbackBal
    : availableCashback;
  const pointsBalanceValue = !isCashbackType ? pointsBal : undefined;
  const maxRedeemableFromCashbackValue = !isCashbackType
    ? Math.min(availableCashback, billAmount)
    : undefined;
  const maxRedeemableFromPointsValue = !isCashbackType
    ? maxRedeemablePoints
    : undefined;

  return {
    loyaltyType: context.type,
    availableForRedeem: isCashbackType
      ? availableCashback
      : effectivePointsForRedeem,
    maxRedeemable: isCashbackType ? maxRedeemableCashback : maxRedeemablePoints,
    cashbackEarnedThisBill: cashbackEarned,
    earnablePoints,
    balance: isCashbackType ? effectiveCashbackBal : pointsBal,
    cashbackBalance: cashbackBalanceValue,
    pointsBalance: pointsBalanceValue,
    maxRedeemableFromCashback: maxRedeemableFromCashbackValue,
    maxRedeemableFromPoints: maxRedeemableFromPointsValue,
    tierInfo:
      context.type === "TIER" && resolvedTier
        ? {
            currentTierName: resolvedTier.name,
            cashbackPercentage: resolvedTier.cashbackPercentage,
          }
        : null,
    tierMessage:
      context.type === "TIER" &&
      !resolvedTier &&
      context.config.tiers.length > 0
        ? (() => {
            const first = context.config.tiers.reduce((a, b) =>
              a.rank <= b.rank ? a : b,
            );
            const spendToReach = Math.max(
              0,
              first.minLifetimeSpend - lifetimeSpend,
            );
            return `Not in any tier yet. Spend ₹${spendToReach.toLocaleString()} more to reach ${first.name} and earn cashback.`;
          })()
        : null,
    rewardStages,
    visitCount: wallet?.visitCount ?? null,
  };
}
