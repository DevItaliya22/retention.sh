/**
 * Default "best practice" values for loyalty onboarding forms (all 4 types).
 * Pre-fills the multi-step form so users can tweak instead of starting from scratch.
 */

import {
  createDefaultRewardStage,
  createDefaultTier,
  getNextRewardStage,
} from "@/lib/loyalty/form-defaults";
import type {
  LoyaltyProgramFormValues,
  LoyaltyType,
} from "@/lib/schemas/loyalty-form";

/** Shared defaults for expiry, channels, terms, and branding (all loyalty types). */
export const LOYALTY_COMMON_DEFAULTS: Partial<LoyaltyProgramFormValues> = {
  pointReminderDays: 7,
  pointExpiryDays: 365,
  whatsappEnabled: true,
  emailEnabled: true,
  smsEnabled: false,
  termsAndConditions: [
    "Points/cashback are non-transferable and have no cash value except as stated.",
    "We reserve the right to modify or discontinue this program with reasonable notice.",
  ],
  branding: {
    logo: null,
    themeColor: null,
    textColor: null,
    bannerImage: null,
    header: null,
    subtitle: null,
  },
};

/** Default reward stage used for AMOUNT_SPENT and VISIT_MADE (one starter reward). */
const DEFAULT_REWARD_STAGE = createDefaultRewardStage();

/** Default tiers for TIER type: Silver, Gold, Platinum with non-overlapping spend ranges. */
const DEFAULT_TIERS = [
  {
    ...createDefaultTier(1, {
      name: "Silver",
      maxLifetimeSpend: 9_999,
      cashbackPercentage: 5,
    }),
    minPurchaseForRedemptionEnabled: false,
    minPurchaseForRedemption: null,
    maxCashbackCapEnabled: false,
    maxCashbackCap: null,
  },
  {
    ...createDefaultTier(2, {
      name: "Gold",
      minLifetimeSpend: 10_000,
      maxLifetimeSpend: 49_999,
      cashbackPercentage: 7,
    }),
    minPurchaseForRedemptionEnabled: false,
    minPurchaseForRedemption: null,
    maxCashbackCapEnabled: false,
    maxCashbackCap: null,
  },
  {
    ...createDefaultTier(3, {
      name: "Platinum",
      minLifetimeSpend: 50_000,
      maxLifetimeSpend: null,
      cashbackPercentage: 10,
    }),
    minPurchaseForRedemptionEnabled: false,
    minPurchaseForRedemption: null,
    maxCashbackCapEnabled: false,
    maxCashbackCap: null,
  },
];

/**
 * Build initial form values for the loyalty onboarding form by type.
 * Uses best-practice defaults so the user can review and edit instead of filling from zero.
 */
export function getLoyaltyFormDefaults(
  type: LoyaltyType,
): Partial<LoyaltyProgramFormValues> {
  const base: Partial<LoyaltyProgramFormValues> = {
    loyaltyType: type,
    ...LOYALTY_COMMON_DEFAULTS,
  };

  switch (type) {
    case "CASHBACK":
      return {
        ...base,
        cashbackPercentage: 5,
        onFinalAmount: true,
        maxCashbackCap: 500,
        minPurchaseForEarningEnabled: true,
        minPurchaseForEarning: 100,
        minPurchaseForRedemptionEnabled: true,
        minPurchaseForRedemption: 200,
        redemptionBalanceLimitEnabled: true,
        redemptionBalanceLimitAmount: null,
        redemptionBalanceLimitPercentage: 50,
        redemptionBillLimitEnabled: true,
        redemptionBillLimitAmount: null,
        redemptionBillLimitPercentage: 20,
        allowSameBillRedemption: false,
      };
    case "TIER":
      return {
        ...base,
        pointsPerRupee: 1,
        onFinalAmount: true,
        allowSameBillRedemption: false,
        tiers: DEFAULT_TIERS,
      };
    case "AMOUNT_SPENT": {
      const firstStage = createDefaultRewardStage({}, 0);
      const secondStage = getNextRewardStage(firstStage, 1);
      return {
        ...base,
        pointsPerRupee: 1,
        onFinalAmount: true,
        maxPointsPerPurchase: 1000,
        allowSameBillRedemption: true,
        pointsPerVisit: 1,
        visitIntervalEnabled: false,
        visitIntervalValue: null,
        visitIntervalUnit: null,
        rewardStages: [firstStage, secondStage],
      };
    }
    case "VISIT_MADE": {
      const firstStage = createDefaultRewardStage(
        {
          ...DEFAULT_REWARD_STAGE,
          pointsRequired: 50,
          rewardName: "5% off",
        },
        0,
      );
      const secondStage = getNextRewardStage(firstStage, 1);
      return {
        ...base,
        pointsPerRupee: 1,
        onFinalAmount: false,
        maxPointsPerPurchase: null,
        pointsPerVisit: 10,
        visitIntervalEnabled: true,
        visitIntervalValue: 1,
        visitIntervalUnit: "DAY",
        allowSameBillRedemption: true,
        rewardStages: [firstStage, secondStage],
      };
    }
    default:
      return base;
  }
}
