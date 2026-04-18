import { z } from "zod";

export const gameTypeSchema = z.enum(["SPIN_WHEEL", "LOTTERY", "SCRATCH_CARD"]);

export const gameCampaignStatusSchema = z.enum([
  "DRAFT",
  "ACTIVE",
  "PAUSED",
  "COMPLETED",
  "ARCHIVED",
]);

export const eligibilityEventTypeSchema = z.enum([
  "BILL_CREATED",
  "VISIT_QUALIFIED",
  "REFERRAL_COMPLETED",
  "CAMPAIGN_ACTION",
  "MANUAL_GRANT",
  "CUSTOM_EVENT",
]);

export const distributionModeSchema = z.enum([
  "PROBABILITY_WEIGHTED",
  "POPULATION_RATIO",
  "FIXED_WINNER_COUNT",
  "FIRST_N",
]);

export const fulfillmentModeSchema = z.enum(["INSTANT", "SCHEDULED_DRAW"]);

export const gameCampaignCreateSchema = z.object({
  type: gameTypeSchema,
  name: z.string().min(1).max(200),
  slug: z
    .string()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9-]+$/i, "Slug must be alphanumeric with hyphens")
    .optional(),
  timezone: z.string().optional(),
  fulfillmentMode: fulfillmentModeSchema.optional(),
  drawAt: z.string().datetime().optional().nullable(),
});

export const gameCampaignUpdateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  slug: z
    .string()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9-]+$/i)
    .optional(),
  status: gameCampaignStatusSchema.optional(),
  startsAt: z.string().datetime().optional().nullable(),
  endsAt: z.string().datetime().optional().nullable(),
  timezone: z.string().optional(),
  priority: z.number().int().optional(),
  isStackable: z.boolean().optional(),
  fulfillmentMode: fulfillmentModeSchema.optional(),
  drawAt: z.string().datetime().optional().nullable(),
  drawWindowStart: z.string().datetime().optional().nullable(),
  drawWindowEnd: z.string().datetime().optional().nullable(),
});

export const gameEligibilityRuleSchema = z.object({
  eventType: eligibilityEventTypeSchema,
  eventFilterJson: z.record(z.string(), z.unknown()).optional().nullable(),
  intervalEnabled: z.boolean().optional(),
  intervalValue: z.number().int().positive().optional().nullable(),
  intervalUnit: z
    .enum(["MINUTE", "HOUR", "DAY", "WEEK", "MONTH"])
    .optional()
    .nullable(),
  maxAttemptsPerUserPerInterval: z
    .number()
    .int()
    .positive()
    .optional()
    .nullable(),
  globalAttemptCap: z.number().int().positive().optional().nullable(),
  firstNEligibleUsers: z.number().int().positive().optional().nullable(),
  segmentId: z.string().uuid().optional().nullable(),
});

export const gameDistributionPolicySchema = z.object({
  mode: distributionModeSchema,
  populationWindowSize: z.number().int().positive().optional().nullable(),
  populationWinnerCount: z.number().int().nonnegative().optional().nullable(),
  maxWinnersTotal: z.number().int().positive().optional().nullable(),
  randomSeedVersion: z.number().int().positive().optional(),
  strictInventoryMode: z.boolean().optional(),
});

export const gameRewardSchema = z.object({
  id: z.string().uuid().optional(),
  kind: z.enum([
    "NONE",
    "LOYALTY_POINTS",
    "CASHBACK",
    "FREE_ITEM",
    "PERCENTAGE_DISCOUNT",
    "VOUCHER_CODE",
  ]),
  displayName: z.string().min(1).max(200),
  weight: z.number().int().nonnegative().default(1),
  probabilityPercent: z.number().min(0).max(100).optional().nullable(),
  maxWinners: z.number().int().positive().optional().nullable(),
  stock: z.number().int().nonnegative().optional().nullable(),
  priority: z.number().int().optional(),
  isFallbackNoReward: z.boolean().optional(),
  freeItemSkuId: z.string().uuid().optional().nullable(),
  pointsAmount: z.number().int().nonnegative().optional().nullable(),
  cashbackAmount: z.number().nonnegative().optional().nullable(),
  percentageValue: z.number().nonnegative().optional().nullable(),
  voucherCode: z.string().max(500).optional().nullable(),
});

export const gameRewardsPutSchema = z.object({
  rewards: z.array(gameRewardSchema).min(1),
});

export const gameEventIngestSchema = z.object({
  businessId: z.string().uuid().optional(),
  idempotencyKey: z.string().min(8).max(200).optional(),
  events: z
    .array(
      z.object({
        customerId: z.string().uuid(),
        eventType: eligibilityEventTypeSchema,
        eventId: z.string().min(1).max(200),
        billId: z.string().uuid().optional().nullable(),
        metadata: z.record(z.string(), z.unknown()).optional(),
      }),
    )
    .min(1)
    .max(100),
});

export const gameAttemptSchema = z.object({
  customerId: z.string().uuid(),
  triggerEventType: eligibilityEventTypeSchema,
  triggerEventId: z.string().min(1).max(200),
  billId: z.string().uuid().optional().nullable(),
  idempotencyKey: z.string().min(8).max(200).optional(),
});

export const gameSimulateSchema = z.object({
  trials: z.number().int().min(100).max(50_000).default(5000),
});
