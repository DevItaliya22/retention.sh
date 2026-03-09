import { withAdminAuth } from "@/lib/auth/middleware";
import {
  analyticsQuerySchema,
  formatDateKeyInOffset,
  generateDateKeysInOffset,
  getPeriodDateRange,
  type AnalyticsPeriod,
} from "@/lib/schemas/analytics";
import type { FeedbackAnalyticsResponse } from "@/lib/types/analytics";
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
          error: validation.error,
          total: 0,
          averageRating: 0,
          negativePercentage: 0,
          positiveCount: 0,
          negativeCount: 0,
          neutralCount: 0,
          trend: [],
        },
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
      },
      select: { rating: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    const total = responses.length;
    let ratingSum = 0;
    let ratingCount = 0;
    let positiveCount = 0;
    let negativeCount = 0;
    let neutralCount = 0;

    const dateKeys = generateDateKeysInOffset(from, to, tzOffsetMinutes);
    const grouped = new Map<string, { totalRating: number; count: number }>();
    for (const key of dateKeys) {
      grouped.set(key, { totalRating: 0, count: 0 });
    }

    for (const r of responses) {
      if (r.rating !== null) {
        ratingSum += r.rating;
        ratingCount++;
        if (r.rating >= 4) positiveCount++;
        else if (r.rating <= 2) negativeCount++;
        else neutralCount++;

        const key = formatDateKeyInOffset(r.createdAt, tzOffsetMinutes);
        const entry = grouped.get(key);
        if (entry) {
          entry.totalRating += r.rating;
          entry.count += 1;
        }
      }
    }

    const averageRating =
      ratingCount > 0 ? Math.round((ratingSum / ratingCount) * 100) / 100 : 0;

    const negativePercentage =
      total > 0 ? Math.round((negativeCount / total) * 10000) / 100 : 0;

    const trend = dateKeys
      .map((date) => {
        const entry = grouped.get(date)!;
        return {
          date,
          avgRating:
            entry.count > 0
              ? Math.round((entry.totalRating / entry.count) * 100) / 100
              : 0,
          count: entry.count,
        };
      })
      .filter((t) => t.count > 0);

    const response: FeedbackAnalyticsResponse = {
      total,
      averageRating,
      negativePercentage,
      positiveCount,
      negativeCount,
      neutralCount,
      trend,
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error("Failed to fetch feedback analytics:", error);
    return NextResponse.json(
      {
        error:
          sanitizeErrorMessage(error) || "Failed to fetch feedback analytics.",
        total: 0,
        averageRating: 0,
        negativePercentage: 0,
        positiveCount: 0,
        negativeCount: 0,
        neutralCount: 0,
        trend: [],
      } satisfies FeedbackAnalyticsResponse,
      { status: 500 },
    );
  }
});
