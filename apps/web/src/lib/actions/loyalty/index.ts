import { runTransaction } from "@/lib/db/transaction";
import {
  calculateCashbackRedeemable,
  calculateDiscountFromStage,
  calculatePointsEarnedForBill,
  calculateRedeemable,
  getAmountForEarning,
  getExpiryDays,
  isVisitQualifying,
  loyaltyRecordToContext,
  resolveTierForLifetimeSpend,
  safeAmount,
  type LoyaltyContext,
} from "@/lib/loyalty";
import {
  isServiceEnabled,
  type IsServiceEnabled,
} from "@/lib/utils/service-enabled";
import {
  db,
  Prisma,
  TransactionSource,
  TransactionType,
  TransactionValueKind,
} from "@reelo/db";

export { DEFAULT_POINT_EXPIRY_DAYS, getExpiryDays } from "@/lib/loyalty";

/** Sum of EARNED amounts from SHOPIFY_ORDER that are still inside return window (lockedUntil > now). */
export async function getLockedShopifyBalance(
  tx: Prisma.TransactionClient,
  params: {
    businessId: string;
    customerId: string;
    valueKind:
      | typeof TransactionValueKind.CASHBACK
      | typeof TransactionValueKind.AMOUNT_SPENT_POINTS
      | typeof TransactionValueKind.VISIT_POINTS;
  },
): Promise<number> {
  const now = new Date();
  const rows = await tx.transaction.findMany({
    where: {
      businessId: params.businessId,
      customerId: params.customerId,
      source: TransactionSource.SHOPIFY_ORDER,
      type: TransactionType.EARNED,
      valueKind: params.valueKind,
    },
    select: { amount: true, metadata: true },
  });
  let sum = 0;
  for (const r of rows) {
    const meta = r.metadata as { lockedUntil?: string } | null;
    const lockedUntil = meta?.lockedUntil ? new Date(meta.lockedUntil) : null;
    if (lockedUntil && lockedUntil > now && r.amount > 0) {
      sum += r.amount;
    }
  }
  return sum;
}

/** Sum of EARNED REFERRAL CASHBACK that is still locked (referrer reward until referred's first bill). */
export async function getLockedReferralBalance(
  tx: Prisma.TransactionClient,
  params: { businessId: string; customerId: string },
): Promise<number> {
  const rows = await tx.transaction.findMany({
    where: {
      businessId: params.businessId,
      customerId: params.customerId,
      source: TransactionSource.REFERRAL,
      type: TransactionType.EARNED,
      valueKind: TransactionValueKind.CASHBACK,
    },
    select: { amount: true, metadata: true },
  });

  const program = await tx.referralProgram.findUnique({
    where: { businessId: params.businessId },
    select: { lockReferralPointsUntilFirstPurchase: true },
  });
  if (!program?.lockReferralPointsUntilFirstPurchase) return 0;

  let sum = 0;
  for (const r of rows) {
    const meta = r.metadata as { referralLogId?: string } | null;
    const referralLogId = meta?.referralLogId;
    if (!referralLogId || r.amount <= 0) continue;

    const log = await tx.referralLog.findUnique({
      where: { id: referralLogId },
      select: {
        referredCustomerId: true,
        referrerRewardUnlockedAt: true,
      },
    });
    if (!log?.referredCustomerId || log.referrerRewardUnlockedAt != null)
      continue;
    sum += r.amount;
  }
  return sum;
}

/** When the referred customer (B) has their first bill in this business, unlock referrer's referral cashback. */
export async function unlockReferrerRewardIfFirstBill(
  tx: Prisma.TransactionClient,
  params: { businessId: string; customerId: string },
): Promise<void> {
  const { businessId, customerId } = params;

  const bc = await tx.businessCustomer.findUnique({
    where: { businessId_customerId: { businessId, customerId } },
    select: { referredByBusinessId: true, referredByCustomerId: true },
  });
  if (!bc?.referredByBusinessId || !bc.referredByCustomerId) return;

  const billCount = await tx.bill.count({
    where: { businessId, customerId },
  });
  if (billCount !== 1) return;

  await tx.referralLog.updateMany({
    where: {
      referredBusinessId: businessId,
      referredCustomerId: customerId,
      referrerRewardUnlockedAt: null,
    },
    data: { referrerRewardUnlockedAt: new Date() },
  });
}

export async function getBusinessLoyaltyContext(
  tx: Prisma.TransactionClient,
  businessId: string,
): Promise<LoyaltyContext | null> {
  const loyalty = await tx.loyalty.findUnique({
    where: { businessId },
    include: {
      cashbackConfig: true,
      tierConfig: { include: { tiers: { orderBy: { rank: "asc" } } } },
      amountSpentConfig: true,
      visitMadeConfig: true,
    },
  });
  return loyaltyRecordToContext(loyalty);
}

const noLoyaltyResult = (billAmount: number): ApplyLoyaltyResult => ({
  loyaltyType: "NONE",
  earnedPoints: 0,
  redeemedPoints: 0,
  cashbackAmount: null,
  cashbackRedeemedAmount: null,
  partnerRedeemedAmount: null,
  pointsBalance: 0,
  finalAmount: billAmount,
});

function pointsValueKind(
  context: LoyaltyContext,
):
  | typeof TransactionValueKind.AMOUNT_SPENT_POINTS
  | typeof TransactionValueKind.VISIT_POINTS {
  return context.type === "AMOUNT_SPENT"
    ? TransactionValueKind.AMOUNT_SPENT_POINTS
    : TransactionValueKind.VISIT_POINTS;
}

async function recordCashbackRedemption(
  tx: Prisma.TransactionClient,
  params: {
    businessId: string;
    customerId: string;
    billId: string;
    loyaltyId: string | null;
    amount: number;
  },
) {
  const { businessId, customerId, billId, loyaltyId, amount } = params;
  if (amount <= 0) return;
  const wallet = await tx.wallet.findUnique({
    where: { businessId_customerId: { businessId, customerId } },
  });
  const balance = Math.max(0, wallet?.cashbackBalance ?? 0);
  if (amount > balance) {
    throw new Error(
      `Insufficient cashback balance: requested ₹${amount}, available ₹${balance}`,
    );
  }
  await tx.transaction.create({
    data: {
      businessId,
      customerId,
      billId,
      loyaltyId,
      valueKind: TransactionValueKind.CASHBACK,
      amount: -amount,
      type: TransactionType.REDEEMED,
      source: TransactionSource.BILL,
      sourceId: billId,
      description: `Redeemed ₹${amount} on bill`,
    },
  });
  await tx.wallet.update({
    where: { businessId_customerId: { businessId, customerId } },
    data: { cashbackBalance: { decrement: amount } },
  });
}

/**
 * Redeem points for bill discount: convert points → cashback first, then use that cashback.
 * Creates 3 transactions on the bill (all linked to billId):
 *   1. Points dec: -N points (REDEEMED)
 *   2. Cashback inc: +discountValue cashback (EARNED) — from converting points
 *   3. Cashback dec: -discountValue cashback (REDEEMED) — used on bill
 */
