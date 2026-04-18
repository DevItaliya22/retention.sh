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

export const GET = withAdminAuth(async (request: NextRequest, context) => {
  try {
    const businessId = context.business.id;
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

    const campaigns = await db.gameCampaign.findMany({
      where: { businessId },
      select: { id: true, name: true, type: true, status: true },
    });
    const ids = campaigns.map((c) => c.id);

    const [attempts, wins] = await Promise.all([
      db.gameAttempt.count({
        where: {
          campaignId: { in: ids },
          attemptAt: { gte: from, lte: to },
        },
      }),
      db.gameAllocation.count({
        where: {
          outcome: "WON",
          attempt: { campaignId: { in: ids } },
          allocatedAt: { gte: from, lte: to },
        },
      }),
    ]);

    const participationRate =
      attempts > 0 ? Math.round((wins / attempts) * 10_000) / 100 : 0;

    return NextResponse.json({
      campaigns: campaigns.length,
      attemptsInPeriod: attempts,
      winsInPeriod: wins,
      participationRate,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        error: sanitizeErrorMessage(error) || "Failed",
        campaigns: 0,
        attemptsInPeriod: 0,
        winsInPeriod: 0,
        participationRate: 0,
      },
      { status: 500 },
    );
  }
});
