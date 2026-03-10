import { withAdminAuth } from "@/lib/auth/middleware";
import {
  analyticsPeriods,
  getPeriodDateRange,
  type AnalyticsPeriod,
} from "@/lib/schemas/analytics";
import { getSegmentCustomerIdsForSlugs } from "@/lib/segmentation";
import { sanitizeErrorMessage } from "@/lib/utils/error-handler";
import { db } from "@reelo/db";
import { NextRequest, NextResponse } from "next/server";

export interface RfmStatsResponse {
  totalCustomers: number;
  repeatCustomers: number;
  filteredCount: number;
}

export const GET = withAdminAuth(async (request: NextRequest, context) => {
  try {
    const businessId = context.business.id;
    const { searchParams } = new URL(request.url);
    const segmentParam = searchParams.get("segment");
    const periodParam = searchParams.get("period");
    const tzOffsetMinutes = Number(searchParams.get("tzOffsetMinutes") ?? 0);

    const period: AnalyticsPeriod = analyticsPeriods.includes(
      periodParam as AnalyticsPeriod,
    )
      ? (periodParam as AnalyticsPeriod)
      : "30d";

    const { from, to } = getPeriodDateRange(period, tzOffsetMinutes);

    // Resolve segment customer IDs if a segment filter is active
    let scopedCustomerIds: string[] | null = null;
    if (segmentParam) {
      const slugs = segmentParam
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (slugs.length > 0) {
        scopedCustomerIds = await getSegmentCustomerIdsForSlugs(
          businessId,
          slugs,
        );
      }
    }

    // All-time total (no filters ever)
    const [totalCustomers, billCounts, filteredCount] = await Promise.all([
      db.businessCustomer.count({ where: { businessId } }),
      db.bill.groupBy({
        by: ["customerId"],
        where: { businessId },
        _count: { id: true },
      }),
      // 3rd card: new customers who joined in the period (+ optional segment)
      db.businessCustomer.count({
        where: {
          businessId,
          createdAt: { gte: from, lte: to },
          ...(scopedCustomerIds !== null
            ? { customerId: { in: scopedCustomerIds } }
            : {}),
        },
      }),
    ]);

    const repeatCustomers = billCounts.filter((c) => c._count.id >= 2).length;

    const response: RfmStatsResponse = {
      totalCustomers,
      repeatCustomers,
      filteredCount,
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error("Failed to fetch RFM stats:", error);
    return NextResponse.json(
      {
        error: sanitizeErrorMessage(error) || "Failed to fetch RFM stats.",
        totalCustomers: 0,
        repeatCustomers: 0,
        filteredCount: 0,
      } satisfies RfmStatsResponse & { error: string },
      { status: 500 },
    );
  }
});
