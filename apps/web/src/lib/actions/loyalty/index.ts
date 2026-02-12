import { runTransaction } from "@/lib/db/transaction";
import {
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
      description: `Redeemed ${pointsDec} points on bill`,
    },
  });

  if (cashbackValue > 0) {
    // 2. Cashback inc (points converted to cashback)
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
        metadata: { fromPointsRedemption: true, pointsDeducted: pointsDec },
      },
    });
    // 3. Cashback dec (used on bill)
    await tx.transaction.create({
      data: {
        businessId,
        customerId,
        billId,
        loyaltyId,
        valueKind: TransactionValueKind.CASHBACK,
        amount: -cashbackValue,
        type: TransactionType.REDEEMED,
        source: TransactionSource.BILL,
        sourceId: billId,
        description: `Redeemed ₹${cashbackValue} cashback on bill`,
      },
    });
  }

  const pointsField =
    context.type === "AMOUNT_SPENT"
      ? { amountSpentBalance: { decrement: pointsDec } }
      : { visitPointsBalance: { decrement: pointsDec } };
  // Cashback: +cashbackValue - cashbackValue = no net change
  await tx.wallet.update({
    where: { businessId_customerId: { businessId, customerId } },
    data: pointsField,
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
  pointsBalance: number;
  finalAmount: number;
  tierUpgrade?: TierUpgradeInfo | null;
  currentTier?: CurrentTierInfo | null;
  /** TIER only: when no tier (below first), message for cashier. */
  tierMessage?: string | null;
}

/** Apply redemption only to an existing bill (no earning). For post-creation redeem flow. */
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

  const resolvedTier =
    context.type === "TIER"
      ? resolveTierForLifetimeSpend(context.config.tiers, lifetimeSpend)
      : null;
  const isCashbackType = context.type === "CASHBACK" || context.type === "TIER";

  const pointsBalance =
    context.type === "AMOUNT_SPENT"
      ? amountSpentBal
      : context.type === "VISIT_MADE"
        ? visitPointsBal
        : 0;

  const availableCashback = Math.max(0, cashbackBal - cashbackEarnedThisBill);
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

  let redeemedPoints = 0;
  let pointsDiscount = 0; // discount from points (1:1 or from reward stage)
  if (!isCashbackType && (requested > 0 || rewardStageId)) {
    if (rewardStageId && loyalty) {
      const stages =
        context.type === "AMOUNT_SPENT"
          ? (loyalty.amountSpentConfig?.rewardStages ?? [])
          : (loyalty.visitMadeConfig?.rewardStages ?? []);
      const stage = stages.find((s) => s.id === rewardStageId);
      if (
        stage &&
        stage.pointsRequired <= pointsBalance &&
        (stage.rewardType === "PERCENTAGE_DISCOUNT" ||
          stage.rewardType === "CASH_DISCOUNT")
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
    if (redeemedPoints === 0) {
      redeemedPoints = Math.min(requested, Math.floor(redeemable));
      pointsDiscount = redeemedPoints; // 1:1
    }
  }

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
  if (redeemedPoints > 0 && !isCashbackType) {
    await recordPointsRedemptionAsCashbackFlow(tx, {
      businessId,
      customerId,
      billId,
      loyaltyId: loyalty?.id ?? null,
      context,
      pointsDec: redeemedPoints,
      cashbackValue: pointsDiscount,
    });
  }

  finalAmount = Math.max(0, billAmount - redeemedCashback - pointsDiscount);

  const updatedWallet = await tx.wallet.findUnique({
    where: { businessId_customerId: { businessId, customerId } },
  });
  const effectivePointsBalance = isCashbackType
    ? (updatedWallet?.cashbackBalance ?? 0)
    : context.type === "AMOUNT_SPENT"
      ? (updatedWallet?.amountSpentBalance ?? 0)
      : (updatedWallet?.visitPointsBalance ?? 0);

  // Total discount from wallet: direct cashback + points (converted to cashback)
  const totalCashbackRedeemed = redeemedCashback + pointsDiscount;

  return {
    loyaltyType: context.type,
    earnedPoints: 0,
    redeemedPoints,
    cashbackAmount: null,
    cashbackRedeemedAmount: totalCashbackRedeemed,
    pointsBalance: effectivePointsBalance,
    finalAmount,
  };
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

  const resolvedTier =
    context.type === "TIER"
      ? resolveTierForLifetimeSpend(context.config.tiers, lifetimeSpend)
      : null;
  const isCashbackType = context.type === "CASHBACK" || context.type === "TIER";

  const pointsBalance =
    context.type === "AMOUNT_SPENT"
      ? amountSpentBal
      : context.type === "VISIT_MADE"
        ? visitPointsBal
        : 0;

  const redeemable = isCashbackType
    ? calculateRedeemable(billAmount, cashbackBal, context, { resolvedTier })
    : calculateRedeemable(billAmount, pointsBalance, context, { resolvedTier });

  const loyalty = await tx.loyalty.findUnique({
    where: { businessId },
    include: {
      amountSpentConfig: { include: { rewardStages: true } },
      visitMadeConfig: { include: { rewardStages: true } },
    },
  });

  let redeemedPoints = 0;
  let pointsDiscount = 0;
  if (!isCashbackType && (requested > 0 || rewardStageId)) {
    if (rewardStageId && loyalty) {
      const stages =
        context.type === "AMOUNT_SPENT"
          ? (loyalty.amountSpentConfig?.rewardStages ?? [])
          : (loyalty.visitMadeConfig?.rewardStages ?? []);
      const stage = stages.find((s) => s.id === rewardStageId);
      if (
        stage &&
        stage.pointsRequired <= pointsBalance &&
        (stage.rewardType === "PERCENTAGE_DISCOUNT" ||
          stage.rewardType === "CASH_DISCOUNT")
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
    finalAmount = Math.max(0, finalAmount - pointsDiscount);
    cashbackRedeemedAmount = (cashbackRedeemedAmount ?? 0) + pointsDiscount;
    await recordPointsRedemptionAsCashbackFlow(tx, {
      businessId,
      customerId,
      billId,
      loyaltyId: loyalty?.id ?? null,
      context,
      pointsDec: redeemedPoints,
      cashbackValue: pointsDiscount,
    });
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

  if (isCashbackType && earnedPoints > 0) {
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
  } else if (!isCashbackType && earnedPoints > 0) {
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
  } else if (context.type === "TIER" || context.type === "VISIT_MADE") {
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

  return {
    loyaltyType: context.type,
    earnedPoints,
    redeemedPoints,
    cashbackAmount,
    cashbackRedeemedAmount,
    pointsBalance: effectivePointsBalance,
    finalAmount,
    tierUpgrade: tierUpgradeInfo,
    currentTier: currentTierInfo,
    tierMessage: tierMessage ?? undefined,
  };
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
