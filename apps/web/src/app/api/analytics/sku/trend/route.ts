import { withAdminAuth } from "@/lib/auth/middleware";
import { analyticsQuerySchema } from "@/lib/schemas/analytics";
import type { SkuTrendResponse } from "@/lib/types/analytics";
import {
  sanitizeErrorMessage,
  validateSchema,
} from "@/lib/utils/error-handler";
import { db } from "@reelo/db";
import { NextRequest, NextResponse } from "next/server";

const emptyResponse: SkuTrendResponse = { data: [] };

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

    const tzOffsetMinutes = validation.data.tzOffsetMinutes ?? 0;
    const offsetMs = tzOffsetMinutes * 60_000;

    const now = new Date();
    const localNow = new Date(now.getTime() - offsetMs);
    const startMonth = new Date(
      Date.UTC(localNow.getUTCFullYear(), localNow.getUTCMonth() - 5, 1),
    );
    const from = new Date(startMonth.getTime() + offsetMs);

    const lineItems = await db.billLineItem.findMany({
      where: {
        bill: { businessId, createdAt: { gte: from } },
      },
      select: {
        qty: true,
        unitPrice: true,
        sku: { select: { price: true } },
        bill: { select: { createdAt: true } },
      },
    });

    const monthMap = new Map<string, { revenue: number; itemsSold: number }>();

    for (let i = 0; i < 6; i++) {
      const d = new Date(
        Date.UTC(startMonth.getUTCFullYear(), startMonth.getUTCMonth() + i, 1),
      );
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
      monthMap.set(key, { revenue: 0, itemsSold: 0 });
    }

    for (const li of lineItems) {
      const local = new Date(li.bill.createdAt.getTime() - offsetMs);
      const key = `${local.getUTCFullYear()}-${String(local.getUTCMonth() + 1).padStart(2, "0")}`;
      const bucket = monthMap.get(key);
      if (bucket) {
        const price = li.unitPrice ?? li.sku.price ?? 0;
        bucket.revenue += li.qty * price;
        bucket.itemsSold += li.qty;
      }
    }

    const data = [...monthMap.entries()].map(([month, vals]) => ({
      month,
      revenue: Math.round(vals.revenue * 100) / 100,
      itemsSold: vals.itemsSold,
    }));

    return NextResponse.json({ data } satisfies SkuTrendResponse);
  } catch (error: unknown) {
    console.error("Failed to fetch SKU trend:", error);
    return NextResponse.json(
      {
        ...emptyResponse,
        error: sanitizeErrorMessage(error) || "Failed to fetch SKU trend.",
      } satisfies SkuTrendResponse,
      { status: 500 },
    );
  }
});
