import { db } from "@reelo/db";
import { allocateGameOutcome, type RewardRow } from "./allocation-engine";
import { logGameAudit } from "./audit";

/**
 * Runs a scheduled lottery draw: picks winners from `game_draw_entry` for the batch's campaign.
 * Idempotent: if batch already COMPLETED, no-op.
 */
export async function runLotteryDrawBatch(input: {
  drawBatchId: string;
  businessId: string;
  actorUserId?: string | null;
}) {
  const batch = await db.gameDrawBatch.findFirst({
    where: {
      id: input.drawBatchId,
      campaign: { businessId: input.businessId },
    },
    include: {
      campaign: {
        include: {
          distributionPolicy: true,
          rewards: { orderBy: { priority: "asc" } },
        },
      },
    },
  });

  if (!batch) {
    return { ok: false as const, error: "Draw batch not found" };
  }
  if (batch.status === "COMPLETED") {
    return { ok: true as const, skipped: true as const };
  }

  await db.gameDrawBatch.update({
    where: { id: batch.id },
    data: { status: "RUNNING" },
  });

  const entries = await db.gameDrawEntry.findMany({
    where: { drawBatchId: batch.id },
    orderBy: { createdAt: "asc" },
  });

  const policy = batch.campaign.distributionPolicy;
  const rewards: RewardRow[] = batch.campaign.rewards.map((r) => ({
    id: r.id,
    kind: r.kind,
    displayName: r.displayName,
    weight: r.weight,
    probabilityPercent: r.probabilityPercent,
    maxWinners: r.maxWinners,
    stock: r.stock,
    isFallbackNoReward: r.isFallbackNoReward,
  }));

  const winnerCount = await db.gameAllocation.count({
    where: {
      attempt: { campaignId: batch.campaignId },
      outcome: "WON",
    },
  });

  const winners: Array<{ customerId: string; rewardId: string | null }> = [];
  let ordinal = winnerCount;
  for (const entry of entries) {
    ordinal += 1;
    const res = allocateGameOutcome(
      {
        distributionMode: policy?.mode ?? "PROBABILITY_WEIGHTED",
        seedVersion: policy?.randomSeedVersion ?? 1,
        attemptOrdinal: ordinal,
        populationWindowSize: policy?.populationWindowSize ?? null,
        populationWinnerCount: policy?.populationWinnerCount ?? null,
        maxWinnersTotal: policy?.maxWinnersTotal ?? null,
        currentWinnerCount:
          winnerCount + winners.filter((w) => w.rewardId).length,
      },
      rewards,
    );
    if (res.outcome === "WON" && res.rewardId) {
      winners.push({ customerId: entry.customerId, rewardId: res.rewardId });
    }
  }

  await db.$transaction(async (tx) => {
    let rank = 0;
    for (const w of winners) {
      rank += 1;
      await tx.gameDrawWinner.create({
        data: {
          drawBatchId: batch.id,
          businessId: input.businessId,
          customerId: w.customerId,
          rewardId: w.rewardId,
          rank,
        },
      });
    }
    await tx.gameDrawBatch.update({
      where: { id: batch.id },
      data: {
        status: "COMPLETED",
        executedAt: new Date(),
        winnerCount: winners.length,
        executionLogJson: {
          entryCount: entries.length,
          winners: winners.length,
        },
      },
    });
  });

  await logGameAudit({
    businessId: input.businessId,
    campaignId: batch.campaignId,
    actorUserId: input.actorUserId ?? undefined,
    action: "LOTTERY_DRAW_COMPLETED",
    afterJson: { drawBatchId: batch.id, winnerCount: winners.length },
  });

  return { ok: true as const, winnerCount: winners.length };
}
