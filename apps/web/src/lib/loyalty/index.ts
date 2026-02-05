import { db, Prisma, TransactionSource, TransactionType } from "@reelo/db";

export const DEFAULT_POINT_EXPIRY_DAYS = 180;

export type LoyaltySettingsSnapshot = {
  earningPercentage: number;
  earnPointsOnPaidAmountOnly: boolean;
  cashbackInFinalAmount: boolean;
  cashbackBranding: string | null;
  minPurchaseForEarning: number;
  minPurchaseForRedemption: number;
  upperLimitBillAmount: number | null;
  upperLimitClaimableAmount: number | null;
  pointReminderDays: number | null;
  pointExpiryDays: number | null;
};

export function getExpiryDays(pointExpiryDays: number | null | undefined) {
  return pointExpiryDays && pointExpiryDays > 0
    ? pointExpiryDays
    : DEFAULT_POINT_EXPIRY_DAYS;
}

/**
 * Calculate points earned for a bill. Returns 0 when:
 * - billAmount <= 0
 * - billAmount < minPurchaseForEarning
 * - earningPercentage is 0
 */
export function calculateEarnedPoints(
  billAmount: number,
  settings: LoyaltySettingsSnapshot,
) {
  if (billAmount <= 0 || settings.earningPercentage <= 0) return 0;
  if (billAmount < settings.minPurchaseForEarning) return 0;

  const capped =
    settings.upperLimitBillAmount != null && settings.upperLimitBillAmount >= 0
      ? Math.min(billAmount, settings.upperLimitBillAmount)
      : billAmount;

  const earned = Math.floor((capped * settings.earningPercentage) / 100);
  return Math.max(0, earned);
}

/**
 * Max points that can be redeemed on a bill. Returns 0 when:
 * - billAmount <= 0
 * - billAmount < minPurchaseForRedemption
 * - pointsBalance <= 0
 */
export function calculateRedeemablePoints(
  billAmount: number,
  settings: LoyaltySettingsSnapshot,
  pointsBalance: number,
) {
  if (billAmount <= 0 || pointsBalance <= 0) return 0;
  if (billAmount < settings.minPurchaseForRedemption) return 0;

  const cap =
    settings.upperLimitClaimableAmount != null &&
    settings.upperLimitClaimableAmount >= 0
      ? Math.min(pointsBalance, settings.upperLimitClaimableAmount)
      : pointsBalance;

  return Math.max(0, Math.min(pointsBalance, cap));
}

export type RedemptionAllocation = {
  bucketId: string;
  amount: number;
};

export function allocateRedemptionFIFO(
  buckets: { id: string; remainingAmount: number }[],
  requested: number,
) {
  let remaining = requested;
  const allocations: RedemptionAllocation[] = [];

  for (const bucket of buckets) {
    if (remaining <= 0) break;
    const take = Math.min(bucket.remainingAmount, remaining);
    if (take <= 0) continue;
    allocations.push({ bucketId: bucket.id, amount: take });
    remaining -= take;
  }

  return { allocations, remaining };
}

export async function getBusinessLoyaltySettings(
  tx: Prisma.TransactionClient,
  businessId: string,
) {
  const loyalty = await tx.loyalty.findUnique({
    where: { businessId },
  });

  if (!loyalty) return null;

  const snapshot: LoyaltySettingsSnapshot = {
    earningPercentage: loyalty.earningPercentage,
    earnPointsOnPaidAmountOnly: loyalty.earnPointsOnPaidAmountOnly,
    cashbackInFinalAmount: loyalty.cashbackInFinalAmount,
    cashbackBranding: loyalty.cashbackBranding ?? null,
    minPurchaseForEarning: loyalty.minPurchaseForEarning,
    minPurchaseForRedemption: loyalty.minPurchaseForRedemption,
    upperLimitBillAmount: loyalty.upperLimitBillAmount ?? null,
    upperLimitClaimableAmount: loyalty.upperLimitClaimableAmount ?? null,
    pointReminderDays: loyalty.pointReminderDays ?? null,
    pointExpiryDays: loyalty.pointExpiryDays ?? null,
  };

  return snapshot;
}

