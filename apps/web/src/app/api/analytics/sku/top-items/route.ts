import { withAdminAuth } from "@/lib/auth/middleware";
import {
  analyticsQuerySchema,
  getPeriodDateRange,
  type AnalyticsPeriod,
} from "@/lib/schemas/analytics";
import type { SkuTopItemsResponse } from "@/lib/types/analytics";
import {
  sanitizeErrorMessage,
  validateSchema,
} from "@/lib/utils/error-handler";
import { db } from "@reelo/db";
import { NextRequest, NextResponse } from "next/server";

const emptyResponse: SkuTopItemsResponse = {
  topSelling: [],
  slowMoving: [],
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

    const lineItems = await db.billLineItem.findMany({
      where: {
        bill: { businessId, createdAt: { gte: from, lte: to } },
      },
      select: {
        skuId: true,
        qty: true,
        unitPrice: true,
        sku: {
          select: {
            name: true,
            sku: true,
            price: true,
            category: { select: { name: true } },
          },
        },
      },
    });

    const skuMap = new Map<
      string,
      {
        skuName: string;
        skuCode: string;
        categoryName: string | null;
        qtySold: number;
        revenue: number;
      }
    >();

    let totalRevenue = 0;

    for (const li of lineItems) {
      const price = li.unitPrice ?? li.sku.price ?? 0;
      const lineRevenue = li.qty * price;
      totalRevenue += lineRevenue;

      const existing = skuMap.get(li.skuId);
      if (existing) {
        existing.qtySold += li.qty;
        existing.revenue += lineRevenue;
      } else {
        skuMap.set(li.skuId, {
          skuName: li.sku.name,
          skuCode: li.sku.sku,
          categoryName: li.sku.category?.name ?? null,
          qtySold: li.qty,
          revenue: lineRevenue,
        });
      }
    }

    const sorted = [...skuMap.entries()].sort(
      (a, b) => b[1].revenue - a[1].revenue,
    );

    const topSelling = sorted.slice(0, 10).map(([skuId, data]) => ({
      skuId,
      skuName: data.skuName,
      skuCode: data.skuCode,
      categoryName: data.categoryName,
      qtySold: data.qtySold,
      revenue: Math.round(data.revenue * 100) / 100,
      revenueShare:
        totalRevenue > 0
          ? Math.round((data.revenue / totalRevenue) * 10000) / 100
          : 0,
    }));

    const soldSkuIds = new Set(skuMap.keys());

    const allSkus = await db.sku.findMany({
      where: { businessId, isActive: true },
      select: {
        id: true,
        name: true,
        sku: true,
        category: { select: { name: true } },
      },
    });

    const slowMovingRaw: Array<{
      skuId: string;
      skuName: string;
      skuCode: string;
      categoryName: string | null;
      qtySold: number;
    }> = [];

    for (const s of allSkus) {
      const sold = skuMap.get(s.id);
      slowMovingRaw.push({
        skuId: s.id,
        skuName: s.name,
        skuCode: s.sku,
        categoryName: s.category?.name ?? null,
        qtySold: sold?.qtySold ?? 0,
      });
    }

    slowMovingRaw.sort((a, b) => a.qtySold - b.qtySold);
    const slowMovingIds = slowMovingRaw.slice(0, 10).map((s) => s.skuId);

    const lastSoldMap = new Map<string, Date>();
    if (slowMovingIds.length > 0) {
      const lastSolds = await db.billLineItem.findMany({
        where: { skuId: { in: slowMovingIds } },
        select: { skuId: true, bill: { select: { createdAt: true } } },
        orderBy: { bill: { createdAt: "desc" } },
      });
      for (const ls of lastSolds) {
        if (!lastSoldMap.has(ls.skuId)) {
          lastSoldMap.set(ls.skuId, ls.bill.createdAt);
        }
      }
    }

    const slowMoving = slowMovingRaw.slice(0, 10).map((s) => ({
      ...s,
      lastSoldAt: lastSoldMap.get(s.skuId)?.toISOString() ?? null,
    }));

    return NextResponse.json({
      topSelling,
      slowMoving,
    } satisfies SkuTopItemsResponse);
  } catch (error: unknown) {
    console.error("Failed to fetch SKU top items:", error);
    return NextResponse.json(
      {
        ...emptyResponse,
        error: sanitizeErrorMessage(error) || "Failed to fetch SKU top items.",
      } satisfies SkuTopItemsResponse,
      { status: 500 },
    );
  }
});
