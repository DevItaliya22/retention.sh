import { withAdminAuth } from "@/lib/auth/middleware";
import {
  analyticsQuerySchema,
  formatDateKeyInOffset,
  generateDateKeysInOffset,
  getPeriodDateRange,
  type AnalyticsPeriod,
} from "@/lib/schemas/analytics";
import type {
  FeedbackAnalyticsResponse,
  FeedbackRatingTrendPoint,
} from "@/lib/types/analytics";
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
        {
          trend: [],
          totalFeedback: 0,
          averageRating: 0,
          error: validation.error,
        } satisfies FeedbackAnalyticsResponse,
        { status: 400 },
      );
    }

    const period = (validation.data.period ?? "30d") as AnalyticsPeriod;
    const tzOffsetMinutes = validation.data.tzOffsetMinutes ?? 0;
    const { from, to } = getPeriodDateRange(period, tzOffsetMinutes);

    const responses = await db.feedbackResponse.findMany({
      where: {
        businessId,
        createdAt: { gte: from, lte: to },
        rating: { not: null },
      },
      select: {
        createdAt: true,
        rating: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const dateKeys = generateDateKeysInOffset(from, to, tzOffsetMinutes);
    const grouped = new Map<
      string,
      {
        sum: number;
        count: number;
      }
    >();

    for (const key of dateKeys) {
      grouped.set(key, { sum: 0, count: 0 });
    }

    let totalSum = 0;
    let totalCount = 0;

    for (const r of responses) {
      const key = formatDateKeyInOffset(r.createdAt, tzOffsetMinutes);
      const entry = grouped.get(key);
      const rating = r.rating ?? 0;
      if (entry) {
        entry.sum += rating;
        entry.count += 1;
      }
      totalSum += rating;
      totalCount += 1;
    }

    const trend: FeedbackRatingTrendPoint[] = dateKeys.map((date) => {
      const entry = grouped.get(date)!;
      const avgRating =
        entry.count > 0 ? Math.round((entry.sum / entry.count) * 100) / 100 : 0;
      return {
        date,
        avgRating,
        count: entry.count,
      };
    });

    const averageRating =
      totalCount > 0 ? Math.round((totalSum / totalCount) * 100) / 100 : 0;

    const response: FeedbackAnalyticsResponse = {
      trend,
      totalFeedback: totalCount,
      averageRating,
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error("Failed to fetch feedback rating trend:", error);
    return NextResponse.json(
      {
        trend: [],
        totalFeedback: 0,
        averageRating: 0,
        error:
          sanitizeErrorMessage(error) ??
          "Failed to fetch feedback rating trend.",
      } satisfies FeedbackAnalyticsResponse,
      { status: 500 },
    );
  }
});