async function recordPointsRedemptionAsCashbackFlow(
  tx: Prisma.TransactionClient,
  params: {
    businessId: string;
    customerId: string;
    billId: string;
    loyaltyId: string | null;
    context: LoyaltyContext;
    pointsDec: number;
    cashbackValue: number;
    /** When redeeming for FREE_ITEM, pass so we can show "You got: X" on the bill. */
    freeItemReward?: { rewardName: string; freeItemName: string | null };
  },
) {
  const {
    businessId,
    customerId,
    billId,
    loyaltyId,
    context,
    pointsDec,
    cashbackValue,
    freeItemReward,
  } = params;
  if (pointsDec <= 0 || context.type === "CASHBACK" || context.type === "TIER")
    return;
  const wallet = await tx.wallet.findUnique({
    where: { businessId_customerId: { businessId, customerId } },
  });
  const balance =
    context.type === "AMOUNT_SPENT"
      ? Math.max(0, wallet?.amountSpentBalance ?? 0)
      : Math.max(0, wallet?.visitPointsBalance ?? 0);
  if (pointsDec > balance) {
    throw new Error(
      `Insufficient points balance: requested ${pointsDec}, available ${balance}`,
    );
  }
  const valueKind = pointsValueKind(context);

  const pointsDescription = freeItemReward
    ? `Redeemed ${pointsDec} points for: ${freeItemReward.freeItemName ?? freeItemReward.rewardName}`
    : `Redeemed ${pointsDec} points on bill`;

  // 1. Points dec
  await tx.transaction.create({
    data: {
      businessId,
      customerId,
      billId,
      loyaltyId,
      valueKind,
      amount: -pointsDec,
      type: TransactionType.REDEEMED,
      source: TransactionSource.BILL,
      sourceId: billId,
      description: pointsDescription,
      metadata: freeItemReward
        ? {
            rewardType: "FREE_ITEM",
            rewardName: freeItemReward.rewardName,
            freeItemName: freeItemReward.freeItemName,
          }
        : undefined,
    },
  });

  if (freeItemReward) {
    await tx.transaction.create({
      data: {
        businessId,
        customerId,
        billId,
        loyaltyId,
        valueKind: TransactionValueKind.FREE_ITEM,
        amount: 0,
        type: TransactionType.REDEEMED,
        source: TransactionSource.BILL,
        sourceId: billId,
        description: `Claimed: ${freeItemReward.freeItemName ?? freeItemReward.rewardName}`,
        metadata: {
          freeItemClaimed: true,
          freeItemName:
            freeItemReward.freeItemName ?? freeItemReward.rewardName,
          rewardName: freeItemReward.rewardName,
        },
      },
    });
  }

  if (cashbackValue > 0) {
    // 2. Cashback inc (points converted to cashback) — stays in wallet until user "redeems cashback on bill"
    await tx.transaction.create({
      data: {
        businessId,
        customerId,
        billId,
        loyaltyId,
        valueKind: TransactionValueKind.CASHBACK,
        amount: cashbackValue,
        type: TransactionType.EARNED,
        source: TransactionSource.BILL,
        sourceId: billId,
        description: `Points converted to ₹${cashbackValue} cashback`,
        metadata: { fromPointsConversion: true, pointsDeducted: pointsDec },
      },
    });
  }

  const pointsField =
    context.type === "AMOUNT_SPENT"
      ? { amountSpentBalance: { decrement: pointsDec } }
      : { visitPointsBalance: { decrement: pointsDec } };
  const data: {
    amountSpentBalance?: { decrement: number };
    visitPointsBalance?: { decrement: number };
    cashbackBalance?: { increment: number };
  } = pointsField;
  if (cashbackValue > 0) {
    data.cashbackBalance = { increment: cashbackValue };
  }
  await tx.wallet.update({
    where: { businessId_customerId: { businessId, customerId } },
    data,
  });
}

async function recordCashbackEarned(
  tx: Prisma.TransactionClient,
  params: {
    businessId: string;
    customerId: string;
    billId: string;
    loyaltyId: string | null;
    amount: number;
    expiresAt?: Date | null;
    metadata?: Prisma.InputJsonValue;
  },
) {
  const {
    businessId,
    customerId,
    billId,
    loyaltyId,
    amount,
    expiresAt,
    metadata,
  } = params;
  if (amount <= 0) return;
  await tx.transaction.create({
    data: {
      businessId,
      customerId,
      billId,
      loyaltyId,
      valueKind: TransactionValueKind.CASHBACK,
      amount,
      type: TransactionType.EARNED,
      source: TransactionSource.BILL,
      sourceId: billId,
      expiresAt: expiresAt ?? undefined,
      description: `Cashback from bill`,
      metadata: metadata ?? undefined,
    },
  });
  await tx.wallet.update({
    where: { businessId_customerId: { businessId, customerId } },
    data: { cashbackBalance: { increment: amount } },
  });
}

async function recordPointsEarned(
  tx: Prisma.TransactionClient,
  params: {
    businessId: string;
    customerId: string;
    billId: string;
    loyaltyId: string | null;
    context: LoyaltyContext;
    amount: number;
    expiresAt: Date | null;
    updateVisitCount?: boolean;
  },
) {
  const {
    businessId,
    customerId,
    billId,
    loyaltyId,
    context,
    amount,
    expiresAt,
    updateVisitCount,
  } = params;
  if (amount <= 0 || context.type === "CASHBACK" || context.type === "TIER")
    return;
  const valueKind = pointsValueKind(context);
  await tx.transaction.create({
    data: {
      businessId,
      customerId,
      billId,
      loyaltyId,
      valueKind,
      amount,
      type: TransactionType.EARNED,
      source: TransactionSource.BILL,
      sourceId: billId,
      expiresAt,
      description: `Earned ${amount} from bill`,
    },
  });
  const balanceField =
    context.type === "AMOUNT_SPENT"
      ? { amountSpentBalance: { increment: amount } }
      : { visitPointsBalance: { increment: amount } };
  const data = updateVisitCount
    ? {
        ...balanceField,
        visitCount: { increment: 1 },
        lastVisitAt: new Date(),
      }
    : balanceField;
  await tx.wallet.update({
    where: { businessId_customerId: { businessId, customerId } },
    data,
  });
}

/** Ensure Wallet exists for BusinessCustomer. */
async function ensureWallet(
  tx: Prisma.TransactionClient,
  businessId: string,
  customerId: string,
) {
  const existing = await tx.wallet.findUnique({
    where: {
      businessId_customerId: { businessId, customerId },
    },
  });
  if (!existing) {
    await tx.wallet.create({
      data: {
        businessId,
        customerId,
      },
    });
  }
}

