import {
  expirePointsForCustomer,
  getLockedReferralBalance,
  getLockedShopifyBalance,
} from "@/lib/actions/loyalty";
import { withCustomerAuth } from "@/lib/auth/middleware";
import { runTransaction } from "@/lib/db/transaction";
import {
  resolveTierForLifetimeSpend,
  sumCashbackEarnedFromTransactions,
} from "@/lib/loyalty";
import { businessSlugParamSchema } from "@/lib/schemas/common";
import {
  sanitizeErrorMessage,
  validateSchema,
} from "@/lib/utils/error-handler";
import { parseFreeItems } from "@/lib/utils/free-items";
import {
  type IsServiceEnabled,
  isServiceEnabled,
} from "@/lib/utils/service-enabled";
import { db, TransactionValueKind } from "@reelo/db";
import { NextRequest, NextResponse } from "next/server";

export const GET = withCustomerAuth<{ businessSlug: string }>(
  async (_request: NextRequest, context, params) => {
    try {
      const validation = validateSchema(businessSlugParamSchema, params);
      if (!validation.success) {
        return NextResponse.json(
          { loyalty: null, error: validation.error },
          { status: 400 },
        );
      }
      const { businessSlug } = validation.data;

      const business = await db.business.findUnique({
        where: { slug: businessSlug },
        include: {
          loyalty: {
            include: {
              cashbackConfig: true,
              tierConfig: {
                include: { tiers: { orderBy: { rank: "asc" } } },
              },
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
          },
        },
      });

      if (!business) {
        return NextResponse.json(
          { error: "Business not found", loyalty: null },
          { status: 404 },
        );
      }

      if (
        !isServiceEnabled(
          business.isServiceEnabled as IsServiceEnabled | null | undefined,
          "loyalty",
        )
      ) {
        return NextResponse.json(
          { error: "Loyalty is not enabled for this business", loyalty: null },
          { status: 403 },
        );
      }

      const businessCustomer = await db.businessCustomer.findUnique({
        where: {
          businessId_customerId: {
            businessId: business.id,
            customerId: context.customer.id,
          },
        },
      });

      if (!businessCustomer) {
        return NextResponse.json(
          { error: "Customer not found", loyalty: null },
          { status: 404 },
        );
      }

      await runTransaction(async (tx) => {
        await expirePointsForCustomer(tx, {
          businessId: business.id,
          customerId: businessCustomer.customerId,
        });
      });

      const wallet = await db.wallet.findUnique({
        where: {
          businessId_customerId: {
            businessId: business.id,
            customerId: businessCustomer.customerId,
          },
        },
      });

      const amountSpentBalance = wallet?.amountSpentBalance ?? 0;
      const visitPointsBalance = wallet?.visitPointsBalance ?? 0;
      const rawCashbackBalance = wallet?.cashbackBalance ?? 0;
      const visitCount = wallet?.visitCount ?? 0;

      const { lockedCashback, lockedReferralCashback } = await runTransaction(
        async (tx) => ({
          lockedCashback: await getLockedShopifyBalance(tx, {
            businessId: business.id,
            customerId: businessCustomer.customerId,
            valueKind: TransactionValueKind.CASHBACK,
          }),
          lockedReferralCashback: await getLockedReferralBalance(tx, {
            businessId: business.id,
            customerId: businessCustomer.customerId,
          }),
        }),
      );
      const cashbackBalance = Math.max(
        0,
        rawCashbackBalance - lockedCashback - lockedReferralCashback,
      );

      const billsAgg = await db.bill.aggregate({
        where: {
          businessId: business.id,
          customerId: businessCustomer.customerId,
        },
        _sum: { finalAmount: true },
      });
      const aggregateSpend = billsAgg._sum.finalAmount ?? 0;
      const lifetimeSpend =
        wallet?.lifetimeSpend != null && wallet.lifetimeSpend > 0
          ? wallet.lifetimeSpend
          : aggregateSpend;

      const transactions = await db.transaction.findMany({
        where: {
          businessId: business.id,
          customerId: businessCustomer.customerId,
        },
        include: { campaign: { select: { title: true } } },
        orderBy: { createdAt: "desc" },
        take: 200,
      });

      let cashbackHistory: Array<{
        id: string;
        date: string;
        billNumber: string;
        amountSpent: number;
        cashbackReceived: number;
        cashbackRedeemed: number;
        tierName: string | null;
        cashbackPercentage: number | null;
      }> = [];
      const loyaltyType = business.loyalty?.loyaltyType ?? null;
      const pointsBalance =
        loyaltyType === "AMOUNT_SPENT"
          ? amountSpentBalance
          : loyaltyType === "VISIT_MADE"
            ? visitPointsBalance
            : amountSpentBalance + visitPointsBalance;

      if (loyaltyType === "CASHBACK" || loyaltyType === "TIER") {
        const bills = await db.bill.findMany({
          where: {
            businessId: business.id,
            customerId: businessCustomer.customerId,
          },
          include: {
            transactions: {
              where: { valueKind: "CASHBACK", type: "EARNED" },
              select: {
                type: true,
                valueKind: true,
                amount: true,
                metadata: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 50,
        });
        cashbackHistory = bills.map((bill) => {
          const cashbackReceived = sumCashbackEarnedFromTransactions(
            bill.transactions,
          );
          const ct = bill.transactions[0];
          const meta =
            (ct?.metadata as {
              tierName?: string;
              cashbackPercentage?: number;
            } | null) ?? {};
          return {
            id: bill.id,
            date: bill.createdAt.toISOString(),
            billNumber: bill.billNumber,
            amountSpent: bill.finalAmount ?? 0,
            cashbackReceived:
              cashbackReceived > 0
                ? cashbackReceived
                : (bill.cashbackAmount ?? 0),
            cashbackRedeemed: bill.cashbackRedeemedAmount ?? 0,
            tierName: meta.tierName ?? null,
            cashbackPercentage: meta.cashbackPercentage ?? null,
          };
        });
      }

      // Build type-specific data
      let tierInfo = null;
      let cashbackInfo = null;
      let amountSpentInfo = null;
      let visitMadeInfo = null;

      if (loyaltyType === "CASHBACK" && business.loyalty?.cashbackConfig) {
        cashbackInfo = {
          cashbackPercentage:
            business.loyalty.cashbackConfig.cashbackPercentage,
        };
      }

      if (loyaltyType === "TIER" && business.loyalty?.tierConfig) {
        const tiers = business.loyalty.tierConfig.tiers;
        const resolvedTier = resolveTierForLifetimeSpend(
          tiers.map((t) => ({
            id: t.id,
            name: t.name,
            rank: t.rank,
            minLifetimeSpend: t.minLifetimeSpend,
            maxLifetimeSpend: t.maxLifetimeSpend,
            cashbackPercentage: t.cashbackPercentage,
            minPurchaseForRedemptionEnabled: t.minPurchaseForRedemptionEnabled,
            minPurchaseForRedemption: t.minPurchaseForRedemption,
            maxCashbackCapEnabled: t.maxCashbackCapEnabled,
            maxCashbackCap: t.maxCashbackCap,
          })),
          lifetimeSpend,
        );

        // Find next tier
        const sortedTiers = [...tiers].sort((a, b) => a.rank - b.rank);
        const currentRank = resolvedTier?.rank ?? 0;
        const nextTier = sortedTiers.find((t) => t.rank > currentRank) ?? null;
        const spendToNextTier = nextTier
          ? Math.max(0, nextTier.minLifetimeSpend - lifetimeSpend)
          : null;

        tierInfo = {
          currentTier: resolvedTier
            ? {
                name: resolvedTier.name,
                rank: resolvedTier.rank,
                cashbackPercentage: resolvedTier.cashbackPercentage,
              }
            : null,
          allTiers: sortedTiers.map((t) => ({
            id: t.id,
            name: t.name,
            rank: t.rank,
            minLifetimeSpend: t.minLifetimeSpend,
            maxLifetimeSpend: t.maxLifetimeSpend,
            cashbackPercentage: t.cashbackPercentage,
          })),
          lifetimeSpend,
          nextTier: nextTier
            ? {
                name: nextTier.name,
                minLifetimeSpend: nextTier.minLifetimeSpend,
                cashbackPercentage: nextTier.cashbackPercentage,
              }
            : null,
          spendToNextTier,
        };
      }

      if (
        loyaltyType === "AMOUNT_SPENT" &&
        business.loyalty?.amountSpentConfig
      ) {
        const stages = business.loyalty.amountSpentConfig.rewardStages ?? [];

        // Find next unreachable stage
        const nextStage =
          stages.find((s) => s.pointsRequired > pointsBalance) ?? null;

        amountSpentInfo = {
          pointsPerRupee: business.loyalty.amountSpentConfig.pointsPerRupee,
          rewardStages: stages.map((s) => ({
            id: s.id,
            rewardName: s.rewardName,
            rewardType: s.rewardType,
            pointsRequired: s.pointsRequired,
            canRedeem: s.pointsRequired <= pointsBalance,
            freeItemName: s.freeItemName,
            percentageValue: s.percentageValue,
            cashAmount: s.cashAmount,
          })),
          nextStage: nextStage
            ? {
                rewardName: nextStage.rewardName,
                pointsRequired: nextStage.pointsRequired,
                pointsNeeded: nextStage.pointsRequired - pointsBalance,
              }
            : null,
        };
      }

      if (loyaltyType === "VISIT_MADE" && business.loyalty?.visitMadeConfig) {
        const stages = business.loyalty.visitMadeConfig.rewardStages ?? [];

        const nextStage =
          stages.find((s) => s.pointsRequired > pointsBalance) ?? null;

        visitMadeInfo = {
          visitCount,
          pointsPerVisit: business.loyalty.visitMadeConfig.pointsPerVisit,
          rewardStages: stages.map((s) => ({
            id: s.id,
            rewardName: s.rewardName,
            rewardType: s.rewardType,
            pointsRequired: s.pointsRequired,
            canRedeem: s.pointsRequired <= pointsBalance,
            freeItemName: s.freeItemName,
            percentageValue: s.percentageValue,
            cashAmount: s.cashAmount,
          })),
          nextStage: nextStage
            ? {
                rewardName: nextStage.rewardName,
                pointsRequired: nextStage.pointsRequired,
                pointsNeeded: nextStage.pointsRequired - pointsBalance,
              }
            : null,
        };
      }

      return NextResponse.json({
        loyalty: {
          business: {
            id: business.id,
            name: business.name,
            slug: business.slug,
            currencySymbol: business.defaultCurrencySymbol,
            currencyCode: business.defaultCurrencyCode,
          },
          loyaltyType,
          pointsBalance,
          cashbackBalance,
          freeItems: parseFreeItems(wallet?.freeItems),
          transactions: transactions.map((t) => ({
            id: t.id,
            valueKind: t.valueKind,
            amount: t.amount,
            type: t.type,
            source: t.source,
            description: t.description,
            createdAt: t.createdAt.toISOString(),
            expiresAt: t.expiresAt ? t.expiresAt.toISOString() : null,
            metadata: t.metadata,
            campaignTitle: t.campaign?.title ?? null,
          })),
          cashbackHistory,
          tierInfo,
          cashbackInfo,
          amountSpentInfo,
          visitMadeInfo,
        },
      });
    } catch (error: any) {
      console.error("Failed to fetch customer loyalty:", error);
      return NextResponse.json(
        {
          loyalty: null,
          error:
            sanitizeErrorMessage(error) ||
            "Failed to fetch loyalty data. Please try again.",
        },
        { status: 500 },
      );
    }
  },
);
