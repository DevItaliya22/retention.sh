import { withAdminAuth } from "@/lib/auth/middleware";
import {
  analyticsQuerySchema,
  getPeriodDateRange,
  type AnalyticsPeriod,
} from "@/lib/schemas/analytics";
import type { CustomerSnapshotResponse } from "@/lib/types/analytics";
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
          totalCustomers: 0,
          newInPeriod: 0,
          repeatInPeriod: 0,
        },
        { status: 400 },
      );
    }

    const period = (validation.data.period ?? "30d") as AnalyticsPeriod;
    const { from, to } = getPeriodDateRange(period);

    const [totalCustomers, newInPeriod, customerBillCounts] = await Promise.all(
      [
        db.businessCustomer.count({ where: { businessId } }),
        db.businessCustomer.count({
          where: { businessId, createdAt: { gte: from, lte: to } },
        }),
        db.bill.groupBy({
          by: ["customerId"],
          where: { businessId, createdAt: { gte: from, lte: to } },
          _count: { id: true },
        }),
      ],
    );

    const repeatInPeriod = customerBillCounts.filter(
      (c) => c._count.id > 1,
    ).length;

    const response: CustomerSnapshotResponse = {
      totalCustomers,
      newInPeriod,
      repeatInPeriod,
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error("Failed to fetch customer snapshot:", error);
    return NextResponse.json(
      {
        error: sanitizeErrorMessage(error) || "Failed to fetch customer data.",
        totalCustomers: 0,
        newInPeriod: 0,
        repeatInPeriod: 0,
      } satisfies CustomerSnapshotResponse,
      { status: 500 },
    );
  }
});
