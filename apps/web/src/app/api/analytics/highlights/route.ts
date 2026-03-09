import { withAdminAuth } from "@/lib/auth/middleware";
import {
  analyticsQuerySchema,
  getPeriodDateRange,
  getStartOfTodayInOffset,
  type AnalyticsPeriod,
} from "@/lib/schemas/analytics";
import type { HighlightsResponse, HighlightStat } from "@/lib/types/analytics";
import {
  sanitizeErrorMessage,
  validateSchema,
} from "@/lib/utils/error-handler";
import { db } from "@reelo/db";
import { NextRequest, NextResponse } from "next/server";

function makeStat(
  label: string,
  value: number,
  previousValue: number,
  todayValue: number,
  format: HighlightStat["format"],
): HighlightStat {
  return { label, value, previousValue, todayValue, format };
}

function emptyResponse(): HighlightsResponse {
  return {
    totalSales: makeStat("Total Sales", 0, 0, 0, "currency"),
    totalOrders: makeStat("Total Orders", 0, 0, 0, "number"),
    newCustomers: makeStat("New Customers", 0, 0, 0, "number"),
    repeatCustomers: makeStat("Repeat Customers", 0, 0, 0, "number"),
    rewardsRedeemed: makeStat("Rewards Redeemed", 0, 0, 0, "number"),
  };
}

function getPreviousPeriodRange(
  period: AnalyticsPeriod,
  tzOffsetMinutes: number,
): {
  from: Date;
  to: Date;
} {
  const { from, to } = getPeriodDateRange(period, tzOffsetMinutes);
  const diff = to.getTime() - from.getTime();
  return {
    from: new Date(from.getTime() - diff),
    to: new Date(from.getTime() - 1),
  };
}

async function getRepeatCount(
  businessId: string,
  from: Date,
  to: Date,
): Promise<number> {
  const customerBillCounts = await db.bill.groupBy({
    by: ["customerId"],
    where: { businessId, createdAt: { gte: from, lte: to } },
    _count: { id: true },
  });

  if (customerBillCounts.length === 0) return 0;

  const customerIds = customerBillCounts.map((c) => c.customerId);
  const allTimeBills = await db.bill.groupBy({
    by: ["customerId"],
    where: { businessId, customerId: { in: customerIds } },
    _count: { id: true },
  });
  return allTimeBills.filter((c) => c._count.id > 1).length;
}

export const GET = withAdminAuth(async (request: NextRequest, context) => {
  try {
    const businessId = context.business.id;
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    const validation = validateSchema(analyticsQuerySchema, queryParams);
    if (!validation.success) {
      return NextResponse.json(
        { ...emptyResponse(), error: validation.error },
        { status: 400 },
      );
    }

    const period = (validation.data.period ?? "30d") as AnalyticsPeriod;
    const tzOffsetMinutes = validation.data.tzOffsetMinutes ?? 0;
    const { from, to } = getPeriodDateRange(period, tzOffsetMinutes);
    const prev = getPreviousPeriodRange(period, tzOffsetMinutes);
    const todayStart = getStartOfTodayInOffset(tzOffsetMinutes);
    const now = new Date();

    const [
      periodSales,
      prevSales,
      todaySales,
      periodOrders,
      prevOrders,
      todayOrders,
      periodNewCustomers,
      prevNewCustomers,
      todayNewCustomers,
      periodRedemptions,
      prevRedemptions,
      todayRedemptions,
    ] = await Promise.all([
      db.bill.aggregate({
        where: { businessId, createdAt: { gte: from, lte: to } },
        _sum: { finalAmount: true },
      }),
      db.bill.aggregate({
        where: { businessId, createdAt: { gte: prev.from, lte: prev.to } },
        _sum: { finalAmount: true },
      }),
      db.bill.aggregate({
        where: { businessId, createdAt: { gte: todayStart, lte: now } },
        _sum: { finalAmount: true },
      }),
      db.bill.count({
        where: { businessId, createdAt: { gte: from, lte: to } },
      }),
      db.bill.count({
        where: { businessId, createdAt: { gte: prev.from, lte: prev.to } },
      }),
      db.bill.count({
        where: { businessId, createdAt: { gte: todayStart, lte: now } },
      }),
      db.businessCustomer.count({
        where: { businessId, createdAt: { gte: from, lte: to } },
      }),
      db.businessCustomer.count({
        where: { businessId, createdAt: { gte: prev.from, lte: prev.to } },
      }),
      db.businessCustomer.count({
        where: { businessId, createdAt: { gte: todayStart, lte: now } },
      }),
      db.transaction.count({
        where: {
          businessId,
          type: "REDEEMED",
          createdAt: { gte: from, lte: to },
        },
      }),
      db.transaction.count({
        where: {
          businessId,
          type: "REDEEMED",
          createdAt: { gte: prev.from, lte: prev.to },
        },
      }),
      db.transaction.count({
        where: {
          businessId,
          type: "REDEEMED",
          createdAt: { gte: todayStart, lte: now },
        },
      }),
    ]);

    const [periodRepeat, prevRepeat, todayRepeat] = await Promise.all([
      getRepeatCount(businessId, from, to),
      getRepeatCount(businessId, prev.from, prev.to),
      getRepeatCount(businessId, todayStart, now),
    ]);

    const response: HighlightsResponse = {
      totalSales: makeStat(
        "Total Sales",
        periodSales._sum.finalAmount ?? 0,
        prevSales._sum.finalAmount ?? 0,
        todaySales._sum.finalAmount ?? 0,
        "currency",
      ),
      totalOrders: makeStat(
        "Total Orders",
        periodOrders,
        prevOrders,
        todayOrders,
        "number",
      ),
      newCustomers: makeStat(
        "New Customers",
        periodNewCustomers,
        prevNewCustomers,
        todayNewCustomers,
        "number",
      ),
      repeatCustomers: makeStat(
        "Repeat Customers",
        periodRepeat,
        prevRepeat,
        todayRepeat,
        "number",
      ),
      rewardsRedeemed: makeStat(
        "Rewards Redeemed",
        periodRedemptions,
        prevRedemptions,
        todayRedemptions,
        "number",
      ),
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error("Failed to fetch highlights:", error);
    return NextResponse.json(
      {
        ...emptyResponse(),
        error:
          sanitizeErrorMessage(error) || "Failed to fetch highlights data.",
      } satisfies HighlightsResponse,
      { status: 500 },
    );
  }
});
