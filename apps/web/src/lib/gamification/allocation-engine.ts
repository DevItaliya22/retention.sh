export type GameDistributionMode =
  | "PROBABILITY_WEIGHTED"
  | "POPULATION_RATIO"
  | "FIXED_WINNER_COUNT"
  | "FIRST_N";

export type GameRewardKind =
  | "NONE"
  | "LOYALTY_POINTS"
  | "CASHBACK"
  | "FREE_ITEM"
  | "PERCENTAGE_DISCOUNT"
  | "VOUCHER_CODE";

export interface RewardRow {
  id: string;
  kind: GameRewardKind;
  displayName: string;
  weight: number;
  probabilityPercent: number | null;
  maxWinners: number | null;
  stock: number | null;
  isFallbackNoReward: boolean;
}

export interface AllocationContext {
  distributionMode: GameDistributionMode;
  seedVersion: number;
  /** Ordinal attempt for this campaign (1-based), used for FIRST_N / windowing */
  attemptOrdinal: number;
  populationWindowSize: number | null;
  populationWinnerCount: number | null;
  maxWinnersTotal: number | null;
  currentWinnerCount: number;
}

export interface AllocationResult {
  outcome:
    | "WON"
    | "NOT_WON"
    | "INELIGIBLE"
    | "RATE_LIMITED"
    | "EXHAUSTED"
    | "DRAW_PENDING";
  rewardId: string | null;
  reason: string;
  rngTrace: { roll: number; sumWeight: number; pickedIndex: number | null };
}

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Deterministic PRNG from campaign seed + attempt ordinal */
export function createRng(seedVersion: number, attemptOrdinal: number) {
  const seed = seedVersion * 1_000_000 + attemptOrdinal;
  return mulberry32(seed);
}

export function selectWeightedReward(
  rewards: RewardRow[],
  rng: () => number,
): { rewardId: string | null; trace: AllocationResult["rngTrace"] } {
  const eligible = rewards.filter((r) => {
    if (r.stock != null && r.stock <= 0) return false;
    return true;
  });
  if (eligible.length === 0) {
    return {
      rewardId: null,
      trace: { roll: 0, sumWeight: 0, pickedIndex: null },
    };
  }
  const sumWeight = eligible.reduce((s, r) => s + Math.max(0, r.weight), 0);
  if (sumWeight <= 0) {
    const fallback = eligible.find((r) => r.isFallbackNoReward);
    return {
      rewardId: fallback?.id ?? eligible[0]?.id ?? null,
      trace: { roll: 0, sumWeight: 0, pickedIndex: null },
    };
  }
  const roll = rng() * sumWeight;
  let acc = 0;
  for (let i = 0; i < eligible.length; i++) {
    acc += Math.max(0, eligible[i].weight);
    if (roll < acc) {
      return {
        rewardId: eligible[i].id,
        trace: { roll, sumWeight, pickedIndex: i },
      };
    }
  }
  const last = eligible[eligible.length - 1];
  return {
    rewardId: last?.id ?? null,
    trace: { roll, sumWeight, pickedIndex: eligible.length - 1 },
  };
}

export function allocateGameOutcome(
  ctx: AllocationContext,
  rewards: RewardRow[],
): AllocationResult {
  if (
    ctx.maxWinnersTotal != null &&
    ctx.currentWinnerCount >= ctx.maxWinnersTotal
  ) {
    return {
      outcome: "EXHAUSTED",
      rewardId: null,
      reason: "max_winners_total_reached",
      rngTrace: { roll: 0, sumWeight: 0, pickedIndex: null },
    };
  }

  if (ctx.distributionMode === "FIRST_N" && ctx.populationWindowSize != null) {
    if (ctx.attemptOrdinal > ctx.populationWindowSize) {
      return {
        outcome: "INELIGIBLE",
        rewardId: null,
        reason: "first_n_exhausted",
        rngTrace: { roll: 0, sumWeight: 0, pickedIndex: null },
      };
    }
  }

  if (ctx.distributionMode === "POPULATION_RATIO") {
    const w = ctx.populationWindowSize ?? 100;
    const k = ctx.populationWinnerCount ?? 0;
    if (w > 0 && k > 0) {
      const pos = ((ctx.attemptOrdinal - 1) % w) + 1;
      if (pos > k) {
        const fallback = rewards.find((r) => r.isFallbackNoReward);
        return {
          outcome: "NOT_WON",
          rewardId: fallback?.id ?? null,
          reason: "population_ratio_slot",
          rngTrace: { roll: pos, sumWeight: w, pickedIndex: null },
        };
      }
    }
  }

  const rng = createRng(ctx.seedVersion, ctx.attemptOrdinal);
  const { rewardId, trace } = selectWeightedReward(rewards, rng);
  const picked = rewards.find((r) => r.id === rewardId);
  if (!picked || picked.isFallbackNoReward || picked.kind === "NONE") {
    return {
      outcome: "NOT_WON",
      rewardId: picked?.id ?? null,
      reason: "weighted_no_prize",
      rngTrace: trace,
    };
  }
  return {
    outcome: "WON",
    rewardId: picked.id,
    reason: "weighted_win",
    rngTrace: trace,
  };
}
