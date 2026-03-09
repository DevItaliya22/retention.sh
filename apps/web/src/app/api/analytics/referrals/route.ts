import { withAdminAuth } from "@/lib/auth/middleware";
import {
  analyticsQuerySchema,
  getPeriodDateRange,
  type AnalyticsPeriod,
} from "@/lib/schemas/analytics";
import type { ReferralAnalyticsResponse } from "@/lib/types/analytics";
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
          totalReferred: 0,
          converted: 0,
          conversionRate: 0,
          totalRewardPoints: 0,
        },
        { status: 400 },
      );
    }

    const period = (validation.data.period ?? "30d") as AnalyticsPeriod;
    const tzOffsetMinutes = validation.data.tzOffsetMinutes ?? 0;
    const { from, to } = getPeriodDateRange(period, tzOffsetMinutes);

    const referrals = await db.referralLog.findMany({
      where: {
        referrerBusinessId: businessId,
        createdAt: { gte: from, lte: to },
      },
      select: {
        becameCustomer: true,
        rewardPoints: true,
      },
    });

    const totalReferred = referrals.length;
    let converted = 0;
    let totalRewardPoints = 0;

    for (const r of referrals) {
      if (r.becameCustomer) converted++;
      totalRewardPoints += r.rewardPoints;
    }

    const conversionRate =
      totalReferred > 0
        ? Math.round((converted / totalReferred) * 10000) / 100
        : 0;

    const response: ReferralAnalyticsResponse = {
      totalReferred,
      converted,
      conversionRate,
      totalRewardPoints,
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error("Failed to fetch referral analytics:", error);
    return NextResponse.json(
      {
        error:
          sanitizeErrorMessage(error) || "Failed to fetch referral analytics.",
        totalReferred: 0,
        converted: 0,
        conversionRate: 0,
        totalRewardPoints: 0,
      } satisfies ReferralAnalyticsResponse,
      { status: 500 },
    );
  }
});
