import { withAdminAuth } from "@/lib/auth/middleware";
import {
  getLastWeekRange,
  getThisWeekRange,
  getWeekdayIndexInOffset,
  WEEKDAY_LABELS,
} from "@/lib/schemas/analytics";
import type {
  WeeklyTrendsDataPoint,
  WeeklyTrendsResponse,
} from "@/lib/types/analytics";
import {
  sanitizeErrorMessage,
  validateSchema,
} from "@/lib/utils/error-handler";
import { db } from "@reelo/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const weeklyTrendsQuerySchema = z.object({
  tzOffsetMinutes: z.coerce.number().int().min(-840).max(840).optional(),
});

export const GET = withAdminAuth(async (request: NextRequest, context) => {
  try {
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    const validation = validateSchema(weeklyTrendsQuerySchema, queryParams);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: validation.error,
          visits: { data: [], thisWeekTotal: 0, lastWeekTotal: 0 },
          messages: { data: [], thisWeekTotal: 0, lastWeekTotal: 0 },
          revenue: { data: [], thisWeekTotal: 0, lastWeekTotal: 0 },
        } satisfies WeeklyTrendsResponse,
        { status: 400 },
      );
    }

    const tzOffsetMinutes = validation.data.tzOffsetMinutes ?? 0;
    const businessId = context.business.id;

    const {
      from: thisFrom,
      to: thisTo,
      todayWeekdayIndex,
    } = getThisWeekRange(tzOffsetMinutes);
    const { from: lastFrom, to: lastTo } = getLastWeekRange(tzOffsetMinutes);

    const [billsThis, billsLast, messagesThis, messagesLast] =
      await Promise.all([
        db.bill.findMany({
          where: { businessId, createdAt: { gte: thisFrom, lte: thisTo } },
          select: { createdAt: true, finalAmount: true },
        }),
        db.bill.findMany({
          where: { businessId, createdAt: { gte: lastFrom, lte: lastTo } },
          select: { createdAt: true, finalAmount: true },
        }),
        db.messageLog.findMany({
          where: { businessId, createdAt: { gte: thisFrom, lte: thisTo } },
          select: { createdAt: true },
        }),
        db.messageLog.findMany({
          where: { businessId, createdAt: { gte: lastFrom, lte: lastTo } },
          select: { createdAt: true },
        }),
      ]);

    const fillWeekly = (
      thisItems: { createdAt: Date }[],
      lastItems: { createdAt: Date }[],
      thisWeekdayIndexLimit: number,
      valueExtractor?: (
        item: { createdAt: Date } & { finalAmount?: number | null },
      ) => number,
    ): {
      data: WeeklyTrendsDataPoint[];
      thisWeekTotal: number;
      lastWeekTotal: number;
    } => {
      const thisBuckets = [0, 0, 0, 0, 0, 0, 0];
      const lastBuckets = [0, 0, 0, 0, 0, 0, 0];
      const extract = valueExtractor ?? (() => 1);

      for (const item of thisItems) {
        const i = getWeekdayIndexInOffset(item.createdAt, tzOffsetMinutes);
        if (i >= 0 && i <= thisWeekdayIndexLimit && i < thisBuckets.length) {
          thisBuckets[i] =
            (thisBuckets[i] ?? 0) +
            extract(item as { createdAt: Date; finalAmount?: number | null });
        }
      }
      for (const item of lastItems) {
        const i = getWeekdayIndexInOffset(item.createdAt, tzOffsetMinutes);
        if (i >= 0 && i < lastBuckets.length) {
          lastBuckets[i] =
            (lastBuckets[i] ?? 0) +
            extract(item as { createdAt: Date; finalAmount?: number | null });
        }
      }

      const data: WeeklyTrendsDataPoint[] = WEEKDAY_LABELS.map((day, i) => ({
        day,
        thisWeek: i <= todayWeekdayIndex ? thisBuckets[i]! : 0,
        lastWeek: lastBuckets[i]!,
      }));

      const thisWeekTotal = thisBuckets.reduce((a, b) => a + b, 0);
      const lastWeekTotal = lastBuckets.reduce((a, b) => a + b, 0);

      return { data, thisWeekTotal, lastWeekTotal };
    };

    const visits = fillWeekly(billsThis, billsLast, todayWeekdayIndex);
    const messages = fillWeekly(messagesThis, messagesLast, todayWeekdayIndex);
    const revenue = fillWeekly(
      billsThis,
      billsLast,
      todayWeekdayIndex,
      (b) => (b as { finalAmount?: number | null }).finalAmount ?? 0,
    );

    const response: WeeklyTrendsResponse = {
      visits,
      messages,
      revenue,
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error("Failed to fetch weekly trends:", error);
    return NextResponse.json(
      {
        error: sanitizeErrorMessage(error) ?? "Failed to fetch weekly trends",
        visits: { data: [], thisWeekTotal: 0, lastWeekTotal: 0 },
        messages: { data: [], thisWeekTotal: 0, lastWeekTotal: 0 },
        revenue: { data: [], thisWeekTotal: 0, lastWeekTotal: 0 },
      } satisfies WeeklyTrendsResponse,
      { status: 500 },
    );
  }
});
