import { withAdminAuth } from "@/lib/auth/middleware";
import {
  analyticsQuerySchema,
  formatDateKeyInOffset,
  generateDateKeysInOffset,
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
    const tzOffsetMinutes = validation.data.tzOffsetMinutes ?? 0;
    const { from, to } = getPeriodDateRange(period, tzOffsetMinutes);

    const dateKeys = generateDateKeysInOffset(from, to, tzOffsetMinutes);
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
      const key = formatDateKeyInOffset(bc.createdAt, tzOffsetMinutes);
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
      const key = formatDateKeyInOffset(bill.createdAt, tzOffsetMinutes);

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
