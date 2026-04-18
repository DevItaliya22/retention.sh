import type { GameEligibilityEventType } from "@/lib/gamification/types";
import { checkRateLimit } from "@/lib/ratelimit/ratelimit";
import { db } from "@reelo/db";
import { allocateGameOutcome, type RewardRow } from "./allocation-engine";
import { logGameAudit } from "./audit";

function campaignActiveWindow(
  startsAt: Date | null,
  endsAt: Date | null,
  now: Date,
): boolean {
  if (startsAt && now < startsAt) return false;
  if (endsAt && now > endsAt) return false;
  return true;
}

export async function getCampaignForBusiness(id: string, businessId: string) {
  return db.gameCampaign.findFirst({
    where: { id, businessId },
    include: {
      eligibilityRules: true,
      distributionPolicy: true,
      rewards: { orderBy: { priority: "asc" } },
    },
  });
}

export async function recordGameAttempt(input: {
  businessId: string;
  campaignId: string;
  customerId: string;
  userId: string;
  triggerEventType: GameEligibilityEventType;
  triggerEventId: string;
  billId?: string | null;
  idempotencyKey?: string | null;
  requestId?: string | null;
}) {
  const campaign = await getCampaignForBusiness(
    input.campaignId,
    input.businessId,
  );
  if (!campaign || campaign.status !== "ACTIVE") {
    return {
      ok: false as const,
      status: 404 as const,
      error: "Campaign not found or not active",
    };
  }

  if (!campaignActiveWindow(campaign.startsAt, campaign.endsAt, new Date())) {
    return {
      ok: false as const,
      status: 400 as const,
      error: "Outside campaign window",
    };
  }

  const rl = await checkRateLimit({
    key: `game:attempt:${input.businessId}:${input.customerId}:${input.campaignId}`,
    maxTries: 60,
    windowSeconds: 3600,
  });
  if (!rl.allowed) {
    return {
      ok: false as const,
      status: 429 as const,
      error: "Rate limited",
      retryAfterSeconds: rl.retryAfterSeconds,
    };
  }

  const existing = await db.gameAttempt.findFirst({
    where: {
      campaignId: input.campaignId,
      customerId: input.customerId,
      triggerEventType: input.triggerEventType,
      triggerEventId: input.triggerEventId,
    },
    include: { allocation: true },
  });
  if (existing?.allocation) {
    return {
      ok: true as const,
      deduped: true as const,
      attemptId: existing.id,
      allocation: existing.allocation,
    };
  }

  if (input.idempotencyKey) {
    const byKey = await db.gameAttempt.findFirst({
      where: {
        campaignId: input.campaignId,
        idempotencyKey: input.idempotencyKey,
      },
      include: { allocation: true },
    });
    if (byKey?.allocation) {
      return {
        ok: true as const,
        deduped: true as const,
        attemptId: byKey.id,
        allocation: byKey.allocation,
      };
    }
  }

  const attemptCount = await db.gameAttempt.count({
    where: { campaignId: input.campaignId },
  });
  const attemptOrdinal = attemptCount + 1;

  const winnerCount = await db.gameAllocation.count({
    where: {
      attempt: { campaignId: input.campaignId },
      outcome: "WON",
    },
  });

  const policy = campaign.distributionPolicy;
  const rewards: RewardRow[] = campaign.rewards.map((r) => ({
    id: r.id,
    kind: r.kind,
    displayName: r.displayName,
    weight: r.weight,
    probabilityPercent: r.probabilityPercent,
    maxWinners: r.maxWinners,
    stock: r.stock,
    isFallbackNoReward: r.isFallbackNoReward,
  }));

  const isLotteryScheduled =
    campaign.type === "LOTTERY" &&
    campaign.fulfillmentMode === "SCHEDULED_DRAW";

  const allocationResult = isLotteryScheduled
    ? {
        outcome: "DRAW_PENDING" as const,
        rewardId: null as string | null,
        reason: "lottery_entry_pending_draw",
        rngTrace: { roll: 0, sumWeight: 0, pickedIndex: null as number | null },
      }
    : allocateGameOutcome(
        {
          distributionMode: policy?.mode ?? "PROBABILITY_WEIGHTED",
          seedVersion: policy?.randomSeedVersion ?? 1,
          attemptOrdinal,
          populationWindowSize: policy?.populationWindowSize ?? null,
          populationWinnerCount: policy?.populationWinnerCount ?? null,
          maxWinnersTotal: policy?.maxWinnersTotal ?? null,
          currentWinnerCount: winnerCount,
        },
        rewards,
      );

  const finalOutcome = allocationResult.outcome;

  const result = await db.$transaction(async (tx) => {
    const attempt = await tx.gameAttempt.create({
      data: {
        campaignId: input.campaignId,
        businessId: input.businessId,
        customerId: input.customerId,
        triggerEventType: input.triggerEventType,
        triggerEventId: input.triggerEventId,
        billId: input.billId ?? undefined,
        attemptOrdinal,
        idempotencyKey: input.idempotencyKey ?? undefined,
        eligibilitySnapshotJson: {
          at: new Date().toISOString(),
          eventType: input.triggerEventType,
          eventId: input.triggerEventId,
        },
      },
    });

    const allocation = await tx.gameAllocation.create({
      data: {
        attemptId: attempt.id,
        outcome: finalOutcome,
        rewardId: allocationResult.rewardId,
        allocationReason: allocationResult.reason,
        policySnapshotJson: policy ?? undefined,
        rngTraceJson: allocationResult.rngTrace,
      },
    });

    await tx.gameFulfillment.create({
      data: {
        allocationId: allocation.id,
        mode: campaign.fulfillmentMode,
        status: isLotteryScheduled
          ? "SCHEDULED"
          : campaign.fulfillmentMode === "INSTANT"
            ? "FULFILLED"
            : "PENDING",
        scheduledFor: isLotteryScheduled ? (campaign.drawAt ?? null) : null,
        fulfilledAt:
          !isLotteryScheduled && campaign.fulfillmentMode === "INSTANT"
            ? new Date()
            : null,
      },
    });

    if (isLotteryScheduled) {
      let drawBatch = await tx.gameDrawBatch.findFirst({
        where: {
          campaignId: input.campaignId,
          status: { in: ["SCHEDULED", "RUNNING"] },
        },
        orderBy: { scheduledAt: "asc" },
      });
      if (!drawBatch) {
        drawBatch = await tx.gameDrawBatch.create({
          data: {
            campaignId: input.campaignId,
            scheduledAt: campaign.drawAt ?? new Date(),
            status: "SCHEDULED",
          },
        });
      }
      await tx.gameDrawEntry.create({
        data: {
          campaignId: input.campaignId,
          drawBatchId: drawBatch.id,
          businessId: input.businessId,
          customerId: input.customerId,
          sourceAttemptId: attempt.id,
          entryCount: 1,
        },
      });
    }

    return { attempt, allocation };
  });

  await logGameAudit({
    businessId: input.businessId,
    campaignId: input.campaignId,
    actorUserId: input.userId,
    action: "GAME_ATTEMPT",
    requestId: input.requestId ?? undefined,
    afterJson: {
      attemptId: result.attempt.id,
      outcome: finalOutcome,
    },
  });

  return {
    ok: true as const,
    deduped: false as const,
    attemptId: result.attempt.id,
    allocation: result.allocation,
  };
}

