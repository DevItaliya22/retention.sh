import { withAdminAuth } from "@/lib/auth/middleware";
import { sanitizeErrorMessage } from "@/lib/utils/error-handler";
import { db } from "@reelo/db";
import { NextRequest, NextResponse } from "next/server";

export interface FeedbackOverviewResponse {
  totalFeedback: number;
  averageRating: number;
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  positivePercent: number;
  negativePercent: number;
  neutralPercent: number;
  ratingBreakdown: { 1: number; 2: number; 3: number; 4: number; 5: number };
  error?: string;
}

export const GET = withAdminAuth(async (request: NextRequest, context) => {
  try {
    const businessId = context.business.id;

    const responses = await db.feedbackResponse.findMany({
      where: { businessId },
      select: { rating: true },
    });

    const totalFeedback = responses.length;
    const ratingBreakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let ratingSum = 0;
    let ratingCount = 0;
    let positiveCount = 0;
    let negativeCount = 0;
    let neutralCount = 0;

    for (const r of responses) {
      if (r.rating !== null) {
        const n = r.rating as 1 | 2 | 3 | 4 | 5;
        if (n >= 1 && n <= 5) {
          ratingBreakdown[n] = (ratingBreakdown[n] ?? 0) + 1;
        }
        ratingSum += r.rating;
        ratingCount++;
        if (r.rating >= 4) positiveCount++;
        else if (r.rating <= 2) negativeCount++;
        else neutralCount++;
      }
    }

    const averageRating =
      ratingCount > 0 ? Math.round((ratingSum / ratingCount) * 100) / 100 : 0;
    const positivePercent =
      totalFeedback > 0
        ? Math.round((positiveCount / totalFeedback) * 10000) / 100
        : 0;
    const negativePercent =
      totalFeedback > 0
        ? Math.round((negativeCount / totalFeedback) * 10000) / 100
        : 0;
    const neutralPercent =
      totalFeedback > 0
        ? Math.round((neutralCount / totalFeedback) * 10000) / 100
        : 0;

    const response: FeedbackOverviewResponse = {
      totalFeedback,
      averageRating,
      positiveCount,
      negativeCount,
      neutralCount,
      positivePercent,
      negativePercent,
      neutralPercent,
      ratingBreakdown,
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error("Failed to fetch feedback overview:", error);
    return NextResponse.json(
      {
        error:
          sanitizeErrorMessage(error) ?? "Failed to fetch feedback overview",
        totalFeedback: 0,
        averageRating: 0,
        positiveCount: 0,
        negativeCount: 0,
        neutralCount: 0,
        positivePercent: 0,
        negativePercent: 0,
        neutralPercent: 0,
        ratingBreakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      } satisfies FeedbackOverviewResponse,
      { status: 500 },
    );
  }
});