/** Expire EARNED points/cashback past expiresAt. Caps by wallet balance to avoid negative. */
export async function expirePointsForCustomer(
  tx: Prisma.TransactionClient,
  params: {
    businessId: string;
    customerId: string;
    now?: Date;
  },
): Promise<{
  expiredAmountSpent: number;
  expiredVisit: number;
  expiredCashback: number;
}> {
  const { businessId, customerId } = params;
  const now = params.now ?? new Date();

  const expiring = await tx.transaction.findMany({
    where: {
      businessId,
      customerId,
      type: TransactionType.EARNED,
      expiresAt: { lt: now, not: null },
      valueKind: {
        in: [
          TransactionValueKind.AMOUNT_SPENT_POINTS,
          TransactionValueKind.VISIT_POINTS,
          TransactionValueKind.CASHBACK,
        ],
      },
    },
    select: { id: true, amount: true, valueKind: true },
    orderBy: { expiresAt: "asc" },
  });

  if (expiring.length === 0) {
    return { expiredAmountSpent: 0, expiredVisit: 0, expiredCashback: 0 };
  }

  let totalAmountSpent = 0;
  let totalVisit = 0;
  let totalCashback = 0;
  for (const r of expiring) {
    const amt = Math.max(0, r.amount);
    if (r.valueKind === TransactionValueKind.AMOUNT_SPENT_POINTS) {
      totalAmountSpent += amt;
    } else if (r.valueKind === TransactionValueKind.VISIT_POINTS) {
      totalVisit += amt;
    } else {
      totalCashback += amt;
    }
  }

  const wallet = await tx.wallet.findUnique({
    where: { businessId_customerId: { businessId, customerId } },
  });
  if (!wallet)
    return { expiredAmountSpent: 0, expiredVisit: 0, expiredCashback: 0 };

  const expiredAmountSpent = Math.min(
    totalAmountSpent,
    Math.max(0, wallet.amountSpentBalance),
  );
  const expiredVisit = Math.min(
    totalVisit,
    Math.max(0, wallet.visitPointsBalance),
  );
  const expiredCashback = Math.min(
    totalCashback,
    Math.max(0, wallet.cashbackBalance),
  );

  if (expiredAmountSpent === 0 && expiredVisit === 0 && expiredCashback === 0) {
    return { expiredAmountSpent: 0, expiredVisit: 0, expiredCashback: 0 };
  }

  const loyalty = await tx.loyalty.findUnique({
    where: { businessId },
    select: { id: true },
  });

  if (expiredAmountSpent > 0) {
    await tx.transaction.create({
      data: {
        businessId,
        customerId,
        valueKind: TransactionValueKind.AMOUNT_SPENT_POINTS,
        amount: -expiredAmountSpent,
        type: TransactionType.EXPIRED,
        source: TransactionSource.MANUAL_ADJUSTMENT,
        loyaltyId: loyalty?.id ?? null,
        description: `Expired ${expiredAmountSpent} points`,
      },
    });
  }
  if (expiredVisit > 0) {
    await tx.transaction.create({
      data: {
        businessId,
        customerId,
        valueKind: TransactionValueKind.VISIT_POINTS,
        amount: -expiredVisit,
        type: TransactionType.EXPIRED,
        source: TransactionSource.MANUAL_ADJUSTMENT,
        loyaltyId: loyalty?.id ?? null,
        description: `Expired ${expiredVisit} visit points`,
      },
    });
  }
  if (expiredCashback > 0) {
    await tx.transaction.create({
      data: {
        businessId,
        customerId,
        valueKind: TransactionValueKind.CASHBACK,
        amount: -expiredCashback,
        type: TransactionType.EXPIRED,
        source: TransactionSource.MANUAL_ADJUSTMENT,
        loyaltyId: loyalty?.id ?? null,
        description: `Expired ₹${expiredCashback} cashback`,
      },
    });
  }

  const updateData: {
    amountSpentBalance?: { decrement: number };
    visitPointsBalance?: { decrement: number };
    cashbackBalance?: { decrement: number };
  } = {};
  if (expiredAmountSpent > 0)
    updateData.amountSpentBalance = { decrement: expiredAmountSpent };
  if (expiredVisit > 0)
    updateData.visitPointsBalance = { decrement: expiredVisit };
  if (expiredCashback > 0)
    updateData.cashbackBalance = { decrement: expiredCashback };

  if (Object.keys(updateData).length > 0) {
    await tx.wallet.update({
      where: { businessId_customerId: { businessId, customerId } },
      data: updateData,
    });
  }

  return { expiredAmountSpent, expiredVisit, expiredCashback };
}

export interface TierUpgradeInfo {
  previousTierName: string | null;
  newTierName: string | null;
  wasUpgraded: boolean;
  newCashbackPercentage: number;
}

export interface CurrentTierInfo {
  name: string;
  cashbackPercentage: number;
  minLifetimeSpend: number;
  maxLifetimeSpend: number | null;
}

export interface ApplyLoyaltyResult {
  loyaltyType: string;
  earnedPoints: number;
  redeemedPoints: number;
  cashbackAmount: number | null;
  cashbackRedeemedAmount: number | null;
  /** Discount (₹) from redeeming partner points/cashback at this bill. */
  partnerRedeemedAmount: number | null;
  pointsBalance: number;
  finalAmount: number;
  tierUpgrade?: TierUpgradeInfo | null;
  currentTier?: CurrentTierInfo | null;
  /** TIER only: when no tier (below first), message for cashier. */
  tierMessage?: string | null;
}

/** Convert points to cashback or free item only. No bill discount. AMOUNT_SPENT/VISIT_MADE only. */
export async function convertPointsForBill(
  tx: Prisma.TransactionClient,
  params: {
    businessId: string;
    customerId: string;
    billId: string;
    billAmount: number;
    rewardStageId: string;
  },
): Promise<{
  pointsBalance: number;
  cashbackBalance: number;
  redeemedFreeItems?: Array<{
    rewardName: string;
    freeItemName: string | null;
  }>;
}> {
  const { businessId, customerId, billId, billAmount, rewardStageId } = params;
  const context = await getBusinessLoyaltyContext(tx, businessId);
  if (
    !context ||
    (context.type !== "AMOUNT_SPENT" && context.type !== "VISIT_MADE")
  ) {
    throw new Error(
      "Convert points is only for AMOUNT_SPENT or VISIT_MADE loyalty",
    );
  }

  await expirePointsForCustomer(tx, { businessId, customerId });
  const wallet = await tx.wallet.findUnique({
    where: { businessId_customerId: { businessId, customerId } },
  });
  const rawPointsBalance =
    context.type === "AMOUNT_SPENT"
      ? Math.max(0, wallet?.amountSpentBalance ?? 0)
      : Math.max(0, wallet?.visitPointsBalance ?? 0);
  const lockedPoints = await getLockedShopifyBalance(tx, {
    businessId,
    customerId,
    valueKind:
      context.type === "AMOUNT_SPENT"
        ? TransactionValueKind.AMOUNT_SPENT_POINTS
        : TransactionValueKind.VISIT_POINTS,
  });
  const pointsBalance = Math.max(0, rawPointsBalance - lockedPoints);

  const allowSameBill = context.config.allowSameBillRedemption ?? true;
  let effectivePointsBalance = pointsBalance;
  if (!allowSameBill) {
    const earnedOnThisBill = await tx.transaction.aggregate({
      where: {
        billId,
        type: TransactionType.EARNED,
        valueKind:
          context.type === "AMOUNT_SPENT"
            ? TransactionValueKind.AMOUNT_SPENT_POINTS
            : TransactionValueKind.VISIT_POINTS,
      },
      _sum: { amount: true },
    });
    const pointsEarnedThisBill = Math.max(0, earnedOnThisBill._sum.amount ?? 0);
    effectivePointsBalance = Math.max(0, pointsBalance - pointsEarnedThisBill);
  }

  const loyalty = await tx.loyalty.findUnique({
    where: { businessId },
    include: {
      amountSpentConfig: { include: { rewardStages: true } },
      visitMadeConfig: { include: { rewardStages: true } },
    },
  });
  const stages =
    context.type === "AMOUNT_SPENT"
      ? (loyalty?.amountSpentConfig?.rewardStages ?? [])
      : (loyalty?.visitMadeConfig?.rewardStages ?? []);
  const stage = stages.find((s) => s.id === rewardStageId);
  if (!stage || stage.pointsRequired > effectivePointsBalance) {
    throw new Error("Invalid reward stage or insufficient points");
  }

  let pointsDec = 0;
  let cashbackValue = 0;
  let freeItemReward:
    | { rewardName: string; freeItemName: string | null }
    | undefined;

  if (stage.rewardType === "FREE_ITEM") {
    const minOk =
      !stage.minPurchaseForRedemptionEnabled ||
      stage.minPurchaseForRedemption == null ||
      billAmount >= stage.minPurchaseForRedemption;
    if (!minOk)
      throw new Error("Bill amount below min purchase for this reward");
    pointsDec = stage.pointsRequired;
    freeItemReward = {
      rewardName: stage.rewardName ?? "Free item",
      freeItemName: stage.freeItemName ?? null,
    };
  } else if (
    stage.rewardType === "PERCENTAGE_DISCOUNT" ||
    stage.rewardType === "CASH_DISCOUNT"
  ) {
    if (billAmount <= 0) {
      throw new Error(
        "Bill amount is 0 or missing. Add items to the bill before converting points.",
      );
    }
    cashbackValue = calculateDiscountFromStage(
      {
        id: stage.id,
        rewardType: stage.rewardType,
        pointsRequired: stage.pointsRequired,
        percentageValue: stage.percentageValue,
        cashAmount: stage.cashAmount,
        minPurchaseForRedemptionEnabled: stage.minPurchaseForRedemptionEnabled,
        minPurchaseForRedemption: stage.minPurchaseForRedemption,
        maxDiscountCapEnabled: stage.maxDiscountCapEnabled,
        maxDiscountCap: stage.maxDiscountCap,
      },
      billAmount,
    );
    if (cashbackValue <= 0) {
      const minMsg =
        stage.minPurchaseForRedemptionEnabled &&
        stage.minPurchaseForRedemption != null
          ? ` Min purchase for this reward: ₹${stage.minPurchaseForRedemption}.`
          : "";
      const configMsg =
        stage.rewardType === "PERCENTAGE_DISCOUNT"
          ? stage.percentageValue == null || stage.percentageValue <= 0
            ? " Reward has no percentage set."
            : ""
          : stage.cashAmount == null || stage.cashAmount <= 0
            ? " Reward has no cash amount set."
            : "";
      throw new Error(
        `Discount could not be computed for this bill (₹${billAmount.toFixed(2)}).${minMsg}${configMsg}`,
      );
    }
    pointsDec = stage.pointsRequired;
  } else {
    throw new Error("Unsupported reward type");
  }

  await recordPointsRedemptionAsCashbackFlow(tx, {
    businessId,
    customerId,
    billId,
    loyaltyId: loyalty?.id ?? null,
    context,
    pointsDec,
    cashbackValue,
    freeItemReward,
  });

  const updated = await tx.wallet.findUnique({
    where: { businessId_customerId: { businessId, customerId } },
  });
  return {
    pointsBalance:
      context.type === "AMOUNT_SPENT"
        ? (updated?.amountSpentBalance ?? 0)
        : (updated?.visitPointsBalance ?? 0),
    cashbackBalance: updated?.cashbackBalance ?? 0,
    redeemedFreeItems:
      freeItemReward != null
        ? [
            {
              rewardName: freeItemReward.rewardName,
              freeItemName: freeItemReward.freeItemName,
            },
          ]
        : undefined,
  };
}