export async function ingestGameEvents(input: {
  businessId: string;
  campaignId: string;
  userId: string;
  requestId?: string | null;
  events: Array<{
    customerId: string;
    eventType: GameEligibilityEventType;
    eventId: string;
    billId?: string | null;
  }>;
}) {
  const campaign = await getCampaignForBusiness(
    input.campaignId,
    input.businessId,
  );
  if (!campaign || campaign.status !== "ACTIVE") {
    return { ok: false as const, error: "Campaign not found or not active" };
  }

  const allowedEvents = new Set<string>(
    campaign.eligibilityRules.map((r) => r.eventType),
  );

  const results: Array<{ eventId: string; ok: boolean; error?: string }> = [];
  for (const ev of input.events) {
    if (!allowedEvents.has(ev.eventType as string)) {
      results.push({
        eventId: ev.eventId,
        ok: false,
        error: "event_type_not_allowed",
      });
      continue;
    }
    const r = await recordGameAttempt({
      businessId: input.businessId,
      campaignId: input.campaignId,
      customerId: ev.customerId,
      userId: input.userId,
      triggerEventType: ev.eventType,
      triggerEventId: ev.eventId,
      billId: ev.billId,
      requestId: input.requestId,
    });
    results.push({
      eventId: ev.eventId,
      ok: r.ok,
      error: "error" in r ? r.error : undefined,
    });
  }

  await logGameAudit({
    businessId: input.businessId,
    campaignId: input.campaignId,
    actorUserId: input.userId,
    action: "GAME_EVENTS_INGEST",
    requestId: input.requestId ?? undefined,
    afterJson: { count: input.events.length },
  });

  return { ok: true as const, results };
}
