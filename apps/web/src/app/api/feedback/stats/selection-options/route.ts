import { withAdminAuth } from "@/lib/auth/middleware";
import { sanitizeErrorMessage } from "@/lib/utils/error-handler";
import { db } from "@reelo/db";
import { NextRequest, NextResponse } from "next/server";

export interface SelectionOptionStat {
  id: string;
  label: string;
  count: number;
  percent: number;
  avgRating: number;
  positive: number;
  neutral: number;
  negative: number;
}

export interface FeedbackSelectionOptionsStatsResponse {
  totalResponses: number;
  options: SelectionOptionStat[];
  error?: string;
}

export const GET = withAdminAuth(async (_request: NextRequest, context) => {
  try {
    const businessId = context.business.id;

    const [selectionOptions, responses] = await Promise.all([
      db.feedbackSelectionOption.findMany({
        where: { config: { businessId } },
        orderBy: { seq: "asc" },
        select: { id: true, label: true, seq: true },
      }),
      db.feedbackResponse.findMany({
        where: { businessId },
        select: {
          rating: true,
          selectedSelectionOptions: { select: { id: true } },
        },
      }),
    ]);

    const totalResponses = responses.length;

    const options: SelectionOptionStat[] = selectionOptions.map((opt) => {
      const withOption = responses.filter((r) =>
        r.selectedSelectionOptions.some((o) => o.id === opt.id),
      );
      let ratingSum = 0;
      let ratingCount = 0;
      let positive = 0;
      let neutral = 0;
      let negative = 0;
      for (const r of withOption) {
        if (r.rating !== null) {
          ratingSum += r.rating;
          ratingCount++;
          if (r.rating === 1) positive++;
          else if (r.rating === 2 || r.rating === 3) neutral++;
          else if (r.rating === 4 || r.rating === 5) negative++;
        }
      }
      const count = withOption.length;
      const percent =
        totalResponses > 0
          ? Math.round((count / totalResponses) * 10000) / 100
          : 0;
      const avgRating =
        ratingCount > 0 ? Math.round((ratingSum / ratingCount) * 100) / 100 : 0;
      return {
        id: opt.id,
        label: opt.label,
        count,
        percent,
        avgRating,
        positive,
        neutral,
        negative,
      };
    });

    return NextResponse.json({
      totalResponses,
      options,
    } satisfies FeedbackSelectionOptionsStatsResponse);
  } catch (error: unknown) {
    console.error("Failed to fetch selection options stats:", error);
    return NextResponse.json(
      {
        error:
          sanitizeErrorMessage(error) ??
          "Failed to fetch selection options stats",
        totalResponses: 0,
        options: [],
      } satisfies FeedbackSelectionOptionsStatsResponse,
      { status: 500 },
    );
  }
});
