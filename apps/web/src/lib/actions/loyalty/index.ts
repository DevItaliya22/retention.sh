import {
  calculatePointsEarnedForBill,
  calculateRedeemable,
  getExpiryDays,
  isVisitQualifying,
  resolveTierForLifetimeSpend,
  type LoyaltyContext,
} from "@/lib/loyalty";
import {
  isServiceEnabled,
  type IsServiceEnabled,
} from "@/lib/utils/service-enabled";
import {
  CashbackSource,
  db,
  Prisma,
  TransactionSource,
  TransactionType,
} from "@reelo/db";

export { DEFAULT_POINT_EXPIRY_DAYS, getExpiryDays } from "@/lib/loyalty";

export type RedemptionAllocation = {
  transactionId: string;
  amount: number;
};

/** FIFO redemption using PointsTransaction.remainingAmount */
export function allocateRedemptionFIFO(
  earnedRows: { id: string; remainingAmount: number }[],
  requested: number,
): { allocations: RedemptionAllocation[]; remaining: number } {
  let remaining = requested;
  const allocations: RedemptionAllocation[] = [];

  for (const row of earnedRows) {
    if (remaining <= 0) break;
    const take = Math.min(row.remainingAmount ?? 0, remaining);
    if (take <= 0) continue;
    allocations.push({ transactionId: row.id, amount: take });
    remaining -= take;
  }

  return { allocations, remaining };
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

  if (!loyalty) return null;

  switch (loyalty.loyaltyType) {
    case "CASHBACK":
      if (!loyalty.cashbackConfig) return null;
      return {
        type: "CASHBACK",
        config: {
          cashbackPercentage: loyalty.cashbackConfig.cashbackPercentage ?? 0,
          onFinalAmount: loyalty.cashbackConfig.onFinalAmount ?? false,
          maxCashbackCap: loyalty.cashbackConfig.maxCashbackCap,
          minPurchaseForEarningEnabled:
            loyalty.cashbackConfig.minPurchaseForEarningEnabled ?? false,
          minPurchaseForEarning:
            loyalty.cashbackConfig.minPurchaseForEarning ?? null,
          minPurchaseForRedemptionEnabled:
            loyalty.cashbackConfig.minPurchaseForRedemptionEnabled ?? false,
          minPurchaseForRedemption:
            loyalty.cashbackConfig.minPurchaseForRedemption ?? null,
          redemptionBalanceLimitEnabled:
            loyalty.cashbackConfig.redemptionBalanceLimitEnabled ?? false,
          redemptionBalanceLimitAmount:
            loyalty.cashbackConfig.redemptionBalanceLimitAmount ?? null,
          redemptionBalanceLimitPercentage:
            loyalty.cashbackConfig.redemptionBalanceLimitPercentage ?? null,
          redemptionBillLimitEnabled:
            loyalty.cashbackConfig.redemptionBillLimitEnabled ?? false,
          redemptionBillLimitAmount:
            loyalty.cashbackConfig.redemptionBillLimitAmount ?? null,
          redemptionBillLimitPercentage:
            loyalty.cashbackConfig.redemptionBillLimitPercentage ?? null,
          pointExpiryDays: loyalty.pointExpiryDays,
        },
      };
    case "TIER":
      if (!loyalty.tierConfig) return null;
      return {
        type: "TIER",
        config: {
          pointsPerRupee: loyalty.tierConfig.pointsPerRupee ?? 1,
          tiers: loyalty.tierConfig.tiers.map((t) => ({
            id: t.id,
            name: t.name,
            rank: t.rank,
            minLifetimeSpend: t.minLifetimeSpend,
            maxLifetimeSpend: t.maxLifetimeSpend,
            cashbackPercentage: t.cashbackPercentage ?? 0,
            minPurchaseForRedemptionEnabled:
              t.minPurchaseForRedemptionEnabled ?? false,
            minPurchaseForRedemption: t.minPurchaseForRedemption ?? null,
            maxCashbackCapEnabled: t.maxCashbackCapEnabled ?? false,
            maxCashbackCap: t.maxCashbackCap ?? null,
          })),
          pointExpiryDays: loyalty.pointExpiryDays,
        },
      };
    case "AMOUNT_SPENT":
      if (!loyalty.amountSpentConfig) return null;
      return {
        type: "AMOUNT_SPENT",
        config: {
          pointsPerRupee: loyalty.amountSpentConfig.pointsPerRupee ?? 1,
          onFinalAmount: loyalty.amountSpentConfig.onFinalAmount ?? false,
          maxPointsPerPurchase:
            loyalty.amountSpentConfig.maxPointsPerPurchase ?? null,
          pointExpiryDays: loyalty.pointExpiryDays,
        },
      };
    case "VISIT_MADE":
      if (!loyalty.visitMadeConfig) return null;
      return {
        type: "VISIT_MADE",
        config: {
          pointsPerVisit: loyalty.visitMadeConfig.pointsPerVisit ?? 1,
          visitIntervalEnabled:
            loyalty.visitMadeConfig.visitIntervalEnabled ?? false,
          visitIntervalValue:
            loyalty.visitMadeConfig.visitIntervalValue ?? null,
          visitIntervalUnit: loyalty.visitMadeConfig.visitIntervalUnit ?? null,
          pointExpiryDays: loyalty.pointExpiryDays,
        },
      };
    default:
      return null;
  }
}

