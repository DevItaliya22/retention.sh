import { withAdminAuth } from "@/lib/auth/middleware";
import {
  analyticsQuerySchema,
  getPeriodDateRange,
  type AnalyticsPeriod,
} from "@/lib/schemas/analytics";
import {
  sanitizeErrorMessage,
  validateSchema,
} from "@/lib/utils/error-handler";
import { db } from "@reelo/db";
import { NextRequest, NextResponse } from "next/server";

type Params = { id: string };

export const GET = withAdminAuth(
  async (request: NextRequest, context, params: Params) => {
    try {
      const id = typeof params.id === "string" ? params.id : params.id?.[0];
      if (!id)
        return NextResponse.json({ error: "Invalid id" }, { status: 400 });
      const { searchParams } = new URL(request.url);
      const validation = validateSchema(
        analyticsQuerySchema,
        Object.fromEntries(searchParams.entries()),
      );
      if (!validation.success) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }
      const period = (validation.data.period ?? "30d") as AnalyticsPeriod;
      const tzOffsetMinutes = validation.data.tzOffsetMinutes ?? 0;
      const { from, to } = getPeriodDateRange(period, tzOffsetMinutes);

      const campaign = await db.gameCampaign.findFirst({
        where: { id, businessId: context.business.id },
      });
      if (!campaign) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      const rateLimited = await db.gameAllocation.count({
        where: {
          outcome: "RATE_LIMITED",
          attempt: { campaignId: id },
          allocatedAt: { gte: from, lte: to },
        },
      });

      const topCustomers = await db.gameAttempt.groupBy({
        by: ["customerId"],
        where: {
          campaignId: id,
          attemptAt: { gte: from, lte: to },
        },
        _count: true,
        orderBy: { _count: { customerId: "desc" } },
        take: 10,
      });

      return NextResponse.json({
        rateLimitedAttempts: rateLimited,
        topCustomersByAttempts: topCustomers,
      });
    } catch (error: unknown) {
      return NextResponse.json(
        { error: sanitizeErrorMessage(error) || "Failed" },
        { status: 500 },
      );
    }
  },
);