/** Apply only cashback redemption to bill (discount). One cashback redemption per bill. */
export async function applyCashbackRedemptionForBill(
  tx: Prisma.TransactionClient,
  params: {
    businessId: string;
    customerId: string;
    billId: string;
    billAmount: number;
    redeemCashbackRequested: number;
    loyaltyId: string | null;
  },
): Promise<{ finalAmount: number; cashbackRedeemedAmount: number }> {
  const {
    businessId,
    customerId,
    billId,
    billAmount,
    redeemCashbackRequested,
    loyaltyId,
  } = params;
  const amount = Math.max(0, redeemCashbackRequested);
  if (amount <= 0) {
    return { finalAmount: billAmount, cashbackRedeemedAmount: 0 };
  }

  const alreadyCashbackRedeemed = await tx.transaction.count({
    where: {
      billId,
      type: TransactionType.REDEEMED,
      valueKind: TransactionValueKind.CASHBACK,
      source: { not: TransactionSource.CAMPAIGN },
    },
  });
  if (alreadyCashbackRedeemed > 0) {
    throw new Error(
      "This bill has already been redeemed (cashback applied). Redemption can only be done once per bill.",
    );
  }

  await recordCashbackRedemption(tx, {
    businessId,
    customerId,
    billId,
    loyaltyId,
    amount,
  });

  const finalAmount = Math.max(0, billAmount - amount);
  return { finalAmount, cashbackRedeemedAmount: amount };
}

/** Apply redemption only to an existing bill (no earning). For CASHBACK/TIER: cashback only. For AMOUNT_SPENT/VISIT_MADE use convertPointsForBill + applyCashbackRedemptionForBill separately. */
export async function applyRedemptionForBill(
  tx: Prisma.TransactionClient,
  params: {
    businessId: string;
    customerId: string;
    billId: string;
    billAmount: number;
    billSubtotal?: number | null;
    redeemPointsRequested?: number | null;
    redeemCashbackRequested?: number | null;
    /** When set, use reward stage (PERCENTAGE_DISCOUNT/CASH_DISCOUNT) instead of 1pt=₹1. AMOUNT_SPENT/VISIT_MADE only. */
    rewardStageId?: string | null;
    /** Cashback earned on THIS bill — excluded from redeemable (same-bill rule). CASHBACK/TIER only. */
    cashbackEarnedThisBill?: number;
  },
): Promise<ApplyLoyaltyResult> {
  const { businessId, customerId, billId } = params;
  const billAmount = safeAmount(params.billAmount ?? 0);
  const billSubtotal = safeAmount(params.billSubtotal ?? billAmount);
  const requested = Math.max(0, Math.floor(params.redeemPointsRequested ?? 0));
  const redeemCashbackReq = Math.max(0, params.redeemCashbackRequested ?? 0);
  const rewardStageId = params.rewardStageId ?? null;
  const cashbackEarnedThisBill = Math.max(
    0,
    params.cashbackEarnedThisBill ?? 0,
  );

  const context = await getBusinessLoyaltyContext(tx, businessId);
  if (!context) return noLoyaltyResult(billAmount);

  const isCashbackType = context.type === "CASHBACK" || context.type === "TIER";
  const alreadyCashbackRedeemedCount = await tx.transaction.count({
    where: {
      billId,
      type: TransactionType.REDEEMED,
      valueKind: TransactionValueKind.CASHBACK,
      source: { not: TransactionSource.CAMPAIGN },
    },
  });
  if (alreadyCashbackRedeemedCount > 0 && redeemCashbackReq > 0) {
    throw new Error(
      "This bill has already been redeemed (cashback applied). Redemption can only be done once per bill.",
    );
  }

  // AMOUNT_SPENT/VISIT_MADE: use convertPointsForBill + applyCashbackRedemptionForBill from API; here only handle cashback redeem
  const pointsTypeOnlyCashback =
    !isCashbackType &&
    (requested > 0 || rewardStageId != null) &&
    redeemCashbackReq === 0;
  if (pointsTypeOnlyCashback) {
    return noLoyaltyResult(billAmount);
  }

  await expirePointsForCustomer(tx, { businessId, customerId });

  const wallet = await tx.wallet.findUnique({
    where: { businessId_customerId: { businessId, customerId } },
  });

  const billsAgg = await tx.bill.aggregate({
    where: { businessId, customerId },
    _sum: { finalAmount: true },
  });
  const aggregateSpend = billsAgg._sum.finalAmount ?? 0;
  const lifetimeSpend =
    wallet?.lifetimeSpend != null && wallet.lifetimeSpend > 0
      ? wallet.lifetimeSpend
      : aggregateSpend;

  const cashbackBal = Math.max(0, wallet?.cashbackBalance ?? 0);
  const amountSpentBal = Math.max(0, wallet?.amountSpentBalance ?? 0);
  const visitPointsBal = Math.max(0, wallet?.visitPointsBalance ?? 0);

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
  const lockedReferralCashback = await getLockedReferralBalance(tx, {
    businessId,
    customerId,
  });

  const effectiveCashbackBal = Math.max(
    0,
    cashbackBal - lockedCashback - lockedReferralCashback,
  );
  const effectiveAmountSpentBal = Math.max(
    0,
    amountSpentBal - lockedAmountSpent,
  );
  const effectiveVisitPointsBal = Math.max(0, visitPointsBal - lockedVisit);

  const resolvedTier =
    context.type === "TIER"
      ? resolveTierForLifetimeSpend(context.config.tiers, lifetimeSpend)
      : null;

  const pointsBalance =
    context.type === "AMOUNT_SPENT"
      ? effectiveAmountSpentBal
      : context.type === "VISIT_MADE"
        ? effectiveVisitPointsBal
        : 0;

  const allowSameBill =
    "allowSameBillRedemption" in context.config
      ? (context.config.allowSameBillRedemption ??
        (isCashbackType ? false : true))
      : isCashbackType
        ? false
        : true;
  const availableCashback =
    isCashbackType && !allowSameBill
      ? Math.max(0, effectiveCashbackBal - cashbackEarnedThisBill)
      : effectiveCashbackBal;
  const balanceForRedeemable = isCashbackType
    ? availableCashback
    : pointsBalance;
  const redeemable = calculateRedeemable(
    billAmount,
    balanceForRedeemable,
    context,
    { resolvedTier },
  );

  const loyalty = await tx.loyalty.findUnique({
    where: { businessId },
    include: {
      amountSpentConfig: {
        include: { rewardStages: true },
      },
      visitMadeConfig: {
        include: { rewardStages: true },
      },
    },
  });

  const redeemedCashback = isCashbackType
    ? Math.min(redeemCashbackReq, redeemable)
    : Math.min(
        redeemCashbackReq,
        availableCashback,
        Math.floor(billAmount * 100) / 100,
      );

  let finalAmount = billAmount;

  if (redeemedCashback > 0) {
    await recordCashbackRedemption(tx, {
      businessId,
      customerId,
      billId,
      loyaltyId: loyalty?.id ?? null,
      amount: redeemedCashback,
    });
  }

  finalAmount = Math.max(0, billAmount - redeemedCashback);

  const updatedWallet = await tx.wallet.findUnique({
    where: { businessId_customerId: { businessId, customerId } },
  });
  const effectivePointsBalance = isCashbackType
    ? (updatedWallet?.cashbackBalance ?? 0)
    : context.type === "AMOUNT_SPENT"
      ? (updatedWallet?.amountSpentBalance ?? 0)
      : (updatedWallet?.visitPointsBalance ?? 0);

  return {
    loyaltyType: context.type,
    earnedPoints: 0,
    redeemedPoints: 0,
    cashbackAmount: null,
    cashbackRedeemedAmount: redeemedCashback,
    partnerRedeemedAmount: null,
    pointsBalance: effectivePointsBalance,
    finalAmount,
  };
}