/** Expire EARNED points using PointsTransaction (no PointsBucket). */
export async function expireBucketsForCustomer(
  tx: Prisma.TransactionClient,
  params: {
    businessId: string;
    customerId: string;
    now?: Date;
  },
): Promise<{ expiredPoints: number }> {
  const { businessId, customerId } = params;
  const now = params.now ?? new Date();

  const expiringRows = await tx.pointsTransaction.findMany({
    where: {
      businessId,
      customerId,
      type: TransactionType.EARNED,
      remainingAmount: { gt: 0 },
      expiresAt: { lt: now, not: null },
    },
    select: { id: true, remainingAmount: true },
    orderBy: { expiresAt: "asc" },
  });

  if (expiringRows.length === 0) {
    return { expiredPoints: 0 };
  }

  const expiredPoints = expiringRows.reduce(
    (sum, r) => sum + (r.remainingAmount ?? 0),
    0,
  );

  const bc = await tx.businessCustomer.findUnique({
    where: { businessId_customerId: { businessId, customerId } },
    select: { pointsBalance: true },
  });
  const currentBalance = bc?.pointsBalance ?? 0;
  const nextBalance = Math.max(0, currentBalance - expiredPoints);

  for (const row of expiringRows) {
    await tx.pointsTransaction.update({
      where: { id: row.id },
      data: { remainingAmount: 0 },
    });
  }

  await tx.pointsTransaction.create({
    data: {
      businessId,
      customerId,
      amount: -expiredPoints,
      type: TransactionType.EXPIRED,
      source: TransactionSource.MANUAL_ADJUSTMENT,
      balanceAfter: nextBalance,
      description: `Expired ${expiredPoints} points`,
    },
  });

  await tx.businessCustomer.update({
    where: { businessId_customerId: { businessId, customerId } },
    data: { pointsBalance: nextBalance },
  });

  return { expiredPoints };
}

export interface TierUpgradeInfo {
  previousTierName: string | null;
  newTierName: string | null;
  wasUpgraded: boolean;
  newCashbackPercentage: number;
}

/** Current tier after the bill (for TIER type); shown in cashier response. */
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
  pointsBalance: number;
  finalAmount: number;
  tierUpgrade?: TierUpgradeInfo | null;
  /** Set when loyaltyType is TIER: customer's tier after this bill (for cashier UI). */
  currentTier?: CurrentTierInfo | null;
}

