import { validateTierRanges } from "@/lib/loyalty/helpers";
import { z } from "zod";

// ─── Enums ────────────────────────────────────────────────────────────────

export const loyaltyTypeSchema = z.enum([
  "CASHBACK",
  "TIER",
  "AMOUNT_SPENT",
  "VISIT_MADE",
]);
export type LoyaltyType = z.infer<typeof loyaltyTypeSchema>;

export const loyaltyRewardTypeSchema = z.enum([
  "FREE_ITEM",
  "PERCENTAGE_DISCOUNT",
  "CASH_DISCOUNT",
]);
export type LoyaltyRewardType = z.infer<typeof loyaltyRewardTypeSchema>;

export const visitIntervalUnitSchema = z.enum([
  "MINUTE",
  "HOUR",
  "DAY",
  "WEEK",
  "MONTH",
]);
export type VisitIntervalUnit = z.infer<typeof visitIntervalUnitSchema>;

// ─── Common (shared across features) ───────────────────────────────────────

export const loyaltyTermsSchema = z.array(
  z.string().max(500, "Term is too long").trim(),
);

export const loyaltyBrandingSchema = z
  .object({
    logo: z.string().max(2048).optional().nullable(),
    themeColor: z.string().max(7).optional().nullable(),
    textColor: z.string().max(7).optional().nullable(),
    bannerImage: z.string().max(2048).optional().nullable(),
    header: z.string().max(200).optional().nullable(),
    subtitle: z.string().max(500).optional().nullable(),
  })
  .optional()
  .nullable();

// ─── Cashback Config ──────────────────────────────────────────────────────

export const cashbackConfigSchema = z.object({
  cashbackPercentage: z.coerce.number().min(0).max(100).default(0),
  onFinalAmount: z.boolean().default(false),
  maxCashbackCap: z.coerce.number().min(0).optional().nullable(),

  minPurchaseForEarningEnabled: z.boolean().default(false),
  minPurchaseForEarning: z.coerce.number().min(0).optional().nullable(),

  minPurchaseForRedemptionEnabled: z.boolean().default(false),
  minPurchaseForRedemption: z.coerce.number().min(0).optional().nullable(),

  redemptionBalanceLimitEnabled: z.boolean().default(false),
  redemptionBalanceLimitAmount: z.coerce.number().min(0).optional().nullable(),
  redemptionBalanceLimitPercentage: z.coerce
    .number()
    .min(0)
    .max(100)
    .optional()
    .nullable(),

  redemptionBillLimitEnabled: z.boolean().default(false),
  redemptionBillLimitAmount: z.coerce.number().min(0).optional().nullable(),
  redemptionBillLimitPercentage: z.coerce
    .number()
    .min(0)
    .max(100)
    .optional()
    .nullable(),
});
export type CashbackConfigInput = z.infer<typeof cashbackConfigSchema>;

// ─── Tier Config & Tiers ──────────────────────────────────────────────────

export const loyaltyTierSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(100),
  rank: z.coerce.number().int().min(1),
  minLifetimeSpend: z.coerce.number().min(0),
  maxLifetimeSpend: z.coerce.number().min(0).optional().nullable(),

  cashbackPercentage: z.coerce.number().min(0).max(100).default(0),

  minPurchaseForRedemptionEnabled: z.boolean().default(false),
  minPurchaseForRedemption: z.coerce.number().min(0).optional().nullable(),

  maxCashbackCapEnabled: z.boolean().default(false),
  maxCashbackCap: z.coerce.number().min(0).optional().nullable(),
});
export type LoyaltyTierInput = z.infer<typeof loyaltyTierSchema>;

/** Base tier config (no refinements) — use .partial() on this for update schema. */
const tierConfigSchemaBase = z.object({
  pointsPerRupee: z.coerce.number().min(0).default(1),
  tiers: z.array(loyaltyTierSchema).min(1, "At least one tier is required"),
});

export const tierConfigSchema = tierConfigSchemaBase.superRefine(
  (data, ctx) => {
    const result = validateTierRanges(
      data.tiers.map((t) => ({
        rank: t.rank,
        minLifetimeSpend: t.minLifetimeSpend,
        maxLifetimeSpend: t.maxLifetimeSpend,
      })),
    );
    if (!result.valid) {
      result.errors.forEach((msg) =>
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: msg }),
      );
    }
  },
);
export type TierConfigInput = z.infer<typeof tierConfigSchema>;

// ─── Amount Spent Config ──────────────────────────────────────────────────

export const amountSpentConfigSchema = z.object({
  pointsPerRupee: z.coerce.number().min(0).default(1),
  onFinalAmount: z.boolean().default(false),
  maxPointsPerPurchase: z.coerce.number().int().min(0).optional().nullable(),
});
export type AmountSpentConfigInput = z.infer<typeof amountSpentConfigSchema>;

// ─── Visit Made Config ────────────────────────────────────────────────────

export const visitMadeConfigSchema = z.object({
  pointsPerVisit: z.coerce.number().int().min(0).default(1),
  visitIntervalEnabled: z.boolean().default(false),
  visitIntervalValue: z.coerce.number().int().min(1).optional().nullable(),
  visitIntervalUnit: visitIntervalUnitSchema.optional().nullable(),
});
export type VisitMadeConfigInput = z.infer<typeof visitMadeConfigSchema>;

// ─── Reward Stage (Amount Spent + Visit Made) ──────────────────────────────