export async function expireBucketsForCustomer(
  tx: Prisma.TransactionClient,
  params: {
    businessId: string;
    customerId: string;
    now?: Date;
  },
) {
  const { businessId, customerId } = params;
  const now = params.now ?? new Date();

  const expiringBuckets = await tx.pointsBucket.findMany({
    where: {
      businessId,
      customerId,
      remainingAmount: { gt: 0 },
      expiresAt: { lt: now },
      status: "ACTIVE",
    },
    select: { id: true, remainingAmount: true },
  });

  if (expiringBuckets.length === 0) {
    return { expiredPoints: 0 };
  }

  const expiredPoints = expiringBuckets.reduce(
    (sum, b) => sum + b.remainingAmount,
    0,
  );

  const customer = await tx.businessCustomer.findUnique({
    where: {
      businessId_customerId: { businessId, customerId },
    },
    select: { pointsBalance: true },
  });

  const currentBalance = customer?.pointsBalance ?? 0;
  const nextBalance = Math.max(0, currentBalance - expiredPoints);

  await tx.pointsBucket.updateMany({
    where: {
      id: { in: expiringBuckets.map((b) => b.id) },
    },
    data: {
      remainingAmount: 0,
      status: "EXPIRED",
    },
  });

  await tx.pointsTransaction.create({
    data: {
      businessId,
      customerId,
      amount: expiredPoints,
      type: TransactionType.EXPIRED,
      source: TransactionSource.MANUAL_ADJUSTMENT,
      metadata: {
        reason: "expiry",
        bucketCount: expiringBuckets.length,
      },
      balanceAfter: nextBalance,
    },
  });

  await tx.businessCustomer.update({
    where: {
      businessId_customerId: { businessId, customerId },
    },
    data: { pointsBalance: nextBalance },
  });

  return { expiredPoints };
}

/**
 * Apply loyalty logic to a bill. Points are ONLY given when the business has
 * a Loyalty configuration (Loyalty row exists). When no loyalty exists,
 * returns zeros for earned/redeemed points.
 */
