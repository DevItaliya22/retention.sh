import { withAdminAuth } from "@/lib/auth/middleware";
import { feedbackStatsQuerySchema } from "@/lib/schemas/feedback";
import {
  sanitizeErrorMessage,
  validateSchema,
} from "@/lib/utils/error-handler";
import { db } from "@reelo/db";
import { NextRequest, NextResponse } from "next/server";

export interface FeedbackStatRow {
  id: string;
  rating: number | null;
  comment: string | null;
  howDidYouHear: string | null;
  selectedCategories: string[];
  createdAt: string;
  customerName: string;
  customerPhone: string | null;
  customerSlugId: string;
}

export const GET = withAdminAuth(async (request: NextRequest, context) => {
  try {
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    const validation = validateSchema(feedbackStatsQuerySchema, queryParams);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: validation.error,
          items: [],
          total: 0,
          page: 1,
          perPage: 10,
        },
        { status: 400 },
      );
    }

    const {
      page = 1,
      perPage = 10,
      sort = "createdAt",
      rating,
      dateFrom,
      dateTo,
    } = validation.data;
    const businessId = context.business.id;
    const skip = (page - 1) * perPage;

    const [sortField, sortDir] = (sort ?? "createdAt").split(":");
    const dir = sortDir === "asc" ? "asc" : "desc";
    const orderBy =
      sortField === "rating"
        ? [{ rating: dir as "asc" | "desc" }, { createdAt: "desc" as const }]
        : [{ createdAt: dir as "asc" | "desc" }];

    const where: {
      businessId: string;
      rating?: number;
      createdAt?: { gte?: Date; lte?: Date };
    } = { businessId };
    if (rating != null) where.rating = rating;
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    const [items, total] = await Promise.all([
      db.feedbackResponse.findMany({
        where,
        orderBy,
        skip,
        take: perPage,
        include: {
          businessCustomer: {
            include: {
              customer: { include: { user: true } },
            },
          },
        },
      }),
      db.feedbackResponse.count({ where }),
    ]);

    const rows: FeedbackStatRow[] = items.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment ?? null,
      howDidYouHear: r.howDidYouHear ?? null,
      selectedCategories: r.selectedCategories ?? [],
      createdAt: r.createdAt.toISOString(),
      customerName: r.businessCustomer?.customer?.user?.name ?? "Unknown",
      customerPhone: r.businessCustomer?.customer?.user?.phoneNumber ?? null,
      customerSlugId: r.businessCustomer?.slugId ?? "",
    }));

    return NextResponse.json({
      items: rows,
      total,
      page,
      perPage,
    });
  } catch (error: unknown) {
    console.error("Failed to fetch feedback stats:", error);
    return NextResponse.json(
      {
        error: sanitizeErrorMessage(error) || "Failed to fetch feedback stats",
        items: [],
        total: 0,
        page: 1,
        perPage: 10,
      },
      { status: 500 },
    );
  }
});