/**
 * Apply partner (cross-business) redemption: deduct from partner's wallet and
 * return the discount amount (₹) at the current store. Caller applies this to
 * finalAmount and persists partnerRedeemedAmount on the bill.
 */
export async function applyPartnerRedemptionForBill(
  tx: Prisma.TransactionClient,
  params: {
    currentBusinessId: string;
    customerId: string;
    billId: string;
    partnerBusinessId: string;
    /** For CASHBACK/TIER partner: ₹ to redeem at partner. */
    redeemPartnerCashback?: number;
    /** For AMOUNT_SPENT/VISIT_MADE partner: points to redeem. */
    redeemPartnerPoints?: number;
    /** Bill amount (userPaidAmount) for server-side cap validation against current business's loyalty limits. */
    billAmount?: number;
  },
): Promise<number> {
  const {
    currentBusinessId,
    customerId,
    billId,
    partnerBusinessId,
    redeemPartnerCashback = 0,
    redeemPartnerPoints = 0,
  } = params;

  const cashbackReq = Math.max(0, redeemPartnerCashback);
  const pointsReq = Math.max(0, Math.floor(redeemPartnerPoints));
  if (cashbackReq <= 0 && pointsReq <= 0) return 0;

  const partnership = await tx.businessPartnership.findFirst({
    where: {
      status: "ACTIVE",
      AND: [
        { members: { some: { businessId: currentBusinessId } } },
        { members: { some: { businessId: partnerBusinessId } } },
      ],
    },
    include: {
      members: {
        where: { businessId: partnerBusinessId },
        include: {
          business: {
            include: { loyalty: { select: { id: true, loyaltyType: true } } },
          },
        },
      },
    },
  });

  if (!partnership || partnership.members.length === 0) {
    throw new Error("Partnership not found or inactive.");
  }

  const partnerMember =
    partnership.members[0] ??
    (() => {
      throw new Error("Partner member not found.");
    })();
  const partnerLoyalty = partnerMember.business.loyalty;
  if (!partnerLoyalty) {
    throw new Error("Partner business has no loyalty program.");
  }

  const exchangeRate = Number(partnerMember.exchangeRate) || 1;
  const pointToCurrencyRate = Number(partnerMember.pointToCurrencyRate) || 1;

  const wallet = await tx.wallet.findUnique({
    where: {
      businessId_customerId: { businessId: partnerBusinessId, customerId },
    },
  });

  if (!wallet) {
    throw new Error("Customer has no wallet at partner.");
  }

  let discountAtCurrentStore = 0;

  if (
    partnerLoyalty.loyaltyType === "CASHBACK" ||
    partnerLoyalty.loyaltyType === "TIER"
  ) {
    if (pointsReq > 0) {
      throw new Error(
        "Partner uses cashback; send redeemPartnerCashback, not points.",
      );
    }
    const balance = Math.max(0, wallet.cashbackBalance ?? 0);
    if (cashbackReq > balance) {
      throw new Error(
        `Insufficient partner cashback: requested ₹${cashbackReq}, available ₹${balance}`,
      );
    }
    discountAtCurrentStore = Math.floor(cashbackReq * exchangeRate * 100) / 100;

    await tx.transaction.create({
      data: {
        businessId: partnerBusinessId,
        customerId,
        billId,
        loyaltyId: partnerLoyalty.id,
        valueKind: TransactionValueKind.CASHBACK,
        amount: -cashbackReq,
        type: TransactionType.REDEEMED,
        source: TransactionSource.BILL,
        sourceId: billId,
        description: `Redeemed at partner store (₹${cashbackReq})`,
        metadata: { redeemedAtBusinessId: currentBusinessId },
      },
    });
    await tx.wallet.update({
      where: {
        businessId_customerId: { businessId: partnerBusinessId, customerId },
      },
      data: { cashbackBalance: { decrement: cashbackReq } },
    });
  } else if (
    partnerLoyalty.loyaltyType === "AMOUNT_SPENT" ||
    partnerLoyalty.loyaltyType === "VISIT_MADE"
  ) {
    if (cashbackReq > 0) {
      throw new Error(
        "Partner uses points; send redeemPartnerPoints, not cashback.",
      );
    }
    const balance = Math.max(
      0,
      Math.floor(
        (partnerLoyalty.loyaltyType === "AMOUNT_SPENT"
          ? (wallet.amountSpentBalance ?? 0)
          : (wallet.visitPointsBalance ?? 0)) as number,
      ),
    );
    if (pointsReq > balance) {
      throw new Error(
        `Insufficient partner points: requested ${pointsReq}, available ${balance}`,
      );
    }
    const valueKind =
      partnerLoyalty.loyaltyType === "AMOUNT_SPENT"
        ? TransactionValueKind.AMOUNT_SPENT_POINTS
        : TransactionValueKind.VISIT_POINTS;

    discountAtCurrentStore =
      Math.floor(pointsReq * pointToCurrencyRate * exchangeRate * 100) / 100;

    await tx.transaction.create({
      data: {
        businessId: partnerBusinessId,
        customerId,
        billId,
        loyaltyId: partnerLoyalty.id,
        valueKind,
        amount: -pointsReq,
        type: TransactionType.REDEEMED,
        source: TransactionSource.BILL,
        sourceId: billId,
        description: `Redeemed at partner store (${pointsReq} pts)`,
        metadata: { redeemedAtBusinessId: currentBusinessId },
      },
    });
    await tx.wallet.update({
      where: {
        businessId_customerId: { businessId: partnerBusinessId, customerId },
      },
      data:
        partnerLoyalty.loyaltyType === "AMOUNT_SPENT"
          ? { amountSpentBalance: { decrement: pointsReq } }
          : { visitPointsBalance: { decrement: pointsReq } },
    });
  } else {
    throw new Error("Unsupported partner loyalty type.");
  }

  // Server-side cap: enforce current business's redemption limits on partner discount
  if (params.billAmount != null && params.billAmount > 0) {
    const currentLoyalty = await tx.loyalty.findUnique({
      where: { businessId: currentBusinessId },
      include: {
        cashbackConfig: true,
        tierConfig: { include: { tiers: { orderBy: { rank: "asc" } } } },
      },
    });
    const currentCtx = currentLoyalty
      ? loyaltyRecordToContext(currentLoyalty)
      : null;
    if (currentCtx?.type === "CASHBACK") {
      const fullValueAtStore =
        partnerLoyalty.loyaltyType === "CASHBACK" ||
        partnerLoyalty.loyaltyType === "TIER"
          ? Math.max(0, wallet.cashbackBalance ?? 0) * exchangeRate
          : Math.max(
              0,
              Math.floor(
                (partnerLoyalty.loyaltyType === "AMOUNT_SPENT"
                  ? (wallet.amountSpentBalance ?? 0)
                  : (wallet.visitPointsBalance ?? 0)) as number,
              ),
            ) *
            pointToCurrencyRate *
            exchangeRate;
      const maxAllowed =
        Math.floor(
          calculateCashbackRedeemable(
            safeAmount(params.billAmount),
            currentCtx.config,
            Math.floor(fullValueAtStore * 100) / 100,
          ) * 100,
        ) / 100;
      if (discountAtCurrentStore > maxAllowed + 0.01) {
        throw new Error(
          `Partner redemption ₹${discountAtCurrentStore.toFixed(2)} exceeds allowed limit ₹${maxAllowed.toFixed(2)}.`,
        );
      }
    }
  }

  return discountAtCurrentStore;
}