export async function applyLoyaltyForBill(
  tx: Prisma.TransactionClient,
  params: {
    businessId: string;
    customerId: string;
    billId: string;
    billAmount: number;
    redeemPointsRequested?: number | null;
  },
) {
  const { businessId, customerId, billId, billAmount } = params;
  const requested = Math.max(0, params.redeemPointsRequested ?? 0);

  // Loyalty OFF = no Loyalty row for this business → no points
  const settings = await getBusinessLoyaltySettings(tx, businessId);
  if (!settings) {
    return {
      earnedPoints: 0,
      redeemedPoints: 0,
      pointsBalance: 0,
      finalAmount: billAmount,
      settings: null,
    };
  }

  await expireBucketsForCustomer(tx, { businessId, customerId });

  const customer = await tx.businessCustomer.findUnique({
    where: {
      businessId_customerId: { businessId, customerId },
    },
    select: { pointsBalance: true },
  });

  let pointsBalance = customer?.pointsBalance ?? 0;

  const redeemablePoints =
    billAmount > 0
      ? calculateRedeemablePoints(billAmount, settings, pointsBalance)
      : 0;

  const redeemedPoints = Math.min(requested, redeemablePoints);

  let finalAmount = billAmount;

  if (redeemedPoints > 0) {
    const buckets = await tx.pointsBucket.findMany({
      where: {
        businessId,
        customerId,
        remainingAmount: { gt: 0 },
        status: "ACTIVE",
      },
      orderBy: { expiresAt: "asc" },
      select: { id: true, remainingAmount: true },
    });

    const { allocations, remaining } = allocateRedemptionFIFO(
      buckets,
      redeemedPoints,
    );

    if (remaining > 0) {
      throw new Error("Insufficient points for redemption");
    }

    for (const allocation of allocations) {
      const bucket = buckets.find((b) => b.id === allocation.bucketId);
      const remainingAmount =
        (bucket?.remainingAmount ?? 0) - allocation.amount;
      await tx.pointsBucket.update({
        where: { id: allocation.bucketId },
        data: {
          remainingAmount,
          status: remainingAmount === 0 ? "CONSUMED" : "ACTIVE",
        },
      });
    }

    const nextBalance = Math.max(0, pointsBalance - redeemedPoints);

    const redeemTransaction = await tx.pointsTransaction.create({
      data: {
        businessId,
        customerId,
        amount: redeemedPoints,
        type: TransactionType.REDEEMED,
        source: TransactionSource.BILL,
        sourceId: billId,
        billId,
        metadata: {
          billId,
          requested,
        },
        balanceAfter: nextBalance,
      },
    });

    if (allocations.length > 0) {
      await tx.pointsRedemptionAllocation.createMany({
        data: allocations.map((allocation) => ({
          redeemTransactionId: redeemTransaction.id,
          bucketId: allocation.bucketId,
          amount: allocation.amount,
        })),
      });
    }

    pointsBalance = nextBalance;
    await tx.businessCustomer.update({
      where: {
        businessId_customerId: { businessId, customerId },
      },
      data: { pointsBalance },
    });

    finalAmount = Math.max(0, billAmount - redeemedPoints);
  }

  // When earnPointsOnPaidAmountOnly: give points on amount actually paid (after redemption); otherwise on full bill amount
  const amountForEarning =
    settings.earnPointsOnPaidAmountOnly && redeemedPoints > 0
      ? finalAmount
      : billAmount;
  const earnedPoints = calculateEarnedPoints(amountForEarning, settings);

  if (earnedPoints > 0) {
    const expiryDays = getExpiryDays(settings.pointExpiryDays);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiryDays);

    const nextBalance = pointsBalance + earnedPoints;

    const earnedTransaction = await tx.pointsTransaction.create({
      data: {
        businessId,
        customerId,
        amount: earnedPoints,
        type: TransactionType.EARNED,
        source: TransactionSource.BILL,
        sourceId: billId,
        billId,
        expiresAt,
        metadata: {
          billId,
          expiryDays,
        },
        balanceAfter: nextBalance,
      },
    });

    await tx.pointsBucket.create({
      data: {
        businessId,
        customerId,
        earnedTransactionId: earnedTransaction.id,
        originalAmount: earnedPoints,
        remainingAmount: earnedPoints,
        expiresAt,
      },
    });

    pointsBalance = nextBalance;
    await tx.businessCustomer.update({
      where: {
        businessId_customerId: { businessId, customerId },
      },
      data: { pointsBalance },
    });
  }

  const finalAmountValue = finalAmount;

  return {
    earnedPoints,
    redeemedPoints,
    pointsBalance,
    finalAmount: finalAmountValue,
    settings,
  };
}

export async function expireBucketsForBusiness(params: {
  businessId?: string;
  now?: Date;
}) {
  const now = params.now ?? new Date();

  const buckets = await db.pointsBucket.findMany({
    where: {
      remainingAmount: { gt: 0 },
      expiresAt: { lt: now },
      status: "ACTIVE",
      ...(params.businessId ? { businessId: params.businessId } : {}),
    },
    select: {
      businessId: true,
      customerId: true,
    },
    distinct: ["businessId", "customerId"],
  });

  let expiredCustomers = 0;

  for (const bucket of buckets) {
    await db.$transaction(async (tx) => {
      await expireBucketsForCustomer(tx, {
        businessId: bucket.businessId,
        customerId: bucket.customerId,
      });
    });
    expiredCustomers += 1;
  }

  return { expiredCustomers };
}
