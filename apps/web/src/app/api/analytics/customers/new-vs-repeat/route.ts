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

    const bills = await db.bill.findMany({
      where: {
        businessId,
        createdAt: { gte: from, lte: to },
      },
      select: { customerId: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    // Per customer: date key of their *first* bill in this period
    const firstBillDateKeyByCustomer = new Map<string, string>();
    for (const bill of bills) {
      if (!bill.customerId) continue;
      if (!firstBillDateKeyByCustomer.has(bill.customerId)) {
        firstBillDateKeyByCustomer.set(
          bill.customerId,
          formatDateKeyInOffset(bill.createdAt, tzOffsetMinutes),
        );
      }
    }

    // Per day: unique customers whose first bill in period is that day = new; others = repeat
    const newCustomersPerDay = new Map<string, Set<string>>();
    const repeatCustomersPerDay = new Map<string, Set<string>>();
    for (const key of dateKeys) {
      newCustomersPerDay.set(key, new Set());
      repeatCustomersPerDay.set(key, new Set());
    }

    for (const bill of bills) {
      if (!bill.customerId) continue;
      const key = formatDateKeyInOffset(bill.createdAt, tzOffsetMinutes);
      const firstKey = firstBillDateKeyByCustomer.get(bill.customerId);
      if (!firstKey) continue;

      if (key === firstKey) {
        newCustomersPerDay.get(key)!.add(bill.customerId);
      } else {
        repeatCustomersPerDay.get(key)!.add(bill.customerId);
      }
    }

    for (const date of dateKeys) {
      const entry = grouped.get(date)!;
      entry.new = newCustomersPerDay.get(date)!.size;
      entry.repeat = repeatCustomersPerDay.get(date)!.size;
    }

    const data = dateKeys.map((date) => ({
      date,
      ...grouped.get(date)!,
    }));

    const response: NewVsRepeatResponse = {
      data,
      totalVisitors: firstBillDateKeyByCustomer.size,
    };
    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error("Failed to fetch new vs repeat:", error);
    return NextResponse.json(
      {
        error: sanitizeErrorMessage(error) || "Failed to fetch customer data.",
        data: [],
        totalVisitors: 0,
      } satisfies NewVsRepeatResponse,
      { status: 500 },
    );
  }
});
