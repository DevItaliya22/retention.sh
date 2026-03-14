import { withAdminAuth } from "@/lib/auth/middleware";
import {
  analyticsQuerySchema,
  getPeriodDateRange,
  type AnalyticsPeriod,
} from "@/lib/schemas/analytics";
import type { ReferralOverviewResponse } from "@/lib/types/analytics";
import {
  sanitizeErrorMessage,
  validateSchema,
} from "@/lib/utils/error-handler";
import { db } from "@reelo/db";
import { NextRequest, NextResponse } from "next/server";

const emptyResponse: ReferralOverviewResponse = {
  totalReferrals: 0,
  conversionRate: 0,
  rewardsCost: 0,
  referralRevenue: 0,
  avgDaysToFirstVisit: null,
  rewardsLocked: 0,
  rewardsUnlocked: 0,
  avgReferredCustomerSpend: 0,
};

export const GET = withAdminAuth(async (request: NextRequest, context) => {
  try {
    const businessId = context.business.id;
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    const validation = validateSchema(analyticsQuerySchema, queryParams);
    if (!validation.success) {
      return NextResponse.json(
        { ...emptyResponse, error: validation.error },
        { status: 400 },
      );
    }

    const period = (validation.data.period ?? "30d") as AnalyticsPeriod;
    const tzOffsetMinutes = validation.data.tzOffsetMinutes ?? 0;
    const { from, to } = getPeriodDateRange(period, tzOffsetMinutes);

    const [
      referralLogs,
      rewardsCostAgg,
      rewardTxnsWithBills,
      referredCustomers,
    ] = await Promise.all([
      db.referralLog.findMany({
        where: {
          referrerBusinessId: businessId,
          createdAt: { gte: from, lte: to },
        },
        select: {
          becameCustomer: true,
          rewardPoints: true,
          referrerRewardUnlockedAt: true,
          referredBusinessId: true,
          referredCustomerId: true,
          createdAt: true,
        },
      }),
      db.transaction.aggregate({
        where: {
          businessId,
          source: "REFERRAL",
          type: "EARNED",
          createdAt: { gte: from, lte: to },
        },
        _sum: { amount: true },
      }),
      db.transaction.findMany({
        where: {
          businessId,
          source: "REFERRAL",
          type: "EARNED",
          billId: { not: null },
          createdAt: { gte: from, lte: to },
        },
        select: {
          billId: true,
        },
      }),
      db.businessCustomer.findMany({
        where: {
          businessId,
          referredByBusinessId: businessId,
          referredByCustomerId: { not: null },
        },
        select: {
          customerId: true,
          createdAt: true,
        },
      }),
    ]);

    const totalReferrals = referralLogs.length;
    const converted = referralLogs.filter((r) => r.becameCustomer).length;
    const conversionRate =
      totalReferrals > 0
        ? Math.round((converted / totalReferrals) * 10000) / 100
        : 0;
    const rewardsCost = Math.abs(rewardsCostAgg._sum.amount ?? 0);

    let rewardsLocked = 0;
    let rewardsUnlocked = 0;
    for (const log of referralLogs) {
      if (log.referrerRewardUnlockedAt) {
        rewardsUnlocked += log.rewardPoints;
      } else if (!log.becameCustomer) {
        rewardsLocked += log.rewardPoints;
      }
    }

    const referredCustomerIds = referredCustomers.map((c) => c.customerId);

    let referralRevenue = 0;
    let avgReferredCustomerSpend = 0;
    let avgDaysToFirstVisit: number | null = null;

    if (referredCustomerIds.length > 0) {
      const rewardBillIds = [
        ...new Set(
          rewardTxnsWithBills
            .map((t) => t.billId)
            .filter((id): id is string => id !== null && id !== undefined),
        ),
      ];

      if (rewardBillIds.length > 0) {
        const [revAgg, referredBills] = await Promise.all([
          db.bill.aggregate({
            where: {
              businessId,
              id: { in: rewardBillIds },
              createdAt: { gte: from, lte: to },
            },
            _sum: { finalAmount: true },
            _count: true,
          }),
          db.bill.findMany({
            where: {
              businessId,
              customerId: { in: referredCustomerIds },
            },
            select: {
              customerId: true,
              createdAt: true,
            },
            orderBy: { createdAt: "asc" },
          }),
        ]);

        referralRevenue =
          Math.round((revAgg._sum.finalAmount ?? 0) * 100) / 100;
        const billCount = revAgg._count;
        avgReferredCustomerSpend =
          billCount > 0
            ? Math.round((referralRevenue / billCount) * 100) / 100
            : 0;

        const firstBillByCustomer = new Map<string, Date>();
        for (const bill of referredBills) {
          if (!firstBillByCustomer.has(bill.customerId)) {
            firstBillByCustomer.set(bill.customerId, bill.createdAt);
          }
        }

        const customerCreatedMap = new Map<string, Date>();
        for (const c of referredCustomers) {
          customerCreatedMap.set(c.customerId, c.createdAt);
        }

        const daysToVisit: number[] = [];
        for (const [custId, firstBillDate] of firstBillByCustomer) {
          const createdAt = customerCreatedMap.get(custId);
          if (createdAt) {
            const diffMs = firstBillDate.getTime() - createdAt.getTime();
            const diffDays = Math.max(0, Math.round(diffMs / 86_400_000));
            daysToVisit.push(diffDays);
          }
        }

        if (daysToVisit.length > 0) {
          const sum = daysToVisit.reduce((a, b) => a + b, 0);
          avgDaysToFirstVisit =
            Math.round((sum / daysToVisit.length) * 10) / 10;
        }
      }
    }

    return NextResponse.json({
      totalReferrals,
      conversionRate,
      rewardsCost,
      referralRevenue,
      avgDaysToFirstVisit,
      rewardsLocked,
      rewardsUnlocked,
      avgReferredCustomerSpend,
    } satisfies ReferralOverviewResponse);
  } catch (error: unknown) {
    console.error("Failed to fetch referral overview:", error);
    return NextResponse.json(
      {
        ...emptyResponse,
        error:
          sanitizeErrorMessage(error) || "Failed to fetch referral overview.",
      } satisfies ReferralOverviewResponse,
      { status: 500 },
    );
  }
});
