import { withAdminAuth } from "@/lib/auth/middleware";
import {
  analyticsQuerySchema,
  getPeriodDateRange,
  type AnalyticsPeriod,
} from "@/lib/schemas/analytics";
import type { LoyaltyOverviewResponse } from "@/lib/types/analytics";
import {
  sanitizeErrorMessage,
  validateSchema,
} from "@/lib/utils/error-handler";
import { db } from "@reelo/db";
import { NextRequest, NextResponse } from "next/server";

export const GET = withAdminAuth(async (request: NextRequest, context) => {
  try {
    const businessId = context.business.id;
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    const validation = validateSchema(analyticsQuerySchema, queryParams);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: validation.error,
          redemptionRate: 0,
          totalPointsIssued: 0,
          totalPointsRedeemed: 0,
          avgRevenuePerRedemption: 0,
        },
        { status: 400 },
      );
    }

    const period = (validation.data.period ?? "30d") as AnalyticsPeriod;
    const tzOffsetMinutes = validation.data.tzOffsetMinutes ?? 0;
    const { from, to } = getPeriodDateRange(period, tzOffsetMinutes);

    const [issuedAgg, redeemedAgg, redeemedTxns] = await Promise.all([
      db.transaction.aggregate({
        where: {
          businessId,
          type: "EARNED",
          createdAt: { gte: from, lte: to },
        },
        _sum: { amount: true },
      }),
      db.transaction.aggregate({
        where: {
          businessId,
          type: "REDEEMED",
          createdAt: { gte: from, lte: to },
        },
        _sum: { amount: true },
        _count: true,
      }),
      db.transaction.findMany({
        where: {
          businessId,
          type: "REDEEMED",
          createdAt: { gte: from, lte: to },
          billId: { not: null },
        },
        select: { billId: true },
      }),
    ]);

    const totalIssued = issuedAgg._sum.amount ?? 0;
    const totalRedeemed = Math.abs(redeemedAgg._sum.amount ?? 0);
    const redeemedCount = redeemedAgg._count;

    const redemptionRate =
      totalIssued + totalRedeemed > 0
        ? Math.round((totalRedeemed / (totalIssued + totalRedeemed)) * 10000) /
          100
        : 0;

    let avgRevenuePerRedemption = 0;
    if (redeemedCount > 0) {
      const billIds = [
        ...new Set(
          redeemedTxns
            .map((t) => t.billId)
            .filter((id): id is string => id !== null),
        ),
      ];
      if (billIds.length > 0) {
        const billRevenue = await db.bill.aggregate({
          where: { id: { in: billIds }, businessId },
          _sum: { finalAmount: true },
        });
        avgRevenuePerRedemption =
          Math.round(
            ((billRevenue._sum.finalAmount ?? 0) / redeemedCount) * 100,
          ) / 100;
      }
    }

    const response: LoyaltyOverviewResponse = {
      redemptionRate,
      totalPointsIssued: Math.round(totalIssued),
      totalPointsRedeemed: Math.round(totalRedeemed),
      avgRevenuePerRedemption,
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error("Failed to fetch loyalty overview:", error);
    return NextResponse.json(
      {
        error:
          sanitizeErrorMessage(error) || "Failed to fetch loyalty overview.",
        redemptionRate: 0,
        totalPointsIssued: 0,
        totalPointsRedeemed: 0,
        avgRevenuePerRedemption: 0,
      } satisfies LoyaltyOverviewResponse,
      { status: 500 },
    );
  }
});
