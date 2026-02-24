/**
 * Loyalty for Shopify orders: grant points on fulfillment, deduct on refund.
 * Points are locked until return_window_ends_at (not redeemable until then).
 */
import { getBusinessLoyaltyContext } from "@/lib/actions/loyalty";
import {
  calculatePointsEarnedForBill,
  getAmountForEarning,
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
  Prisma,
  TransactionSource,
  TransactionType,
  TransactionValueKind,
} from "@reelo/db";

function pointsValueKind(
  context: LoyaltyContext,
):
  | typeof TransactionValueKind.AMOUNT_SPENT_POINTS
  | typeof TransactionValueKind.VISIT_POINTS {
  return context.type === "AMOUNT_SPENT"
    ? TransactionValueKind.AMOUNT_SPENT_POINTS
    : TransactionValueKind.VISIT_POINTS;
}

/**
 * Apply loyalty earning for a fulfilled Shopify order. No redemption.
 * Creates Transaction with source SHOPIFY_ORDER and metadata.lockedUntil = returnWindowEndsAt.
 */
export async function applyLoyaltyForShopifyOrder(
  tx: Prisma.TransactionClient,
  params: {
    businessId: string;
    customerId: string;
    shopifyOrderId: string;
    orderTotalAmount: number;
    returnWindowEndsAt: Date;
    loyaltyId: string | null;
    /** When set, link transactions to this bill (Bill created from Shopify order). */
    billId?: string | null;
  },
): Promise<{ cashbackAmount: number; pointsAmount: number }> {
  const {
    businessId,
    customerId,
    shopifyOrderId,
    orderTotalAmount,
    returnWindowEndsAt,
    loyaltyId,
    billId,
  } = params;

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
    return { cashbackAmount: 0, pointsAmount: 0 };
  }

  const context = await getBusinessLoyaltyContext(tx, businessId);
  if (!context) return { cashbackAmount: 0, pointsAmount: 0 };

  // Ensure wallet exists (webhook creates it via findOrCreateCustomerByEmail; this guards edge cases)
  const existingWallet = await tx.wallet.findUnique({
    where: { businessId_customerId: { businessId, customerId } },
  });
  if (!existingWallet) {
    await tx.wallet.create({
      data: { businessId, customerId },
    });
  }

  const wallet = await tx.wallet.findUnique({
    where: { businessId_customerId: { businessId, customerId } },
  });
  const aggregateSpend = wallet?.lifetimeSpend ?? 0;
  const resolvedTier =
    context.type === "TIER"
      ? resolveTierForLifetimeSpend(context.config.tiers, aggregateSpend)
      : null;

  const amountForEarning = getAmountForEarning(
    context,
    orderTotalAmount,
    orderTotalAmount,
    orderTotalAmount,
  );
  const visitQualifies =
    context.type !== "VISIT_MADE" ||
    isVisitQualifying(context.config, wallet?.lastVisitAt ?? null);
  const rawEarned = visitQualifies
    ? calculatePointsEarnedForBill(amountForEarning, context, { resolvedTier })
    : 0;
  const earnedPoints = Math.max(0, rawEarned);

  const metadataWithLock = {
    lockedUntil: returnWindowEndsAt.toISOString(),
    source: "shopify_order",
  };

  if (
    (context.type === "CASHBACK" || context.type === "TIER") &&
    earnedPoints > 0
  ) {
    const cashbackExpiresAt =
      context.config.pointExpiryDays != null &&
      context.config.pointExpiryDays > 0
        ? (() => {
            const d = new Date();
            d.setDate(d.getDate() + context.config.pointExpiryDays!);
            return d;
          })()
        : null;
    await tx.transaction.create({
      data: {
        businessId,
        customerId,
        billId: billId ?? null,
        shopifyOrderId,
        loyaltyId,
        valueKind: TransactionValueKind.CASHBACK,
        amount: earnedPoints,
        type: TransactionType.EARNED,
        source: TransactionSource.SHOPIFY_ORDER,
        sourceId: shopifyOrderId,
        expiresAt: cashbackExpiresAt ?? undefined,
        description: "Cashback from Shopify order (delivered)",
        metadata: {
          ...metadataWithLock,
          ...(context.type === "TIER" && resolvedTier
            ? {
                tierName: resolvedTier.name,
                cashbackPercentage: resolvedTier.cashbackPercentage,
              }
            : context.type === "CASHBACK"
              ? { cashbackPercentage: context.config.cashbackPercentage }
              : {}),
        },
      },
    });
    await tx.wallet.update({
      where: { businessId_customerId: { businessId, customerId } },
      data: {
        cashbackBalance: { increment: earnedPoints },
        lifetimeSpend: { increment: orderTotalAmount },
      },
    });
    return { cashbackAmount: earnedPoints, pointsAmount: 0 };
  }

  if (
    (context.type === "AMOUNT_SPENT" || context.type === "VISIT_MADE") &&
    earnedPoints > 0
  ) {
    const expiryDays = getExpiryDays(context.config.pointExpiryDays);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiryDays);
    const valueKind = pointsValueKind(context);
    await tx.transaction.create({
      data: {
        businessId,
        customerId,
        billId: billId ?? null,
        shopifyOrderId,
        loyaltyId,
        valueKind,
        amount: earnedPoints,
        type: TransactionType.EARNED,
        source: TransactionSource.SHOPIFY_ORDER,
        sourceId: shopifyOrderId,
        expiresAt,
        description: "Points from Shopify order (delivered)",
        metadata: metadataWithLock,
      },
    });
    const balanceField =
      context.type === "AMOUNT_SPENT"
        ? { amountSpentBalance: { increment: earnedPoints } }
        : { visitPointsBalance: { increment: earnedPoints } };
    const updateData =
      context.type === "VISIT_MADE" && visitQualifies
        ? {
            ...balanceField,
            visitCount: { increment: 1 },
            lastVisitAt: new Date(),
          }
        : balanceField;
    await tx.wallet.update({
      where: { businessId_customerId: { businessId, customerId } },
      data: { ...updateData, lifetimeSpend: { increment: orderTotalAmount } },
    });
    return { cashbackAmount: 0, pointsAmount: earnedPoints };
  }

  if (context.type === "TIER" || context.type === "VISIT_MADE") {
    const updateData: {
      visitCount?: { increment: number };
      lastVisitAt?: Date;
      lifetimeSpend?: { increment: number };
    } = {
      lifetimeSpend: { increment: orderTotalAmount },
    };
    if (context.type === "TIER") {
      updateData.visitCount = { increment: 1 };
      updateData.lastVisitAt = new Date();
    } else if (context.type === "VISIT_MADE" && visitQualifies) {
      updateData.visitCount = { increment: 1 };
      updateData.lastVisitAt = new Date();
    }
    await tx.wallet.update({
      where: { businessId_customerId: { businessId, customerId } },
      data: updateData,
    });
  }

  return { cashbackAmount: 0, pointsAmount: 0 };
}

