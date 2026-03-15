import type { LoyaltyProgramFormValues } from "@/lib/schemas/loyalty-form";

export const DEFAULT_LOYALTY_PERCENTAGE = 5;
export const DEFAULT_LOYALTY_CASH_AMOUNT = 100;
export const DEFAULT_LOYALTY_STAGE_POINTS = 100;
export const DEFAULT_LOYALTY_TIER_CASHBACK = 5;
const DEFAULT_TIER_WINDOW_SIZE = 10_000;

export type RewardStageFormValue = NonNullable<
  LoyaltyProgramFormValues["rewardStages"]
>[number];

export interface TierFormValue {
  id?: string;
  name: string;
  rank: number;
  minLifetimeSpend: number;
  maxLifetimeSpend: number | null;
  cashbackPercentage: number;
  minPurchaseForRedemptionEnabled: boolean;
  minPurchaseForRedemption: number | null;
  maxCashbackCapEnabled: boolean;
  maxCashbackCap: number | null;
}

function formatCurrency(value: number) {
  return Number(value).toLocaleString("en-IN");
}

export function deriveRewardStageName(
  stage: Partial<RewardStageFormValue>,
  stageIndex = 0,
) {
  switch (stage.rewardType) {
    case "FREE_ITEM": {
      return stage.freeItemName?.trim() || `Free item ${stageIndex + 1}`;
    }
    case "CASH_DISCOUNT": {
      const amount = Math.max(
        0,
        Number(stage.cashAmount ?? DEFAULT_LOYALTY_CASH_AMOUNT),
      );
      return `Flat Rs ${formatCurrency(amount)} off`;
    }
    case "PERCENTAGE_DISCOUNT":
    default: {
      const percentage = Math.min(
        100,
        Math.max(
          0,
          Number(stage.percentageValue ?? DEFAULT_LOYALTY_PERCENTAGE),
        ),
      );
      return `${percentage}% off`;
    }
  }
}

export function createDefaultRewardStage(
  overrides: Partial<RewardStageFormValue> = {},
  stageIndex = 0,
): RewardStageFormValue {
  const rewardType = overrides.rewardType ?? "PERCENTAGE_DISCOUNT";
  const percentageValue =
    rewardType === "PERCENTAGE_DISCOUNT"
      ? Number(overrides.percentageValue ?? DEFAULT_LOYALTY_PERCENTAGE)
      : (overrides.percentageValue ?? DEFAULT_LOYALTY_PERCENTAGE);
  const cashAmount =
    rewardType === "CASH_DISCOUNT"
      ? Number(overrides.cashAmount ?? DEFAULT_LOYALTY_CASH_AMOUNT)
      : (overrides.cashAmount ?? DEFAULT_LOYALTY_CASH_AMOUNT);
  const freeItemName =
    rewardType === "FREE_ITEM"
      ? overrides.freeItemName?.trim() || `Free item ${stageIndex + 1}`
      : (overrides.freeItemName ?? null);

  const stage: RewardStageFormValue = {
    pointsRequired: Math.max(
      0,
      Number(overrides.pointsRequired ?? DEFAULT_LOYALTY_STAGE_POINTS),
    ),
    rewardType,
    rewardName: "",
    freeItemSkuId: overrides.freeItemSkuId ?? null,
    freeItemName,
    percentageValue,
    appliesToEntirePurchase: overrides.appliesToEntirePurchase ?? true,
    specificProductIds: [...(overrides.specificProductIds ?? [])],
    cashAmount,
    minPurchaseForRedemptionEnabled:
      overrides.minPurchaseForRedemptionEnabled ?? false,
    minPurchaseForRedemption: overrides.minPurchaseForRedemption ?? null,
    maxDiscountCapEnabled: overrides.maxDiscountCapEnabled ?? false,
    maxDiscountCap: overrides.maxDiscountCap ?? null,
  };

  stage.rewardName =
    overrides.rewardName?.trim() || deriveRewardStageName(stage, stageIndex);

  return stage;
}