/** Apply loyalty logic to a bill. Uses Wallet + Transaction. */
export async function applyLoyaltyForBill(
  tx: Prisma.TransactionClient,
  params: {
    businessId: string;
    customerId: string;
    billId: string;
    billAmount: number;
    billSubtotal?: number | null;
    redeemPointsRequested?: number | null;
    redeemCashbackRequested?: number | null;
    /** When set, use reward stage (PERCENTAGE_DISCOUNT/CASH_DISCOUNT) instead of 1pt=₹1. AMOUNT_SPENT/VISIT_MADE only. */
    rewardStageId?: string | null;
    /** Partner business ID when redeeming partner points/cashback at this bill. */
    redeemFromPartnerBusinessId?: string | null;
    /** For CASHBACK/TIER partner: ₹ to redeem at partner. */
    redeemPartnerCashback?: number | null;
    /** For AMOUNT_SPENT/VISIT_MADE partner: points to redeem. */
    redeemPartnerPoints?: number | null;
    /** When true, do not create EARNED tx or add to wallet; earn is applied when cashier finalizes (Create Another Bill). */
    deferEarn?: boolean;
  },
): Promise<ApplyLoyaltyResult> {
  const { businessId, customerId, billId } = params;
  const billAmount = safeAmount(params.billAmount ?? 0);
  const billSubtotal = safeAmount(params.billSubtotal ?? billAmount);
  const requested = Math.max(0, Math.floor(params.redeemPointsRequested ?? 0));
  const redeemCashbackReq = Math.max(0, params.redeemCashbackRequested ?? 0);
  const rewardStageId = params.rewardStageId ?? null;

  const business = await tx.business.findUnique({
    where: { id: businessId },
    select: { isServiceEnabled: true },
  });

  if (
    !isServiceEnabled(
      business?.isServiceEnabled as IsServiceEnabled | null | undefined,
      "loyalty",
    )
  ) {
    return noLoyaltyResult(billAmount);
  }

  const context = await getBusinessLoyaltyContext(tx, businessId);
  if (!context) return noLoyaltyResult(billAmount);

  await ensureWallet(tx, businessId, customerId);

  const bc = await tx.businessCustomer.findUnique({
    where: { businessId_customerId: { businessId, customerId } },
  });
  if (!bc) return noLoyaltyResult(billAmount);

  await expirePointsForCustomer(tx, { businessId, customerId });

  const wallet = await tx.wallet.findUnique({
    where: { businessId_customerId: { businessId, customerId } },
  });

  const billsAgg = await tx.bill.aggregate({
    where: { businessId, customerId },
    _sum: { finalAmount: true },
  });
  const aggregateSpend = billsAgg._sum.finalAmount ?? 0;
  const lifetimeSpend =
    wallet?.lifetimeSpend != null && wallet.lifetimeSpend > 0
      ? wallet.lifetimeSpend
      : aggregateSpend;

  const cashbackBal = wallet?.cashbackBalance ?? 0;
  const amountSpentBal = Math.max(0, wallet?.amountSpentBalance ?? 0);
  const visitPointsBal = Math.max(0, wallet?.visitPointsBalance ?? 0);

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
  const lockedReferralCashback = await getLockedReferralBalance(tx, {
    businessId,
    customerId,
  });

  const effectiveCashbackBal = Math.max(
    0,
    cashbackBal - lockedCashback - lockedReferralCashback,
  );
  const effectiveAmountSpentBal = Math.max(
    0,
    amountSpentBal - lockedAmountSpent,
  );
  const effectiveVisitPointsBal = Math.max(0, visitPointsBal - lockedVisit);

  const resolvedTier =
    context.type === "TIER"
      ? resolveTierForLifetimeSpend(context.config.tiers, lifetimeSpend)
      : null;
  const isCashbackType = context.type === "CASHBACK" || context.type === "TIER";

  const pointsBalance =
    context.type === "AMOUNT_SPENT"
      ? effectiveAmountSpentBal
      : context.type === "VISIT_MADE"
        ? effectiveVisitPointsBal
        : 0;

  const redeemable = isCashbackType
    ? calculateRedeemable(billAmount, effectiveCashbackBal, context, {
        resolvedTier,
      })
    : calculateRedeemable(billAmount, pointsBalance, context, { resolvedTier });

  const loyalty = await tx.loyalty.findUnique({
    where: { businessId },
    include: {
      amountSpentConfig: { include: { rewardStages: true } },
      visitMadeConfig: { include: { rewardStages: true } },
    },
  });

  // Same semantics as applyRedemptionForBill: points → reward; discount = cashback (FREE_ITEM = points only).
  let redeemedPoints = 0;
  let pointsDiscount = 0;
  let freeItemReward:
    | { rewardName: string; freeItemName: string | null }
    | undefined;
  if (!isCashbackType && (requested > 0 || rewardStageId)) {
    if (rewardStageId && loyalty) {
      const stages =
        context.type === "AMOUNT_SPENT"
          ? (loyalty.amountSpentConfig?.rewardStages ?? [])
          : (loyalty.visitMadeConfig?.rewardStages ?? []);
      const stage = stages.find((s) => s.id === rewardStageId);
      if (stage && stage.pointsRequired <= pointsBalance) {
        if (stage.rewardType === "FREE_ITEM") {
          const minOk =
            !stage.minPurchaseForRedemptionEnabled ||
            stage.minPurchaseForRedemption == null ||
            billAmount >= stage.minPurchaseForRedemption;
          if (minOk) {
            redeemedPoints = stage.pointsRequired;
            pointsDiscount = 0;
            freeItemReward = {
              rewardName: stage.rewardName ?? "Free item",
              freeItemName: stage.freeItemName ?? null,
            };
          }
        } else if (
          stage.rewardType === "PERCENTAGE_DISCOUNT" ||
          stage.rewardType === "CASH_DISCOUNT"
        ) {
          pointsDiscount = calculateDiscountFromStage(
            {
              id: stage.id,
              rewardType: stage.rewardType,
              pointsRequired: stage.pointsRequired,
              percentageValue: stage.percentageValue,
              cashAmount: stage.cashAmount,
              minPurchaseForRedemptionEnabled:
                stage.minPurchaseForRedemptionEnabled,
              minPurchaseForRedemption: stage.minPurchaseForRedemption,
              maxDiscountCapEnabled: stage.maxDiscountCapEnabled,
              maxDiscountCap: stage.maxDiscountCap,
            },
            billAmount,
          );
          redeemedPoints = pointsDiscount > 0 ? stage.pointsRequired : 0;
        }
      }
    }
    if (redeemedPoints === 0) {
      redeemedPoints = Math.min(requested, Math.floor(redeemable));
      pointsDiscount = redeemedPoints;
    }
  }

  const redeemedCashback = isCashbackType
    ? Math.min(redeemCashbackReq, redeemable)
    : Math.min(
        redeemCashbackReq,
        cashbackBal,
        Math.floor(billAmount * 100) / 100,
      );

  let finalAmount = billAmount;
  let cashbackAmount: number | null = null;
  let cashbackRedeemedAmount: number | null = null;
  let partnerRedeemedAmount: number | null = null;

  if (redeemedCashback > 0) {
    finalAmount = Math.max(0, billAmount - redeemedCashback);
    cashbackRedeemedAmount = redeemedCashback;
    await recordCashbackRedemption(tx, {
      businessId,
      customerId,
      billId,
      loyaltyId: loyalty?.id ?? null,
      amount: redeemedCashback,
    });
  }
  if (redeemedPoints > 0 && !isCashbackType) {
    // Convert points → cashback (or free item). Does NOT reduce bill; cashback stays in wallet until "redeem cashback on bill".
    await recordPointsRedemptionAsCashbackFlow(tx, {
      businessId,
      customerId,
      billId,
      loyaltyId: loyalty?.id ?? null,
      context,
      pointsDec: redeemedPoints,
      cashbackValue: pointsDiscount,
      freeItemReward,
    });
  }

  // Partner (cross-business) redemption: deduct from partner wallet, apply discount here
  const partnerId = params.redeemFromPartnerBusinessId ?? null;
  const partnerCashback = Math.max(0, params.redeemPartnerCashback ?? 0);
  const partnerPoints = Math.max(
    0,
    Math.floor(params.redeemPartnerPoints ?? 0),
  );
  if (partnerId && (partnerCashback > 0 || partnerPoints > 0)) {
    const partnerDiscount = await applyPartnerRedemptionForBill(tx, {
      currentBusinessId: businessId,
      customerId,
      billId,
      partnerBusinessId: partnerId,
      redeemPartnerCashback: partnerCashback > 0 ? partnerCashback : undefined,
      redeemPartnerPoints: partnerPoints > 0 ? partnerPoints : undefined,
      billAmount: finalAmount,
    });
    finalAmount = Math.max(0, finalAmount - partnerDiscount);
    partnerRedeemedAmount = partnerDiscount;
  }

  const amountForEarning = getAmountForEarning(
    context,
    billAmount,
    billSubtotal,
    finalAmount,
  );

  const visitQualifies =
    context.type !== "VISIT_MADE" ||
    isVisitQualifying(context.config, wallet?.lastVisitAt ?? null);

  const rawEarned = visitQualifies
    ? calculatePointsEarnedForBill(amountForEarning, context, {
        resolvedTier,
      })
    : 0;
  const earnedPoints = Math.max(0, rawEarned);

  const deferEarn = params.deferEarn === true;
  if (!deferEarn && isCashbackType && earnedPoints > 0) {
    cashbackAmount = earnedPoints;
    const cashbackExpiresAt =
      (context.type === "CASHBACK" || context.type === "TIER") &&
      context.config.pointExpiryDays != null &&
      context.config.pointExpiryDays > 0
        ? (() => {
            const d = new Date();
            d.setDate(d.getDate() + context.config.pointExpiryDays!);
            return d;
          })()
        : null;
    await recordCashbackEarned(tx, {
      businessId,
      customerId,
      billId,
      loyaltyId: loyalty?.id ?? null,
      amount: cashbackAmount,
      expiresAt: cashbackExpiresAt,
      metadata:
        context.type === "TIER" && resolvedTier
          ? {
              tierName: resolvedTier.name,
              tierId: resolvedTier.id,
              cashbackPercentage: resolvedTier.cashbackPercentage,
            }
          : context.type === "CASHBACK"
            ? { cashbackPercentage: context.config.cashbackPercentage }
            : undefined,
    });
  } else if (!deferEarn && !isCashbackType && earnedPoints > 0) {
    const expiryDays =
      context.type === "AMOUNT_SPENT"
        ? getExpiryDays(context.config.pointExpiryDays)
        : getExpiryDays(
            context.type === "VISIT_MADE"
              ? context.config.pointExpiryDays
              : null,
          );
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiryDays);
    await recordPointsEarned(tx, {
      businessId,
      customerId,
      billId,
      loyaltyId: loyalty?.id ?? null,
      context,
      amount: earnedPoints,
      expiresAt,
      updateVisitCount: context.type === "VISIT_MADE" && visitQualifies,
    });
  }
  if (deferEarn && isCashbackType && earnedPoints > 0) {
    cashbackAmount = earnedPoints;
  }
  if (context.type === "TIER" || context.type === "VISIT_MADE") {
    const updateData: {
      visitCount?: { increment: number };
      lastVisitAt?: Date;
    } = {};
    if (context.type === "TIER") {
      updateData.visitCount = { increment: 1 };
      updateData.lastVisitAt = new Date();
    } else if (context.type === "VISIT_MADE" && visitQualifies) {
      updateData.visitCount = { increment: 1 };
      updateData.lastVisitAt = new Date();
    }
    if (Object.keys(updateData).length > 0) {
      await tx.wallet.update({
        where: { businessId_customerId: { businessId, customerId } },
        data: updateData,
      });
    }
  }

  let tierUpgradeInfo: TierUpgradeInfo | null = null;
  let currentTierInfo: CurrentTierInfo | null = null;

  let tierMessage: string | null = null;
  if (context.type === "TIER") {
    const newLifetimeSpend = lifetimeSpend + billAmount;
    const newTier = resolveTierForLifetimeSpend(
      context.config.tiers,
      newLifetimeSpend,
    );
    tierUpgradeInfo = {
      previousTierName: resolvedTier?.name ?? null,
      newTierName: newTier?.name ?? null,
      wasUpgraded: !!newTier && resolvedTier?.id !== newTier.id,
      newCashbackPercentage: newTier?.cashbackPercentage ?? 0,
    };
    if (newTier) {
      currentTierInfo = {
        name: newTier.name,
        cashbackPercentage: newTier.cashbackPercentage,
        minLifetimeSpend: newTier.minLifetimeSpend,
        maxLifetimeSpend: newTier.maxLifetimeSpend ?? null,
      };
    } else if (context.config.tiers.length > 0) {
      const first = context.config.tiers.reduce((a, b) =>
        a.rank <= b.rank ? a : b,
      );
      const spendToReach = Math.max(
        0,
        first.minLifetimeSpend - newLifetimeSpend,
      );
      tierMessage = `Not in any tier yet. Spend ₹${spendToReach.toLocaleString()} more to reach ${first.name} and earn cashback.`;
    }
  }

  const updatedWallet = await tx.wallet.findUnique({
    where: { businessId_customerId: { businessId, customerId } },
  });

  // Update wallet.lifetimeSpend: aggregate uses Bill.finalAmount (bill total before redemption).
  // The bill was created with finalAmount=billAmount; route does not change finalAmount.
  await tx.wallet.upsert({
    where: { businessId_customerId: { businessId, customerId } },
    create: {
      businessId,
      customerId,
      lifetimeSpend: aggregateSpend,
    },
    update: { lifetimeSpend: aggregateSpend },
  });

  const effectivePointsBalance = isCashbackType
    ? (updatedWallet?.cashbackBalance ?? 0)
    : context.type === "AMOUNT_SPENT"
      ? (updatedWallet?.amountSpentBalance ?? 0)
      : (updatedWallet?.visitPointsBalance ?? 0);

  const hasEarned =
    earnedPoints > 0 || (cashbackAmount != null && cashbackAmount > 0);
  if (
    hasEarned &&
    loyalty &&
    (loyalty.whatsappEnabled || loyalty.emailEnabled || loyalty.smsEnabled)
  ) {
    const customer = await tx.customer.findUnique({
      where: { id: customerId },
      include: { user: { select: { phoneNumber: true } } },
    });
    const phone = customer?.user?.phoneNumber;
    const email = customer?.email;
    const pointsName =
      (
        await tx.business.findUnique({
          where: { id: businessId },
          select: { defaultPointsName: true },
        })
      )?.defaultPointsName ?? "Points";
    const body = isCashbackType
      ? `You earned ₹${(cashbackAmount ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })} cashback on your purchase.`
      : `You earned ${earnedPoints} ${pointsName} on your purchase.`;

    const { logLoyaltyEarnEmail, logLoyaltyEarnSms, logLoyaltyEarnWhatsApp } =
      await import("@/lib/messaging");

    if (loyalty.whatsappEnabled && phone) {
      await logLoyaltyEarnWhatsApp(tx, {
        businessId,
        recipient: phone,
        body,
        sourceId: billId,
      });
    }
    if (loyalty.emailEnabled && email) {
      await logLoyaltyEarnEmail(tx, {
        businessId,
        recipient: email,
        body,
        sourceId: billId,
      });
    }
    if (loyalty.smsEnabled && phone) {
      await logLoyaltyEarnSms(tx, {
        businessId,
        recipient: phone,
        body,
        sourceId: billId,
      });
    }
  }

  return {
    loyaltyType: context.type,
    earnedPoints,
    redeemedPoints,
    cashbackAmount,
    cashbackRedeemedAmount,
    partnerRedeemedAmount,
    pointsBalance: effectivePointsBalance,
    finalAmount,
    tierUpgrade: tierUpgradeInfo,
    currentTier: currentTierInfo,
    tierMessage: tierMessage ?? undefined,
  };
}

