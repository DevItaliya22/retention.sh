import { withAdminAuth } from "@/lib/auth/middleware";
import {
  analyticsQuerySchema,
  getPeriodDateRange,
  type AnalyticsPeriod,
} from "@/lib/schemas/analytics";
import type { TopRewardsResponse } from "@/lib/types/analytics";
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
        { error: validation.error, data: [] },
        { status: 400 },
      );
    }

    const period = (validation.data.period ?? "30d") as AnalyticsPeriod;
    const { from, to } = getPeriodDateRange(period);

    const transactions = await db.transaction.findMany({
      where: {
        businessId,
        type: "REDEEMED",
        createdAt: { gte: from, lte: to },
      },
      select: { description: true },
    });

    const counts = new Map<string, number>();
    for (const tx of transactions) {
      const name = tx.description || "Unknown Reward";
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }

    const data = [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const response: TopRewardsResponse = { data };
    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error("Failed to fetch top rewards:", error);
    return NextResponse.json(
      {
        error: sanitizeErrorMessage(error) || "Failed to fetch top rewards.",
        data: [],
      } satisfies TopRewardsResponse,
      { status: 500 },
    );
  }
});
