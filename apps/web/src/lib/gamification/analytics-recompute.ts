import { db } from "@reelo/db";

/** Upsert daily aggregates for a campaign from allocations (UTC day bucket). */
export async function recomputeGameCampaignAnalyticsDay(
  campaignId: string,
  day: Date,
) {
  const start = new Date(day);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);

  const attempts = await db.gameAttempt.count({
    where: {
      campaignId,
      attemptAt: { gte: start, lt: end },
    },
  });

  const byOutcome = await db.gameAllocation.groupBy({
    by: ["outcome"],
    where: {
      attempt: { campaignId },
      allocatedAt: { gte: start, lt: end },
    },
    _count: true,
  });

  let winnersCount = 0;
  let notWonCount = 0;
  let rateLimitedCount = 0;
  for (const row of byOutcome) {
    if (row.outcome === "WON") winnersCount += row._count;
    if (row.outcome === "NOT_WON") notWonCount += row._count;
    if (row.outcome === "RATE_LIMITED") rateLimitedCount += row._count;
  }

  await db.gameAnalyticsDaily.upsert({
    where: {
      campaignId_day: { campaignId, day: start },
    },
    create: {
      campaignId,
      day: start,
      attemptsCount: attempts,
      eligibleCount: attempts,
      winnersCount,
      notWonCount,
      rateLimitedCount,
    },
    update: {
      attemptsCount: attempts,
      eligibleCount: attempts,
      winnersCount,
      notWonCount,
      rateLimitedCount,
    },
  });
}
