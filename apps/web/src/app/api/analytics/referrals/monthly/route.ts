import { withAdminAuth } from "@/lib/auth/middleware";
import { analyticsQuerySchema } from "@/lib/schemas/analytics";
import type { ReferralMonthlyResponse } from "@/lib/types/analytics";
import {
  sanitizeErrorMessage,
  validateSchema,
} from "@/lib/utils/error-handler";
import { db } from "@reelo/db";
import { NextRequest, NextResponse } from "next/server";

const emptyResponse: ReferralMonthlyResponse = { data: [] };

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

    const tzOffsetMinutes = validation.data.tzOffsetMinutes ?? 0;
    const offsetMs = tzOffsetMinutes * 60_000;

    const now = new Date();
    const localNow = new Date(now.getTime() - offsetMs);
    const startMonth = new Date(
      Date.UTC(localNow.getUTCFullYear(), localNow.getUTCMonth() - 11, 1),
    );
    const from = new Date(startMonth.getTime() + offsetMs);

    const monthKeys: string[] = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date(
        Date.UTC(startMonth.getUTCFullYear(), startMonth.getUTCMonth() + i, 1),
      );
      monthKeys.push(
        `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`,
      );
    }

    const [referralLogs, rewardTxns, referredCustomers] = await Promise.all([
      db.referralLog.findMany({
        where: {
          referrerBusinessId: businessId,
          createdAt: { gte: from },
        },
        select: {
          becameCustomer: true,
          createdAt: true,
        },
      }),
      db.transaction.findMany({
        where: {
          businessId,
          source: "REFERRAL",
          type: "EARNED",
          createdAt: { gte: from },
        },
        select: {
          billId: true,
          amount: true,
          createdAt: true,
        },
      }),
      db.businessCustomer.findMany({
        where: {
          businessId,
          referredByBusinessId: businessId,
          referredByCustomerId: { not: null },
        },
        select: { customerId: true },
      }),
    ]);

    const rewardBillIds = [
      ...new Set(
        rewardTxns
          .map((t) => t.billId)
          .filter((id): id is string => id !== null && id !== undefined),
      ),
    ];

    const referredBills =
      rewardBillIds.length > 0
        ? await db.bill.findMany({
            where: {
              businessId,
              id: { in: rewardBillIds },
            },
            select: {
              finalAmount: true,
              createdAt: true,
            },
          })
        : [];

    type MonthBucket = {
      totalReferrals: number;
      converted: number;
      rewardsCost: number;
      referralRevenue: number;
    };

    const monthMap = new Map<string, MonthBucket>();
    for (const key of monthKeys) {
      monthMap.set(key, {
        totalReferrals: 0,
        converted: 0,
        rewardsCost: 0,
        referralRevenue: 0,
      });
    }

    for (const log of referralLogs) {
      const local = new Date(log.createdAt.getTime() - offsetMs);
      const key = `${local.getUTCFullYear()}-${String(local.getUTCMonth() + 1).padStart(2, "0")}`;
      const bucket = monthMap.get(key);
      if (bucket) {
        bucket.totalReferrals++;
        if (log.becameCustomer) bucket.converted++;
      }
    }

    for (const txn of rewardTxns) {
      const local = new Date(txn.createdAt.getTime() - offsetMs);
      const key = `${local.getUTCFullYear()}-${String(local.getUTCMonth() + 1).padStart(2, "0")}`;
      const bucket = monthMap.get(key);
      if (bucket) {
        bucket.rewardsCost += Math.abs(txn.amount);
      }
    }

    for (const bill of referredBills) {
      const local = new Date(bill.createdAt.getTime() - offsetMs);
      const key = `${local.getUTCFullYear()}-${String(local.getUTCMonth() + 1).padStart(2, "0")}`;
      const bucket = monthMap.get(key);
      if (bucket) {
        bucket.referralRevenue += bill.finalAmount ?? 0;
      }
    }

    const data = monthKeys.map((month) => {
      const bucket = monthMap.get(month)!;
      return {
        month,
        totalReferrals: bucket.totalReferrals,
        converted: bucket.converted,
        rewardsCost: Math.round(bucket.rewardsCost * 100) / 100,
        referralRevenue: Math.round(bucket.referralRevenue * 100) / 100,
      };
    });

    return NextResponse.json({ data } satisfies ReferralMonthlyResponse);
  } catch (error: unknown) {
    console.error("Failed to fetch referral monthly:", error);
    return NextResponse.json(
      {
        ...emptyResponse,
        error:
          sanitizeErrorMessage(error) || "Failed to fetch referral monthly.",
      } satisfies ReferralMonthlyResponse,
      { status: 500 },
    );
  }
});
