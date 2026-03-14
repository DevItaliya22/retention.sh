import { withAdminAuth } from "@/lib/auth/middleware";
import {
  analyticsQuerySchema,
  getPeriodDateRange,
  type AnalyticsPeriod,
} from "@/lib/schemas/analytics";
import type { SkuCategoryBreakdownResponse } from "@/lib/types/analytics";
import {
  sanitizeErrorMessage,
  validateSchema,
} from "@/lib/utils/error-handler";
import { db } from "@reelo/db";
import { NextRequest, NextResponse } from "next/server";

const emptyResponse: SkuCategoryBreakdownResponse = { categories: [] };

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
        qty: true,
        unitPrice: true,
        sku: {
          select: {
            price: true,
            categoryId: true,
            category: { select: { name: true } },
          },
        },
      },
    });

    const catMap = new Map<
      string | null,
      { categoryName: string; revenue: number; itemsSold: number }
    >();

    let totalRevenue = 0;

    for (const li of lineItems) {
      const price = li.unitPrice ?? li.sku.price ?? 0;
      const lineRevenue = li.qty * price;
      totalRevenue += lineRevenue;

      const catId = li.sku.categoryId;
      const catName = li.sku.category?.name ?? "Uncategorized";

      const existing = catMap.get(catId);
      if (existing) {
        existing.revenue += lineRevenue;
        existing.itemsSold += li.qty;
      } else {
        catMap.set(catId, {
          categoryName: catName,
          revenue: lineRevenue,
          itemsSold: li.qty,
        });
      }
    }

    const categories = [...catMap.entries()]
      .map(([categoryId, data]) => ({
        categoryId,
        categoryName: data.categoryName,
        revenue: Math.round(data.revenue * 100) / 100,
        revenueShare:
          totalRevenue > 0
            ? Math.round((data.revenue / totalRevenue) * 10000) / 100
            : 0,
        itemsSold: data.itemsSold,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    return NextResponse.json({
      categories,
    } satisfies SkuCategoryBreakdownResponse);
  } catch (error: unknown) {
    console.error("Failed to fetch category breakdown:", error);
    return NextResponse.json(
      {
        ...emptyResponse,
        error:
          sanitizeErrorMessage(error) || "Failed to fetch category breakdown.",
      } satisfies SkuCategoryBreakdownResponse,
      { status: 500 },
    );
  }
});
