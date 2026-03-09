import { withAdminAuth } from "@/lib/auth/middleware";
import {
  analyticsQuerySchema,
  formatDateKeyInOffset,
  generateDateKeysInOffset,
  getPeriodDateRange,
  type AnalyticsPeriod,
} from "@/lib/schemas/analytics";
import type { RevenueDataPoint, RevenueResponse } from "@/lib/types/analytics";
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
          data: [],
          totalRevenue: 0,
          totalOrders: 0,
          averageOrderValue: 0,
        },
        { status: 400 },
      );
    }

    const period = (validation.data.period ?? "30d") as AnalyticsPeriod;
    const tzOffsetMinutes = validation.data.tzOffsetMinutes ?? 0;
    const { from, to } = getPeriodDateRange(period, tzOffsetMinutes);

    const bills = await db.bill.findMany({
      where: { businessId, createdAt: { gte: from, lte: to } },
      select: { finalAmount: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    const dateKeys = generateDateKeysInOffset(from, to, tzOffsetMinutes);
    const grouped = new Map<string, { revenue: number; orders: number }>();
    for (const key of dateKeys) {
      grouped.set(key, { revenue: 0, orders: 0 });
    }

    let totalRevenue = 0;
    let totalOrders = 0;

    for (const bill of bills) {
      const key = formatDateKeyInOffset(bill.createdAt, tzOffsetMinutes);
      const entry = grouped.get(key);
      const amt = bill.finalAmount ?? 0;
      if (entry) {
        entry.revenue += amt;
        entry.orders += 1;
      }
      totalRevenue += amt;
      totalOrders += 1;
    }

    const data: RevenueDataPoint[] = dateKeys.map((date) => {
      const entry = grouped.get(date)!;
      return {
        date,
        revenue: Math.round(entry.revenue * 100) / 100,
        orders: entry.orders,
        aov:
          entry.orders > 0
            ? Math.round((entry.revenue / entry.orders) * 100) / 100
            : 0,
      };
    });

    const averageOrderValue =
      totalOrders > 0
        ? Math.round((totalRevenue / totalOrders) * 100) / 100
        : 0;

    const response: RevenueResponse = {
      data,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalOrders,
      averageOrderValue,
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error("Failed to fetch revenue analytics:", error);
    return NextResponse.json(
      {
        error: sanitizeErrorMessage(error) || "Failed to fetch revenue data.",
        data: [],
        totalRevenue: 0,
        totalOrders: 0,
        averageOrderValue: 0,
      } satisfies RevenueResponse,
      { status: 500 },
    );
  }
});
