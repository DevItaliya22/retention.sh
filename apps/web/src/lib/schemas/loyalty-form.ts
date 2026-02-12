import { validateTierRanges } from "@/lib/loyalty/helpers";
import { z } from "zod";
import {
  loyaltyBrandingSchema,
  loyaltyRewardTypeSchema,
  loyaltyTermsSchema,
  loyaltyTypeSchema,
  visitIntervalUnitSchema,
} from "./loyalty";

import type { LoyaltyType } from "./loyalty";
export type { LoyaltyType } from "./loyalty";

// ─── Step 1: Type Selection (pre-step, not in LinearMultiStepForm) ──────────

export const loyaltyTypeStepSchema = z.object({
  loyaltyType: loyaltyTypeSchema,
});
export type LoyaltyTypeStepValues = z.infer<typeof loyaltyTypeStepSchema>;

// ─── Cashback Steps ────────────────────────────────────────────────────────

export const cashbackConfigStepSchema = z.object({
  cashbackPercentage: z.coerce.number().min(0).max(100).default(0),
  onFinalAmount: z.boolean().default(false),
  maxCashbackCap: z.coerce.number().min(0).optional().nullable(),
  minPurchaseForEarningEnabled: z.boolean().default(false),
  minPurchaseForEarning: z.coerce.number().min(0).optional().nullable(),
  minPurchaseForRedemptionEnabled: z.boolean().default(false),
  minPurchaseForRedemption: z.coerce.number().min(0).optional().nullable(),
});

export const cashbackRedemptionLimitsStepSchema = z.object({
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

// ─── Tier Steps ────────────────────────────────────────────────────────────

export const tierConfigStepSchema = z.object({
  pointsPerRupee: z.coerce.number().min(0).default(1),
  onFinalAmount: z.boolean().default(false),
});

const tierItemSchema = z.object({
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

export const tierEditorStepSchema = z
  .object({
    tiers: z.array(tierItemSchema).min(1, "At least one tier is required"),
  })
  .superRefine((data, ctx) => {
    const result = validateTierRanges(
      data.tiers.map((t) => ({
        rank: t.rank,
        minLifetimeSpend: t.minLifetimeSpend,
        maxLifetimeSpend: t.maxLifetimeSpend,
      })),
    );
    if (!result.valid) {
      // Path "tiers" so the multi-step form applies this error to the field and it can be shown in UI
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: result.errors.join(" "),
        path: ["tiers"],
      });
    }
  });

// ─── Amount Spent Steps ────────────────────────────────────────────────────

export const amountSpentConfigStepSchema = z.object({
  pointsPerRupee: z.coerce.number().min(0).default(1),
  onFinalAmount: z.boolean().default(false),
  maxPointsPerPurchase: z.coerce.number().int().min(0).optional().nullable(),
});

// ─── Visit Made Step ───────────────────────────────────────────────────────

export const visitMadeConfigStepSchema = z.object({
  pointsPerVisit: z.coerce.number().int().min(0).default(1),
  visitIntervalEnabled: z.boolean().default(false),
  visitIntervalValue: z.coerce.number().int().min(1).optional().nullable(),
  visitIntervalUnit: visitIntervalUnitSchema.optional().nullable(),
});

// ─── Reward Stages (Amount Spent + Visit Made) ──────────────────────────────

const rewardStageItemSchema = z.object({
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

export const rewardStagesStepSchema = z.object({
  rewardStages: z.array(rewardStageItemSchema),
});

// ─── Common Steps ──────────────────────────────────────────────────────────

export const expiryStepSchema = z.object({
  pointReminderDays: z.coerce.number().int().min(0).optional().nullable(),
  pointExpiryDays: z.coerce.number().int().min(1).optional().nullable(),
});

export const channelsTermsStepSchema = z.object({
  whatsappEnabled: z.boolean().optional(),
  emailEnabled: z.boolean().optional(),
  smsEnabled: z.boolean().optional(),
  termsAndConditions: loyaltyTermsSchema.optional(),
});

export const brandingStepSchema = z.object({
  branding: loyaltyBrandingSchema,
});

// ─── Combined Form Values (flattened for form state) ────────────────────────

/** All possible form fields across all loyalty types. */
export type LoyaltyProgramFormValues = {
  loyaltyType: LoyaltyType;

  // Cashback
  cashbackPercentage?: number;
  onFinalAmount?: boolean;
  maxCashbackCap?: number | null;
  minPurchaseForEarningEnabled?: boolean;
  minPurchaseForEarning?: number | null;
  minPurchaseForRedemptionEnabled?: boolean;
  minPurchaseForRedemption?: number | null;
  redemptionBalanceLimitEnabled?: boolean;
  redemptionBalanceLimitAmount?: number | null;
  redemptionBalanceLimitPercentage?: number | null;
  redemptionBillLimitEnabled?: boolean;
  redemptionBillLimitAmount?: number | null;
  redemptionBillLimitPercentage?: number | null;

  // Tier
  pointsPerRupee?: number;
  tiers?: Array<{
    id?: string;
    name: string;
    rank: number;
    minLifetimeSpend: number;
    maxLifetimeSpend?: number | null;
    cashbackPercentage?: number;
    minPurchaseForRedemptionEnabled?: boolean;
    minPurchaseForRedemption?: number | null;
    maxCashbackCapEnabled?: boolean;
    maxCashbackCap?: number | null;
  }>;

  // Amount Spent
  maxPointsPerPurchase?: number | null;

  // Visit Made
  pointsPerVisit?: number;
  visitIntervalEnabled?: boolean;
  visitIntervalValue?: number | null;
  visitIntervalUnit?: string | null;

  // Reward stages (Amount Spent + Visit Made)
  rewardStages?: Array<{
    id?: string;
    pointsRequired: number;
    rewardType: string;
    rewardName: string;
    freeItemSkuId?: string | null;
    freeItemName?: string | null;
    percentageValue?: number | null;
    appliesToEntirePurchase?: boolean;
    specificProductIds?: string[];
    cashAmount?: number | null;
    minPurchaseForRedemptionEnabled?: boolean;
    minPurchaseForRedemption?: number | null;
    maxDiscountCapEnabled?: boolean;
    maxDiscountCap?: number | null;
  }>;

  // Common
  pointReminderDays?: number | null;
  pointExpiryDays?: number | null;
  whatsappEnabled?: boolean;
  emailEnabled?: boolean;
  smsEnabled?: boolean;
  termsAndConditions?: string[];
  branding?: z.infer<typeof loyaltyBrandingSchema>;
};
