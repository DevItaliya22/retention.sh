import { withAdminAuth } from "@/lib/auth/middleware";
import {
  analyticsQuerySchema,
  getPeriodDateRange,
  type AnalyticsPeriod,
} from "@/lib/schemas/analytics";
import type { CustomerFrequencyResponse } from "@/lib/types/analytics";
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
        { error: validation.error, data: [], totalVisitors: 0 },
        { status: 400 },
      );
    }

    const period = (validation.data.period ?? "30d") as AnalyticsPeriod;
    const tzOffsetMinutes = validation.data.tzOffsetMinutes ?? 0;
    const { from, to } = getPeriodDateRange(period, tzOffsetMinutes);

    const customerBillCounts = await db.bill.groupBy({
      by: ["customerId"],
      where: {
        businessId,
        createdAt: { gte: from, lte: to },
      },
      _count: { id: true },
    });

    let visit1 = 0;
    let visit2 = 0;
    let visit3to5 = 0;
    let visit6plus = 0;

    for (const c of customerBillCounts) {
      const count = c._count.id;
      if (count === 1) visit1++;
      else if (count === 2) visit2++;
      else if (count >= 3 && count <= 5) visit3to5++;
      else if (count >= 6) visit6plus++;
    }

    const response: CustomerFrequencyResponse = {
      data: [
        { bucket: "1 visit", count: visit1 },
        { bucket: "2 visits", count: visit2 },
        { bucket: "3-5 visits", count: visit3to5 },
        { bucket: "6+ visits", count: visit6plus },
      ],
      totalVisitors: customerBillCounts.length,
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error("Failed to fetch customer frequency:", error);
    return NextResponse.json(
      {
        error: sanitizeErrorMessage(error) || "Failed to fetch frequency data.",
        data: [],
        totalVisitors: 0,
      } satisfies CustomerFrequencyResponse,
      { status: 500 },
    );
  }
});