/** Apply loyalty logic to a bill. Supports all 4 loyalty types. */
export async function applyLoyaltyForBill(
  tx: Prisma.TransactionClient,
  params: {
    businessId: string;
    customerId: string;
    billId: string;
    billAmount: number;
    /** Subtotal (line items sum before discounts/tax). When onFinalAmount=false, used for earning. */
    billSubtotal?: number | null;
    redeemPointsRequested?: number | null;
  },
): Promise<ApplyLoyaltyResult> {
  const { businessId, customerId, billId, billAmount } = params;
  const billSubtotal = params.billSubtotal ?? null;
  const requested = Math.max(0, Math.floor(params.redeemPointsRequested ?? 0));

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
    return {
      loyaltyType: "NONE",
      earnedPoints: 0,
      redeemedPoints: 0,
      cashbackAmount: null,
      pointsBalance: 0,
      finalAmount: billAmount,
    };
  }

  const context = await getBusinessLoyaltyContext(tx, businessId);
  if (!context) {
    return {
      loyaltyType: "NONE",
      earnedPoints: 0,
      redeemedPoints: 0,
      cashbackAmount: null,
      pointsBalance: 0,
      finalAmount: billAmount,
    };
  }

  await expireBucketsForCustomer(tx, { businessId, customerId });

  const bc = await tx.businessCustomer.findUnique({
    where: { businessId_customerId: { businessId, customerId } },
    select: {
      pointsBalance: true,
      lifetimeSpend: true,
      lastVisitAt: true,
    },
  });
  let pointsBalance = bc?.pointsBalance ?? 0;

  const resolvedTier =
    context.type === "TIER"
      ? resolveTierForLifetimeSpend(
          context.config.tiers,
          bc?.lifetimeSpend ?? 0,
        )
      : null;
  // CASHBACK and TIER do not use points; no redemption for these types.
  const isCashbackType = context.type === "CASHBACK" || context.type === "TIER";
  const redeemable = isCashbackType
    ? 0
    : calculateRedeemable(billAmount, pointsBalance, context, {
        resolvedTier,
      });
  const redeemedPoints = isCashbackType
    ? 0
    : Math.min(requested, Math.floor(redeemable));

  let finalAmount = billAmount;
  let cashbackAmount: number | null = null;

  // Redemption: deduct from balance using FIFO on PointsTransaction (points types only).
  if (redeemedPoints > 0 && !isCashbackType) {
    const earnedRows = await tx.pointsTransaction.findMany({
      where: {
        businessId,
        customerId,
        type: TransactionType.EARNED,
        remainingAmount: { gt: 0 },
      },
      orderBy: { expiresAt: "asc" },
      select: { id: true, remainingAmount: true },
    });

    const { allocations, remaining } = allocateRedemptionFIFO(
      earnedRows.map((r) => ({
        id: r.id,
        remainingAmount: r.remainingAmount ?? 0,
      })),
      redeemedPoints,
    );

    if (remaining > 0) {
      throw new Error("Insufficient points for redemption");
    }

    for (const alloc of allocations) {
      const row = earnedRows.find((r) => r.id === alloc.transactionId);
      const newRemaining = Math.max(
        0,
        (row?.remainingAmount ?? 0) - alloc.amount,
      );
      await tx.pointsTransaction.update({
        where: { id: alloc.transactionId },
        data: { remainingAmount: newRemaining },
      });
    }

    const nextBalance = Math.max(0, pointsBalance - redeemedPoints);

    await tx.pointsTransaction.create({
      data: {
        businessId,
        customerId,
        amount: -redeemedPoints,
        type: TransactionType.REDEEMED,
        source: TransactionSource.BILL,
        sourceId: billId,
        billId,
        balanceAfter: nextBalance,
        description: `Redeemed ${redeemedPoints} on bill`,
      },
    });

    pointsBalance = nextBalance;
    await tx.businessCustomer.update({
      where: { businessId_customerId: { businessId, customerId } },
      data: { pointsBalance },
    });

    // For CASHBACK: redeemedPoints is in ₹. For points types: 1 pt = ₹1 discount
    finalAmount = Math.max(0, billAmount - redeemedPoints);
  }

  // Earning: amountForEarning = subtotal vs amount based on onFinalAmount
  const amountForEarning =
    (context.type === "CASHBACK" && context.config.onFinalAmount) ||
    (context.type === "AMOUNT_SPENT" && context.config.onFinalAmount)
      ? finalAmount
      : billSubtotal != null && billSubtotal > 0
        ? billSubtotal
        : billAmount;

  // VISIT_MADE: only award points if visit qualifies (interval passed or first visit)
  const visitQualifies =
    context.type !== "VISIT_MADE" ||
    isVisitQualifying(context.config, bc?.lastVisitAt ?? null);

  const earnedPoints = visitQualifies
    ? calculatePointsEarnedForBill(amountForEarning, context, {
        resolvedTier,
      })
    : 0;

  if (isCashbackType && earnedPoints > 0) {
    // CASHBACK and TIER: store as cashback (CashbackTransaction + totalCashbackEarned), not points.
    cashbackAmount = earnedPoints;
    finalAmount = Math.max(0, billAmount - cashbackAmount);

    const loyaltyRow = await tx.loyalty.findUnique({
      where: { businessId },
      select: { id: true },
    });

    await tx.cashbackTransaction.create({
      data: {
        businessId,
        customerId,
        billId,
        loyaltyId: loyaltyRow?.id ?? null,
        amount: cashbackAmount,
        source: CashbackSource.BILL,
        description: `Cashback from bill`,
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
      },
    });

    await tx.businessCustomer.update({
      where: { businessId_customerId: { businessId, customerId } },
      data: {
        totalCashbackEarned: { increment: cashbackAmount },
      },
    });
  } else if (!isCashbackType && earnedPoints > 0) {
    // AMOUNT_SPENT and VISIT_MADE: create PointsTransaction EARNED, update pointsBalance.
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

    const nextBalance = pointsBalance + earnedPoints;

    await tx.pointsTransaction.create({
      data: {
        businessId,
        customerId,
        amount: earnedPoints,
        type: TransactionType.EARNED,
        source: TransactionSource.BILL,
        sourceId: billId,
        billId,
        expiresAt,
        remainingAmount: earnedPoints,
        balanceAfter: nextBalance,
        description: `Earned ${earnedPoints} from bill`,
      },
    });

    pointsBalance = nextBalance;
    await tx.businessCustomer.update({
      where: { businessId_customerId: { businessId, customerId } },
      data: { pointsBalance },
    });
  }

  // Update lifetimeSpend, visitCount, currentTierId for TIER / VISIT_MADE
  let tierUpgradeInfo: TierUpgradeInfo | null = null;
  let currentTierInfo: CurrentTierInfo | null = null;

  if (context.type === "TIER" || context.type === "VISIT_MADE") {
    const updateData: {
      lifetimeSpend: { increment: number };
      visitCount?: { increment: number };
      lastVisitAt?: Date;
      currentTierId?: string | null;
    } = { lifetimeSpend: { increment: billAmount } };

    if (context.type === "TIER") {
      updateData.visitCount = { increment: 1 };
      updateData.lastVisitAt = new Date();
      const newTier = resolveTierForLifetimeSpend(
        context.config.tiers,
        (bc?.lifetimeSpend ?? 0) + billAmount,
      );
      updateData.currentTierId = newTier?.id ?? null;

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
      }
    } else if (context.type === "VISIT_MADE" && visitQualifies) {
      updateData.visitCount = { increment: 1 };
      updateData.lastVisitAt = new Date();
    }

    await tx.businessCustomer.update({
      where: { businessId_customerId: { businessId, customerId } },
      data: updateData,
    });
  }

  return {
    loyaltyType: context.type,
    earnedPoints,
    redeemedPoints,
    cashbackAmount,
    pointsBalance,
    finalAmount,
    tierUpgrade: tierUpgradeInfo,
    currentTier: currentTierInfo,
  };
}

export async function expireBucketsForBusiness(params: {
  businessId?: string;
  now?: Date;
}) {
  const now = params.now ?? new Date();

  const expiring = await db.pointsTransaction.findMany({
    where: {
      type: TransactionType.EARNED,
      remainingAmount: { gt: 0 },
      expiresAt: { lt: now, not: null },
      ...(params.businessId ? { businessId: params.businessId } : {}),
    },
    select: { businessId: true, customerId: true },
    distinct: ["businessId", "customerId"],
  });

  let expiredCustomers = 0;
  for (const row of expiring) {
    await db.$transaction(async (tx) => {
      await expireBucketsForCustomer(tx, {
        businessId: row.businessId,
        customerId: row.customerId,
        now,
      });
    });
    expiredCustomers += 1;
  }

  return { expiredCustomers };
}