/** Apply deferred earn for a bill (when cashier clicks Create Another Bill). Idempotent: no-op if EARNED already exists for this bill. */
export async function finalizeBillEarn(
  tx: Prisma.TransactionClient,
  params: {
    businessId: string;
    customerId: string;
    billId: string;
    /** Bill finalAmount (before any redemption). */
    finalAmount: number | null;
    /** Bill subtotal (for earning when onFinalAmount=false). */
    billSubtotal: number | null;
    /** Amount customer actually pays after redemption (used for earn calc). */
    userPaidAmount: number | null;
  },
): Promise<{
  applied: boolean;
  cashbackAmount: number | null;
  earnedPoints: number;
}> {
  const {
    businessId,
    customerId,
    billId,
    finalAmount,
    billSubtotal,
    userPaidAmount,
  } = params;
  const amountToPay = userPaidAmount ?? finalAmount ?? 0;
  if (amountToPay <= 0) {
    return { applied: false, cashbackAmount: null, earnedPoints: 0 };
  }

  const existingEarned = await tx.transaction.count({
    where: {
      billId,
      type: TransactionType.EARNED,
      source: { not: TransactionSource.CAMPAIGN },
    },
  });
  if (existingEarned > 0) {
    return { applied: false, cashbackAmount: null, earnedPoints: 0 };
  }

  const context = await getBusinessLoyaltyContext(tx, businessId);
  if (!context)
    return { applied: false, cashbackAmount: null, earnedPoints: 0 };

  const loyalty = await tx.loyalty.findUnique({
    where: { businessId },
    include: {
      amountSpentConfig: { include: { rewardStages: true } },
      visitMadeConfig: { include: { rewardStages: true } },
    },
  });
  const wallet = await tx.wallet.findUnique({
    where: { businessId_customerId: { businessId, customerId } },
  });
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
    amountToPay,
    billSubtotal,
    amountToPay,
  );
  const visitQualifies =
    context.type !== "VISIT_MADE" ||
    isVisitQualifying(context.config, wallet?.lastVisitAt ?? null);
  const rawEarned = visitQualifies
    ? calculatePointsEarnedForBill(amountForEarning, context, { resolvedTier })
    : 0;
  const earnedPoints = Math.max(0, rawEarned);
  if (earnedPoints <= 0) {
    return { applied: true, cashbackAmount: null, earnedPoints: 0 };
  }

  if (isCashbackType) {
    const cashbackExpiresAt =
      (context.type === "CASHBACK" || context.type === "TIER") &&
      context.config.pointExpiryDays != null &&
      context.config.pointExpiryDays > 0
        ? (() => {
            const d = new Date();
            d.setDate(d.getDate() + context.config.pointExpiryDays!);
            return d;
          })()
        : null;
    await recordCashbackEarned(tx, {
      businessId,
      customerId,
      billId,
      loyaltyId: loyalty?.id ?? null,
      amount: earnedPoints,
      expiresAt: cashbackExpiresAt,
      metadata:
        context.type === "TIER" && resolvedTier
          ? {
              tierName: resolvedTier.name,
              tierId: resolvedTier.id,
              cashbackPercentage: resolvedTier.cashbackPercentage,
            }
          : context.type === "CASHBACK"
            ? { cashbackPercentage: context.config.cashbackPercentage }
            : undefined,
    });
    return { applied: true, cashbackAmount: earnedPoints, earnedPoints: 0 };
  }

  const expiryDays =
    context.type === "AMOUNT_SPENT"
      ? getExpiryDays(context.config.pointExpiryDays)
      : getExpiryDays(
          context.type === "VISIT_MADE" ? context.config.pointExpiryDays : null,
        );
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiryDays);
  await recordPointsEarned(tx, {
    businessId,
    customerId,
    billId,
    loyaltyId: loyalty?.id ?? null,
    context,
    amount: earnedPoints,
    expiresAt,
    updateVisitCount: context.type === "VISIT_MADE" && visitQualifies,
  });
  return { applied: true, cashbackAmount: null, earnedPoints };
}

export async function expirePointsForBusiness(params: {
  businessId?: string;
  now?: Date;
}) {
  const now = params.now ?? new Date();

  const expiring = await db.transaction.findMany({
    where: {
      type: TransactionType.EARNED,
      expiresAt: { lt: now, not: null },
      valueKind: {
        in: [
          TransactionValueKind.AMOUNT_SPENT_POINTS,
          TransactionValueKind.VISIT_POINTS,
          TransactionValueKind.CASHBACK,
        ],
      },
      ...(params.businessId ? { businessId: params.businessId } : {}),
    },
    select: { businessId: true, customerId: true },
    distinct: ["businessId", "customerId"],
  });

  let expiredCustomers = 0;
  for (const r of expiring) {
    await runTransaction(async (tx) => {
      await expirePointsForCustomer(tx, {
        businessId: r.businessId,
        customerId: r.customerId,
        now,
      });
    });
    expiredCustomers += 1;
  }

  return { expiredCustomers };
}
