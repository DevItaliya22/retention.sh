import { withAdminAuth } from "@/lib/auth/middleware";
import { getWeekdayIndexInOffset } from "@/lib/schemas/analytics";
import type { CustomersByDayResponse } from "@/lib/types/analytics";
import {
  sanitizeErrorMessage,
  validateSchema,
} from "@/lib/utils/error-handler";
import { db } from "@reelo/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const querySchema = z.object({
  tzOffsetMinutes: z.coerce.number().int().min(-840).max(840).optional(),
});

export const GET = withAdminAuth(async (request: NextRequest, context) => {
  try {
    const { searchParams } = new URL(request.url);
    const validation = validateSchema(
      querySchema,
      Object.fromEntries(searchParams.entries()),
    );
    if (!validation.success) {
      return NextResponse.json(
        {
          error: validation.error,
          weekdays: 0,
          weekends: 0,
          both: 0,
          total: 0,
          weekdaysPercent: 0,
          weekendsPercent: 0,
          bothPercent: 0,
          topLabel: "",
        } satisfies CustomersByDayResponse,
        { status: 400 },
      );
    }

    const tzOffsetMinutes = validation.data.tzOffsetMinutes ?? 0;
    const businessId = context.business.id;

    const bills = await db.bill.findMany({
      where: { businessId },
      select: { customerId: true, createdAt: true },
    });

    const byCustomer = new Map<
      string,
      { hasWeekday: boolean; hasWeekend: boolean }
    >();

    for (const bill of bills) {
      const idx = getWeekdayIndexInOffset(bill.createdAt, tzOffsetMinutes);
      const isWeekend = idx >= 5;
      const isWeekday = idx <= 4;

      const cur = byCustomer.get(bill.customerId) ?? {
        hasWeekday: false,
        hasWeekend: false,
      };
      byCustomer.set(bill.customerId, {
        hasWeekday: cur.hasWeekday || isWeekday,
        hasWeekend: cur.hasWeekend || isWeekend,
      });
    }

    let weekdays = 0;
    let weekends = 0;
    let both = 0;

    for (const { hasWeekday, hasWeekend } of byCustomer.values()) {
      if (hasWeekday && hasWeekend) both++;
      else if (hasWeekday) weekdays++;
      else if (hasWeekend) weekends++;
    }

    const total = weekdays + weekends + both;
    const weekdaysPercent =
      total > 0 ? Math.round((weekdays / total) * 100) : 0;
    const weekendsPercent =
      total > 0 ? Math.round((weekends / total) * 100) : 0;
    const bothPercent = total > 0 ? Math.round((both / total) * 100) : 0;

    const topLabel =
      total === 0
        ? "No purchase data yet"
        : weekdays >= weekends && weekdays >= both
          ? `${weekdaysPercent}% make purchase only on weekdays`
          : weekends >= both
            ? `${weekendsPercent}% make purchase only on weekends`
            : `${bothPercent}% make purchase on both`;

    const response: CustomersByDayResponse = {
      weekdays,
      weekends,
      both,
      total,
      weekdaysPercent,
      weekendsPercent,
      bothPercent,
      topLabel,
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error("Failed to fetch customers by day:", error);
    return NextResponse.json(
      {
        error:
          sanitizeErrorMessage(error) ?? "Failed to fetch customers by day",
        weekdays: 0,
        weekends: 0,
        both: 0,
        total: 0,
        weekdaysPercent: 0,
        weekendsPercent: 0,
        bothPercent: 0,
        topLabel: "",
      } satisfies CustomersByDayResponse,
      { status: 500 },
    );
  }
});
