import { expireBucketsForCustomer } from "@/lib/actions/loyalty";
import { withCustomerAuth } from "@/lib/auth/middleware";
import { resolveTierForLifetimeSpend } from "@/lib/loyalty";
import { businessSlugParamSchema } from "@/lib/schemas/common";
import {
  sanitizeErrorMessage,
  validateSchema,
} from "@/lib/utils/error-handler";
import {
  type IsServiceEnabled,
  isServiceEnabled,
} from "@/lib/utils/service-enabled";
import { db } from "@reelo/db";
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
        include: {
          currentTier: true,
        },
      });

      if (!businessCustomer) {
        return NextResponse.json(
          { error: "Customer not found", loyalty: null },
          { status: 404 },
        );
      }

      // Expire points before returning data
      await db.$transaction(async (tx) => {
        await expireBucketsForCustomer(tx, {
          businessId: business.id,
          customerId: businessCustomer.customerId,
        });
      });

      const refreshed = await db.businessCustomer.findUnique({
        where: {
          businessId_customerId: {
            businessId: business.id,
            customerId: businessCustomer.customerId,
          },
        },
      });

      const pointsBalance = refreshed?.pointsBalance ?? 0;
      const totalCashbackEarned = refreshed?.totalCashbackEarned ?? 0;
      const totalCashbackRedeemed = refreshed?.totalCashbackRedeemed ?? 0;
      const cashbackBalance = totalCashbackEarned - totalCashbackRedeemed;
      const lifetimeSpend = refreshed?.lifetimeSpend ?? 0;
      const visitCount = refreshed?.visitCount ?? 0;

      // Expiring points buckets
      const expiringRows = await db.pointsTransaction.findMany({
        where: {
          businessId: business.id,
          customerId: businessCustomer.customerId,
          type: "EARNED",
          remainingAmount: { gt: 0 },
          expiresAt: { not: null },
        },
        orderBy: { expiresAt: "asc" },
        take: 10,
        select: { id: true, remainingAmount: true, expiresAt: true },
      });

      // Points transactions (AMOUNT_SPENT / VISIT_MADE)
      const transactions = await db.pointsTransaction.findMany({
        where: {
          businessId: business.id,
          customerId: businessCustomer.customerId,
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      });

      // Bill history (CASHBACK / TIER): one row per bill (earned + redeemed from bill fields)
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
      if (loyaltyType === "CASHBACK" || loyaltyType === "TIER") {
        const bills = await db.bill.findMany({
          where: {
            businessId: business.id,
            customerId: businessCustomer.customerId,
          },
          include: {
            cashbackTransactions: {
              where: { source: "BILL" },
              take: 1,
              orderBy: { createdAt: "desc" },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 50,
        });
        cashbackHistory = bills.map((bill) => {
          const ct = bill.cashbackTransactions[0];
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
            cashbackReceived: bill.cashbackAmount ?? ct?.amount ?? 0,
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
          totalCashbackEarned,
          totalCashbackRedeemed,
          cashbackBalance,
          buckets: expiringRows
            .filter((b) => b.expiresAt)
            .map((b) => ({
              id: b.id,
              remainingAmount: b.remainingAmount ?? 0,
              expiresAt: b.expiresAt!.toISOString(),
            })),
          transactions: transactions.map((t) => ({
            id: t.id,
            amount: t.amount,
            type: t.type,
            source: t.source,
            description: t.description,
            createdAt: t.createdAt.toISOString(),
            expiresAt: t.expiresAt ? t.expiresAt.toISOString() : null,
            metadata: t.metadata,
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