/**
 * Deduct loyalty for a refunded Shopify order: create REFUNDED transactions and update wallet.
 */
export async function deductLoyaltyForShopifyOrderRefund(
  tx: Prisma.TransactionClient,
  params: { shopifyOrderId: string },
): Promise<void> {
  const earned = await tx.transaction.findMany({
    where: {
      shopifyOrderId: params.shopifyOrderId,
      type: TransactionType.EARNED,
      source: TransactionSource.SHOPIFY_ORDER,
    },
    select: {
      id: true,
      businessId: true,
      customerId: true,
      valueKind: true,
      amount: true,
    },
  });

  for (const row of earned) {
    const refundAmount = Math.max(0, row.amount);
    if (refundAmount === 0) continue;
    await tx.transaction.create({
      data: {
        businessId: row.businessId,
        customerId: row.customerId,
        shopifyOrderId: params.shopifyOrderId,
        valueKind: row.valueKind,
        amount: -refundAmount,
        type: TransactionType.REFUNDED,
        source: TransactionSource.SHOPIFY_ORDER,
        sourceId: params.shopifyOrderId,
        description: "Refunded: Shopify order returned/cancelled",
      },
    });
    if (row.valueKind === TransactionValueKind.CASHBACK) {
      await tx.wallet.update({
        where: {
          businessId_customerId: {
            businessId: row.businessId,
            customerId: row.customerId,
          },
        },
        data: { cashbackBalance: { decrement: refundAmount } },
      });
    } else if (row.valueKind === TransactionValueKind.AMOUNT_SPENT_POINTS) {
      await tx.wallet.update({
        where: {
          businessId_customerId: {
            businessId: row.businessId,
            customerId: row.customerId,
          },
        },
        data: { amountSpentBalance: { decrement: refundAmount } },
      });
    } else if (row.valueKind === TransactionValueKind.VISIT_POINTS) {
      await tx.wallet.update({
        where: {
          businessId_customerId: {
            businessId: row.businessId,
            customerId: row.customerId,
          },
        },
        data: { visitPointsBalance: { decrement: refundAmount } },
      });
    }
  }
}
