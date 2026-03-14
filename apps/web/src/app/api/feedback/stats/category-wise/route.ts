import { withAdminAuth } from "@/lib/auth/middleware";
import { sanitizeErrorMessage } from "@/lib/utils/error-handler";
import { db } from "@reelo/db";
import { NextRequest, NextResponse } from "next/server";

export interface CategoryWiseStat {
  name: string;
  avgRating: number;
  positive: number;
  neutral: number;
  negative: number;
}

export interface FeedbackCategoryWiseResponse {
  categories: CategoryWiseStat[];
  error?: string;
}

export const GET = withAdminAuth(async (_request: NextRequest, context) => {
  try {
    const businessId = context.business.id;

    const [config, responses] = await Promise.all([
      db.feedbackConfig.findUnique({
        where: { businessId },
        select: {
          categories: { select: { name: true }, orderBy: { createdAt: "asc" } },
        },
      }),
      db.feedbackResponse.findMany({
        where: { businessId },
        select: { rating: true, selectedCategories: true },
      }),
    ]);

    const categoryNames = config?.categories?.map((c) => c.name) ?? [];
    const categories: CategoryWiseStat[] = categoryNames.map((name) => {
      const withCategory = responses.filter((r) =>
        (r.selectedCategories ?? []).includes(name),
      );
      let ratingSum = 0;
      let ratingCount = 0;
      let positive = 0;
      let neutral = 0;
      let negative = 0;
      for (const r of withCategory) {
        if (r.rating !== null) {
          ratingSum += r.rating;
          ratingCount++;
          if (r.rating >= 4) positive++;
          else if (r.rating <= 2) negative++;
          else neutral++;
        }
      }
      const avgRating =
        ratingCount > 0 ? Math.round((ratingSum / ratingCount) * 100) / 100 : 0;
      return { name, avgRating, positive, neutral, negative };
    });

    return NextResponse.json({
      categories,
    } satisfies FeedbackCategoryWiseResponse);
  } catch (error: unknown) {
    console.error("Failed to fetch category-wise stats:", error);
    return NextResponse.json(
      {
        error:
          sanitizeErrorMessage(error) ?? "Failed to fetch category-wise stats",
        categories: [],
      } satisfies FeedbackCategoryWiseResponse,
      { status: 500 },
    );
  }
});