export function getNextRewardStage(
  previousStage: RewardStageFormValue | undefined,
  stageIndex: number,
): RewardStageFormValue {
  if (!previousStage) return createDefaultRewardStage({}, stageIndex);

  const nextPointsRequired = Math.max(
    DEFAULT_LOYALTY_STAGE_POINTS,
    Number(previousStage.pointsRequired ?? 0) + DEFAULT_LOYALTY_STAGE_POINTS,
  );

  switch (previousStage.rewardType) {
    case "PERCENTAGE_DISCOUNT":
      return createDefaultRewardStage(
        {
          pointsRequired: nextPointsRequired,
          rewardType: "CASH_DISCOUNT",
          cashAmount: Math.max(
            DEFAULT_LOYALTY_CASH_AMOUNT,
            Number(previousStage.cashAmount ?? DEFAULT_LOYALTY_CASH_AMOUNT),
          ),
        },
        stageIndex,
      );
    case "CASH_DISCOUNT":
      return createDefaultRewardStage(
        {
          pointsRequired: nextPointsRequired,
          rewardType: "FREE_ITEM",
          freeItemName: `Free item ${stageIndex + 1}`,
        },
        stageIndex,
      );
    case "FREE_ITEM":
    default:
      return createDefaultRewardStage(
        {
          pointsRequired: nextPointsRequired,
          rewardType: "PERCENTAGE_DISCOUNT",
          percentageValue: Math.min(
            100,
            Math.max(
              DEFAULT_LOYALTY_PERCENTAGE,
              Number(
                previousStage.percentageValue ?? DEFAULT_LOYALTY_PERCENTAGE,
              ) + DEFAULT_LOYALTY_PERCENTAGE,
            ),
          ),
        },
        stageIndex,
      );
  }
}

export function normalizeRewardStageForForm(
  stage: Partial<RewardStageFormValue>,
  stageIndex: number,
): RewardStageFormValue {
  return createDefaultRewardStage(stage, stageIndex);
}

function getDefaultTierMax(rank: number) {
  return rank === 1 ? DEFAULT_TIER_WINDOW_SIZE - 1 : null;
}

export function createDefaultTier(
  rank: number,
  overrides: Partial<TierFormValue> = {},
): TierFormValue {
  return {
    id: overrides.id,
    name: overrides.name?.trim() || `Tier ${rank}`,
    rank,
    minLifetimeSpend: Math.max(
      0,
      Number(
        overrides.minLifetimeSpend ?? (rank - 1) * DEFAULT_TIER_WINDOW_SIZE,
      ),
    ),
    maxLifetimeSpend: overrides.maxLifetimeSpend ?? getDefaultTierMax(rank),
    cashbackPercentage: Math.min(
      100,
      Math.max(
        0,
        Number(overrides.cashbackPercentage ?? DEFAULT_LOYALTY_TIER_CASHBACK),
      ),
    ),
    minPurchaseForRedemptionEnabled:
      overrides.minPurchaseForRedemptionEnabled ?? false,
    minPurchaseForRedemption: overrides.minPurchaseForRedemption ?? null,
    maxCashbackCapEnabled: overrides.maxCashbackCapEnabled ?? false,
    maxCashbackCap: overrides.maxCashbackCap ?? null,
  };
}

export function getClosedTierMax(previousTier: Partial<TierFormValue>) {
  const minLifetimeSpend = Math.max(
    0,
    Number(previousTier.minLifetimeSpend ?? 0),
  );
  const maxLifetimeSpend = previousTier.maxLifetimeSpend;

  if (maxLifetimeSpend != null) return Number(maxLifetimeSpend);
  return minLifetimeSpend + DEFAULT_TIER_WINDOW_SIZE - 1;
}

export function getNextTier(
  previousTier: Partial<TierFormValue> | undefined,
  rank: number,
): TierFormValue {
  if (!previousTier) return createDefaultTier(rank);

  const previousMax = getClosedTierMax(previousTier);
  return createDefaultTier(rank, {
    minLifetimeSpend: previousMax + 1,
    maxLifetimeSpend: null,
    cashbackPercentage: Math.min(
      100,
      Math.max(
        DEFAULT_LOYALTY_TIER_CASHBACK,
        Number(
          previousTier.cashbackPercentage ?? DEFAULT_LOYALTY_TIER_CASHBACK,
        ) + 2,
      ),
    ),
  });
}
