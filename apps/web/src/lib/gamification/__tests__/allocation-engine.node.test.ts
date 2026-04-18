import assert from "node:assert/strict";
import test from "node:test";
import { allocateGameOutcome } from "../allocation-engine";

test("FIRST_N rejects after window", () => {
  const rewards = [
    {
      id: "a",
      kind: "LOYALTY_POINTS" as const,
      displayName: "Win",
      weight: 1,
      probabilityPercent: null,
      maxWinners: null,
      stock: null,
      isFallbackNoReward: false,
    },
  ];
  const r = allocateGameOutcome(
    {
      distributionMode: "FIRST_N",
      seedVersion: 1,
      attemptOrdinal: 5,
      populationWindowSize: 4,
      populationWinnerCount: null,
      maxWinnersTotal: null,
      currentWinnerCount: 0,
    },
    rewards,
  );
  assert.equal(r.outcome, "INELIGIBLE");
});

test("POPULATION_RATIO assigns slots", () => {
  const rewards = [
    {
      id: "win",
      kind: "LOYALTY_POINTS" as const,
      displayName: "Win",
      weight: 1,
      probabilityPercent: null,
      maxWinners: null,
      stock: null,
      isFallbackNoReward: false,
    },
    {
      id: "lose",
      kind: "NONE" as const,
      displayName: "No",
      weight: 1,
      probabilityPercent: null,
      maxWinners: null,
      stock: null,
      isFallbackNoReward: true,
    },
  ];
  const r5 = allocateGameOutcome(
    {
      distributionMode: "POPULATION_RATIO",
      seedVersion: 1,
      attemptOrdinal: 5,
      populationWindowSize: 10,
      populationWinnerCount: 3,
      maxWinnersTotal: null,
      currentWinnerCount: 0,
    },
    rewards,
  );
  assert.equal(r5.outcome, "NOT_WON");
});
