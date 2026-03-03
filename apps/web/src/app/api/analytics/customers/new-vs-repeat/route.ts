import { withAdminAuth } from "@/lib/auth/middleware";
import {
  analyticsQuerySchema,
  getPeriodDateRange,
  type AnalyticsPeriod,
} from "@/lib/schemas/analytics";
import type { NewVsRepeatResponse } from "@/lib/types/analytics";
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

    const dateKeys = generateDateKeys(from, to);
    const grouped = new Map<string, { new: number; repeat: number }>();
    for (const key of dateKeys) {
      grouped.set(key, { new: 0, repeat: 0 });
    }

    const [newBusinessCustomers, bills] = await Promise.all([
      db.businessCustomer.findMany({
        where: { businessId, createdAt: { gte: from, lte: to } },
        select: { customerId: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      }),
      db.bill.findMany({
        where: { businessId, createdAt: { gte: from, lte: to } },
        select: {
          customerId: true,
          createdAt: true,
        },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    const newCustomerIdsByDateKey = new Map<string, Set<string>>();
    for (const bc of newBusinessCustomers) {
      const key = formatDateKey(bc.createdAt);
      const entry = grouped.get(key);
      if (!entry) continue;
      entry.new += 1;

      if (!newCustomerIdsByDateKey.has(key))
        newCustomerIdsByDateKey.set(key, new Set());
      newCustomerIdsByDateKey.get(key)!.add(bc.customerId);
    }

    const billedSeenPerDay = new Map<string, Set<string>>();
    for (const bill of bills) {
      if (!bill.customerId) continue;
      const key = formatDateKey(bill.createdAt);

      if (!billedSeenPerDay.has(key)) billedSeenPerDay.set(key, new Set());
      const seen = billedSeenPerDay.get(key)!;
      if (seen.has(bill.customerId)) continue;
      seen.add(bill.customerId);

      if (newCustomerIdsByDateKey.get(key)?.has(bill.customerId)) continue;

      const entry = grouped.get(key);
      if (!entry) continue;
      entry.repeat += 1;
    }

    const data = dateKeys.map((date) => ({
      date,
      ...grouped.get(date)!,
    }));

    const response: NewVsRepeatResponse = { data };
    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error("Failed to fetch new vs repeat:", error);
    return NextResponse.json(
      {
        error: sanitizeErrorMessage(error) || "Failed to fetch customer data.",
        data: [],
      } satisfies NewVsRepeatResponse,
      { status: 500 },
    );
  }
});
