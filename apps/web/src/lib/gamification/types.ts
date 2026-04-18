/**
 * Shared domain types for games of chance (wheel, lottery, scratch).
 * Bridge: legacy `ScratchCard` can map to `GameCampaign` via `legacyScratchCardId`.
 */

export type GameType = "SPIN_WHEEL" | "LOTTERY" | "SCRATCH_CARD";

export type GameCampaignStatus =
  | "DRAFT"
  | "ACTIVE"
  | "PAUSED"
  | "COMPLETED"
  | "ARCHIVED";

/** Mirrors Prisma `GameEligibilityEventType` (kept local until client regen). */
export type GameEligibilityEventType =
  | "BILL_CREATED"
  | "VISIT_QUALIFIED"
  | "REFERRAL_COMPLETED"
  | "CAMPAIGN_ACTION"
  | "MANUAL_GRANT"
  | "CUSTOM_EVENT";

/** @deprecated use GameEligibilityEventType */
export type EligibilityEventType = GameEligibilityEventType;

export type GameDistributionMode =
  | "PROBABILITY_WEIGHTED"
  | "POPULATION_RATIO"
  | "FIXED_WINNER_COUNT"
  | "FIRST_N";

export type GameFulfillmentMode = "INSTANT" | "SCHEDULED_DRAW";

export type GameAttemptOutcome =
  | "WON"
  | "NOT_WON"
  | "INELIGIBLE"
  | "RATE_LIMITED"
  | "EXHAUSTED"
  | "DRAW_PENDING";

export type GameRewardType =
  | "NONE"
  | "LOYALTY_POINTS"
  | "CASHBACK"
  | "FREE_ITEM"
  | "PERCENTAGE_DISCOUNT"
  | "VOUCHER_CODE";

export type GameFulfillmentStatus =
  | "PENDING"
  | "SCHEDULED"
  | "FULFILLED"
  | "FAILED"
  | "CANCELLED";

export type DrawBatchStatus =
  | "SCHEDULED"
  | "RUNNING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

export interface EligibilitySnapshot {
  eventType: GameEligibilityEventType;
  eventId: string;
  billId?: string | null;
  at: string;
  segmentIds?: string[];
  notes?: string;
}

export interface PolicySnapshot {
  distributionMode: GameDistributionMode;
  seedVersion: number;
  rewardWeights: Record<string, number>;
  populationWindow?: number;
  populationWinners?: number;
}

export interface AllocationReason {
  code: string;
  detail?: string;
}