export const rewardStageSchema = z.object({
  id: z.string().uuid().optional(),
  pointsRequired: z.coerce.number().int().min(0),
  rewardType: loyaltyRewardTypeSchema,
  rewardName: z.string().min(1).max(200),

  freeItemSkuId: z.string().uuid().optional().nullable(),
  freeItemName: z.string().max(255).optional().nullable(),

  percentageValue: z.coerce.number().min(0).max(100).optional().nullable(),
  appliesToEntirePurchase: z.boolean().default(true),
  specificProductIds: z.array(z.string()).default([]),

  cashAmount: z.coerce.number().min(0).optional().nullable(),

  minPurchaseForRedemptionEnabled: z.boolean().default(false),
  minPurchaseForRedemption: z.coerce.number().min(0).optional().nullable(),
  maxDiscountCapEnabled: z.boolean().default(false),
  maxDiscountCap: z.coerce.number().min(0).optional().nullable(),
});
export type RewardStageInput = z.infer<typeof rewardStageSchema>;

// ─── Common Loyalty Fields ────────────────────────────────────────────────

const loyaltyCommonSchema = z.object({
  pointReminderDays: z.coerce.number().int().min(0).optional().nullable(),
  pointExpiryDays: z.coerce.number().int().min(1).optional().nullable(),
  whatsappEnabled: z.boolean().optional(),
  emailEnabled: z.boolean().optional(),
  smsEnabled: z.boolean().optional(),
  termsAndConditions: loyaltyTermsSchema.optional(),
  branding: loyaltyBrandingSchema,
});

// ─── Create (Discriminated Union) ──────────────────────────────────────────

export const loyaltyCreateCashbackSchema = loyaltyCommonSchema.extend({
  loyaltyType: z.literal("CASHBACK"),
  cashbackConfig: cashbackConfigSchema,
});

export const loyaltyCreateTierSchema = loyaltyCommonSchema.extend({
  loyaltyType: z.literal("TIER"),
  tierConfig: tierConfigSchema,
});

export const loyaltyCreateAmountSpentSchema = loyaltyCommonSchema.extend({
  loyaltyType: z.literal("AMOUNT_SPENT"),
  amountSpentConfig: amountSpentConfigSchema,
  rewardStages: z.array(rewardStageSchema).min(0),
});

export const loyaltyCreateVisitMadeSchema = loyaltyCommonSchema.extend({
  loyaltyType: z.literal("VISIT_MADE"),
  visitMadeConfig: visitMadeConfigSchema,
  rewardStages: z.array(rewardStageSchema).min(0),
});

export const loyaltyCreateSchema = z.discriminatedUnion("loyaltyType", [
  loyaltyCreateCashbackSchema,
  loyaltyCreateTierSchema,
  loyaltyCreateAmountSpentSchema,
  loyaltyCreateVisitMadeSchema,
]);
export type LoyaltyCreateInput = z.infer<typeof loyaltyCreateSchema>;

// ─── Update (Section-based partial) ────────────────────────────────────────

export const loyaltyUpdateSectionSchema = z.enum([
  "common",
  "cashbackConfig",
  "tierConfig",
  "tiers",
  "amountSpentConfig",
  "visitMadeConfig",
  "rewardStages",
  "branding",
]);

/** PUT body: section + the corresponding payload. API validates per section. */
export const loyaltyUpdateSchema = z.object({
  section: loyaltyUpdateSectionSchema,
  // Payload depends on section; API validates per section.
  pointReminderDays: z.coerce.number().int().min(0).optional().nullable(),
  pointExpiryDays: z.coerce.number().int().min(1).optional().nullable(),
  whatsappEnabled: z.boolean().optional(),
  emailEnabled: z.boolean().optional(),
  smsEnabled: z.boolean().optional(),
  termsAndConditions: loyaltyTermsSchema.optional(),
  branding: loyaltyBrandingSchema.optional(),
  cashbackConfig: cashbackConfigSchema.partial().optional(),
  tierConfig: tierConfigSchemaBase.partial().optional(),
  tiers: z.array(loyaltyTierSchema).optional(),
  amountSpentConfig: amountSpentConfigSchema.partial().optional(),
  visitMadeConfig: visitMadeConfigSchema.partial().optional(),
  rewardStages: z.array(rewardStageSchema).optional(),
});
export type LoyaltyUpdateInput = z.infer<typeof loyaltyUpdateSchema>;

// ─── Other (unchanged) ────────────────────────────────────────────────────

export const loyaltyPreviewSchema = z.object({
  phone: z.string().min(4),
  businessId: z.string().uuid(),
  billAmount: z.coerce.number().min(0),
  /** Optional. When provided and program uses subtotal for earning, used for earnable calculation. */
  subtotal: z.coerce.number().min(0).optional(),
});

export const loyaltyStatsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).optional(),
  perPage: z.coerce.number().int().min(1).max(100).default(10).optional(),
  sort: z.string().max(100).optional(),
  type: z
    .enum(["EARNED", "REDEEMED", "REFUNDED", "GIFTED", "ADJUSTMENT", "EXPIRED"])
    .optional(),
  source: z.string().max(50).trim().optional(),
  customerName: z.string().max(255).trim().optional(),
  billNumber: z.string().max(255).trim().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
});

export type LoyaltyPreviewInput = z.infer<typeof loyaltyPreviewSchema>;
export type LoyaltyStatsQueryInput = z.infer<typeof loyaltyStatsQuerySchema>;
