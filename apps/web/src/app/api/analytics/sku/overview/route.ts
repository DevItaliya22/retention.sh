import { withAdminAuth } from "@/lib/auth/middleware";
import {
  analyticsQuerySchema,
  getPeriodDateRange,
  type AnalyticsPeriod,
} from "@/lib/schemas/analytics";
import type { SkuOverviewResponse } from "@/lib/types/analytics";
import {
  sanitizeErrorMessage,
  validateSchema,
} from "@/lib/utils/error-handler";
import { db } from "@reelo/db";
import { NextRequest, NextResponse } from "next/server";

const emptyResponse: SkuOverviewResponse = {
  itemsSold: 0,
  itemRevenue: 0,
  uniqueSkusSold: 0,
  avgItemsPerBill: 0,
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

    const [qtyAgg, uniqueSkus, uniqueBills] = await Promise.all([
      db.billLineItem.aggregate({
        where: {
          bill: { businessId, createdAt: { gte: from, lte: to } },
        },
        _sum: { qty: true },
      }),
      db.billLineItem.groupBy({
        by: ["skuId"],
        where: {
          bill: { businessId, createdAt: { gte: from, lte: to } },
        },
      }),
      db.billLineItem.groupBy({
        by: ["billId"],
        where: {
          bill: { businessId, createdAt: { gte: from, lte: to } },
        },
      }),
    ]);

    const itemsSold = qtyAgg._sum.qty ?? 0;
    const uniqueSkusSold = uniqueSkus.length;
    const billCount = uniqueBills.length;
    const avgItemsPerBill =
      billCount > 0 ? Math.round((itemsSold / billCount) * 100) / 100 : 0;

    const lineItems = await db.billLineItem.findMany({
      where: {
        bill: { businessId, createdAt: { gte: from, lte: to } },
      },
      select: { qty: true, unitPrice: true, sku: { select: { price: true } } },
    });

    let itemRevenue = 0;
    for (const li of lineItems) {
      const price = li.unitPrice ?? li.sku.price ?? 0;
      itemRevenue += li.qty * price;
    }
    itemRevenue = Math.round(itemRevenue * 100) / 100;

    return NextResponse.json({
      itemsSold,
      itemRevenue,
      uniqueSkusSold,
      avgItemsPerBill,
    } satisfies SkuOverviewResponse);
  } catch (error: unknown) {
    console.error("Failed to fetch SKU overview:", error);
    return NextResponse.json(
      {
        ...emptyResponse,
        error: sanitizeErrorMessage(error) || "Failed to fetch SKU overview.",
      } satisfies SkuOverviewResponse,
      { status: 500 },
    );
  }
});
