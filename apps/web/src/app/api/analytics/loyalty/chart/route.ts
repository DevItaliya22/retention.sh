import { withAdminAuth } from "@/lib/auth/middleware";
import {
  analyticsQuerySchema,
  getPeriodDateRange,
  type AnalyticsPeriod,
} from "@/lib/schemas/analytics";
import type { LoyaltyChartResponse } from "@/lib/types/analytics";
import {
  sanitizeErrorMessage,
  validateSchema,
} from "@/lib/utils/error-handler";
import { db } from "@reelo/db";
import { NextRequest, NextResponse } from "next/server";

function formatDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function generateDateKeys(from: Date, to: Date): string[] {
  const keys: string[] = [];
  const d = new Date(from);
  while (d <= to) {
    keys.push(formatDateKey(d));
    d.setDate(d.getDate() + 1);
  }
  return keys;
}

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
        type: { in: ["EARNED", "REDEEMED"] },
        createdAt: { gte: from, lte: to },
      },
      select: { type: true, amount: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    const dateKeys = generateDateKeys(from, to);
    const grouped = new Map<string, { issued: number; redeemed: number }>();
    for (const key of dateKeys) {
      grouped.set(key, { issued: 0, redeemed: 0 });
    }

    for (const tx of transactions) {
      const key = formatDateKey(tx.createdAt);
      const entry = grouped.get(key);
      if (!entry) continue;
      if (tx.type === "EARNED") {
        entry.issued += tx.amount;
      } else {
        entry.redeemed += Math.abs(tx.amount);
      }
    }

    const data = dateKeys.map((date) => {
      const entry = grouped.get(date)!;
      return {
        date,
        issued: Math.round(entry.issued),
        redeemed: Math.round(entry.redeemed),
      };
    });

    const response: LoyaltyChartResponse = { data };
    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error("Failed to fetch loyalty chart:", error);
    return NextResponse.json(
      {
        error: sanitizeErrorMessage(error) || "Failed to fetch loyalty chart.",
        data: [],
      } satisfies LoyaltyChartResponse,
      { status: 500 },
    );
  }
});
