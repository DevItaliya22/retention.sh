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
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
      select: {
        id: true,
        name: true,
        type: true,
        status: true,
        fulfillmentMode: true,
        updatedAt: true,
        _count: {
          select: {
            rewards: true,
          },
        },
      },
    });
    const ids = campaigns.map((c) => c.id);

    const [attemptRows, allocationRows] = ids.length
      ? await Promise.all([
          db.gameAttempt.groupBy({
            by: ["campaignId"],
            where: {
              campaignId: { in: ids },
              attemptAt: { gte: from, lte: to },
            },
            _count: true,
            _max: { attemptAt: true },
          }),
          db.gameAllocation.groupBy({
            by: ["outcome", "attemptId"],
            where: {
              attempt: { campaignId: { in: ids } },
              allocatedAt: { gte: from, lte: to },
            },
            _count: true,
          }),
        ])
      : [[], []];

    const attemptMap = new Map<
      string,
      { attempts: number; lastAttemptAt: Date | null }
    >();
    for (const row of attemptRows) {
      attemptMap.set(row.campaignId, {
        attempts: row._count,
        lastAttemptAt: row._max.attemptAt,
      });
    }

    const attemptCampaignById = new Map<string, string>();
    if (ids.length) {
      const attemptCampaignRows = await db.gameAttempt.findMany({
        where: {
          campaignId: { in: ids },
          attemptAt: { gte: from, lte: to },
        },
        select: { id: true, campaignId: true },
      });
      for (const row of attemptCampaignRows) {
        attemptCampaignById.set(row.id, row.campaignId);
      }
    }

    const outcomesByCampaign = new Map<
      string,
      {
        wins: number;
        drawPending: number;
        rateLimited: number;
      }
    >();
    for (const row of allocationRows) {
      const campaignId = attemptCampaignById.get(row.attemptId);
      if (!campaignId) continue;
      const current = outcomesByCampaign.get(campaignId) ?? {
        wins: 0,
        drawPending: 0,
        rateLimited: 0,
      };
      if (row.outcome === "WON") current.wins += row._count;
      if (row.outcome === "DRAW_PENDING") current.drawPending += row._count;
      if (row.outcome === "RATE_LIMITED") current.rateLimited += row._count;
      outcomesByCampaign.set(campaignId, current);
    }

    const campaignAnalytics = campaigns.map((campaign) => {
      const attempts = attemptMap.get(campaign.id)?.attempts ?? 0;
      const lastAttemptAt = attemptMap.get(campaign.id)?.lastAttemptAt ?? null;
      const outcomes = outcomesByCampaign.get(campaign.id) ?? {
        wins: 0,
        drawPending: 0,
        rateLimited: 0,
      };
      const winRate =
        attempts > 0
          ? Math.round((outcomes.wins / attempts) * 10_000) / 100
          : 0;

      return {
        id: campaign.id,
        name: campaign.name,
        type: campaign.type,
        status: campaign.status,
        fulfillmentMode: campaign.fulfillmentMode,
        updatedAt: campaign.updatedAt,
        lastAttemptAt,
        rewardsConfigured: campaign._count.rewards,
        attemptsInPeriod: attempts,
        winsInPeriod: outcomes.wins,
        drawPendingInPeriod: outcomes.drawPending,
        rateLimitedInPeriod: outcomes.rateLimited,
        winRate,
      };
    });

    const attempts = campaignAnalytics.reduce(
      (sum, campaign) => sum + campaign.attemptsInPeriod,
      0,
    );
    const wins = campaignAnalytics.reduce(
      (sum, campaign) => sum + campaign.winsInPeriod,
      0,
    );
    const drawPending = campaignAnalytics.reduce(
      (sum, campaign) => sum + campaign.drawPendingInPeriod,
      0,
    );
    const rateLimited = campaignAnalytics.reduce(
      (sum, campaign) => sum + campaign.rateLimitedInPeriod,
      0,
    );
    const liveCampaigns = campaignAnalytics.filter(
      (campaign) => campaign.status === "ACTIVE",
    ).length;

    const participationRate =
      attempts > 0 ? Math.round((wins / attempts) * 10_000) / 100 : 0;

    return NextResponse.json({
      period,
      campaigns: campaigns.length,
      liveCampaigns,
      attemptsInPeriod: attempts,
      winsInPeriod: wins,
      drawPendingInPeriod: drawPending,
      rateLimitedInPeriod: rateLimited,
      participationRate,
      campaignAnalytics,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        error: sanitizeErrorMessage(error) || "Failed",
        campaigns: 0,
        liveCampaigns: 0,
        attemptsInPeriod: 0,
        winsInPeriod: 0,
        drawPendingInPeriod: 0,
        rateLimitedInPeriod: 0,
        participationRate: 0,
        campaignAnalytics: [],
      },
      { status: 500 },
    );
  }
});
