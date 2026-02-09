/**
 * Loyalty helpers — type-aware utilities for the 4 loyalty types.
 * CASHBACK: Instant cashback (₹), stored like points (1 unit = ₹1).
 * TIER: Lifetime spend tiers, % cashback per tier.
 * AMOUNT_SPENT: Points per bill amount, redeem via reward stages.
 * VISIT_MADE: Points per visit, redeem via reward stages.
 */

const VISIT_INTERVAL_MS: Record<string, number> = {
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
  MONTH: 30 * 24 * 60 * 60 * 1000,
};

export const DEFAULT_POINT_EXPIRY_DAYS = 180;

export type LoyaltyContext =
  | { type: "CASHBACK"; config: CashbackContext }
  | { type: "TIER"; config: TierContext }
  | { type: "AMOUNT_SPENT"; config: AmountSpentContext }
  | { type: "VISIT_MADE"; config: VisitMadeContext };

export interface CashbackContext {
  cashbackPercentage: number;
  onFinalAmount: boolean;
  maxCashbackCap: number | null;
  minPurchaseForEarningEnabled: boolean;
  minPurchaseForEarning: number | null;
  minPurchaseForRedemptionEnabled: boolean;
  minPurchaseForRedemption: number | null;
  redemptionBalanceLimitEnabled: boolean;
  redemptionBalanceLimitAmount: number | null;
  redemptionBalanceLimitPercentage: number | null;
  redemptionBillLimitEnabled: boolean;
  redemptionBillLimitAmount: number | null;
  redemptionBillLimitPercentage: number | null;
  pointExpiryDays: number | null;
}

export interface TierContext {
  pointsPerRupee: number;
  tiers: Array<{
    id: string;
    name: string;
    rank: number;
    minLifetimeSpend: number;
    maxLifetimeSpend: number | null;
    cashbackPercentage: number;
    minPurchaseForRedemptionEnabled: boolean;
    minPurchaseForRedemption: number | null;
    maxCashbackCapEnabled: boolean;
    maxCashbackCap: number | null;
  }>;
  pointExpiryDays: number | null;
}

export interface AmountSpentContext {
  pointsPerRupee: number;
  onFinalAmount: boolean;
  maxPointsPerPurchase: number | null;
  pointExpiryDays: number | null;
}

export interface VisitMadeContext {
  pointsPerVisit: number;
  visitIntervalEnabled: boolean;
  visitIntervalValue: number | null;
  visitIntervalUnit: string | null;
  pointExpiryDays: number | null;
}

export function getExpiryDays(
  pointExpiryDays: number | null | undefined,
): number {
  return pointExpiryDays && pointExpiryDays > 0
    ? pointExpiryDays
    : DEFAULT_POINT_EXPIRY_DAYS;
}

export type ResolvedTier = TierContext["tiers"][number];

/** Minimal tier shape for validation (server + client). */
export interface TierRangeInput {
  rank: number;
  minLifetimeSpend: number;
  maxLifetimeSpend: number | null | undefined;
}

export interface ValidateTierRangesResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate tier ranges: no negative values, no overlaps, contiguous (tier[i].max === tier[i+1].min).
 * Highest-rank tier's max is optional (leave empty; all customers with spend >= its min stay in that tier).
 * Use on both client (form) and server (API create/update).
 */
export function validateTierRanges(
  tiers: TierRangeInput[],
): ValidateTierRangesResult {
  const errors: string[] = [];
  if (tiers.length === 0) {
    return { valid: false, errors: ["At least one tier is required."] };
  }
  const sorted = [...tiers].sort((a, b) => a.rank - b.rank);

  for (let i = 0; i < sorted.length; i++) {
    const t = sorted[i];
    if (t == null) continue;
    const min = Number(t.minLifetimeSpend);
    const max = t.maxLifetimeSpend != null ? Number(t.maxLifetimeSpend) : null;
    if (min < 0) {
      errors.push(
        `Tier (rank ${t.rank}): min lifetime spend cannot be negative.`,
      );
    }
    if (max != null && max < 0) {
      errors.push(
        `Tier (rank ${t.rank}): max lifetime spend cannot be negative.`,
      );
    }
    const isLastTier = i === sorted.length - 1;
    if (!isLastTier) {
      if (max == null) {
        errors.push(
          `Tier (rank ${t.rank}): max lifetime spend is required (leave empty only for the top/highest tier).`,
        );
      } else if (min >= max) {
        errors.push(
          `Tier (rank ${t.rank}): min must be less than max (min: ${min}, max: ${max}).`,
        );
      }
      const next = sorted[i + 1];
      if (next != null && max != null) {
        const nextMin = Number(next.minLifetimeSpend);
        if (nextMin !== max) {
          errors.push(
            `Tiers must be contiguous: tier (rank ${t.rank}) max (${max}) should equal next tier min (${nextMin}).`,
          );
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/** Resolve which tier the customer belongs to based on lifetime spend. Highest-rank tier has no upper bound (spend >= its min keeps customer in that tier). */
export function resolveTierForLifetimeSpend(
  tiers: ResolvedTier[],
  lifetimeSpend: number,
): ResolvedTier | null {
  if (tiers.length === 0) return null;
  const maxRank = Math.max(...tiers.map((t) => t.rank));
  let best: ResolvedTier | null = null;
  for (const t of tiers) {
    if (lifetimeSpend < t.minLifetimeSpend) continue;
    // Highest-rank tier: no upper bound (ignore maxLifetimeSpend so customers above max still get top tier).
    if (
      t.rank < maxRank &&
      t.maxLifetimeSpend != null &&
      lifetimeSpend >= t.maxLifetimeSpend
    ) {
      continue;
    }
    if (!best || t.rank > best.rank) best = t;
  }
  // Fallback: first tier (lowest rank) when no tier matched (e.g. new customer at 0).
  if (!best) {
    const first = tiers.reduce((a, b) => (a.rank <= b.rank ? a : b));
    if (lifetimeSpend >= first.minLifetimeSpend) best = first;
  }
  return best;
}

/** TIER: Earned cashback (₹) using tier's cashbackPercentage. Bill still counts toward lifetime spend; cashback only when bill >= min purchase for redemption (when enabled). */
export function calculateTierCashbackEarned(
  amountForEarning: number,
  tier: ResolvedTier,
): number {
  if (amountForEarning <= 0 || tier.cashbackPercentage <= 0) return 0;
  if (
    tier.minPurchaseForRedemptionEnabled &&
    tier.minPurchaseForRedemption != null &&
    amountForEarning < tier.minPurchaseForRedemption
  ) {
    return 0;
  }
  const raw = (amountForEarning * tier.cashbackPercentage) / 100;
  const capped =
    tier.maxCashbackCapEnabled &&
    tier.maxCashbackCap != null &&
    tier.maxCashbackCap > 0
      ? Math.min(raw, tier.maxCashbackCap)
      : raw;
  return Math.floor(capped * 100) / 100;
}

/** Check if a visit qualifies (enough time passed since last visit, or first visit). */
export function isVisitQualifying(
  config: VisitMadeContext,
  lastVisitAt: Date | null,
): boolean {
  if (!config.visitIntervalEnabled) return true;
  const value = config.visitIntervalValue ?? 1;
  const unit = config.visitIntervalUnit ?? "DAY";
  const DEFAULT_DAY_MS = 24 * 60 * 60 * 1000;
  const rawMs = unit
    ? VISIT_INTERVAL_MS[unit as keyof typeof VISIT_INTERVAL_MS]
    : undefined;
  const unitMs = Number(rawMs ?? DEFAULT_DAY_MS);
  const intervalMs = unitMs * value;
  if (!lastVisitAt) return true;
  return Date.now() - lastVisitAt.getTime() >= intervalMs;
}

/** CASHBACK: Earned amount (₹) from bill. 1 unit = ₹1. */
export function calculateCashbackEarned(
  billAmount: number,
  config: CashbackContext,
): number {
  if (billAmount <= 0 || config.cashbackPercentage <= 0) return 0;
  if (
    config.minPurchaseForEarningEnabled &&
    config.minPurchaseForEarning != null
  ) {
    if (billAmount < config.minPurchaseForEarning) return 0;
  }
  const raw = (billAmount * config.cashbackPercentage) / 100;
  const capped =
    config.maxCashbackCap != null && config.maxCashbackCap > 0
      ? Math.min(raw, config.maxCashbackCap)
      : raw;
  return Math.floor(capped * 100) / 100; // 2 decimal places
}

/** CASHBACK: Max redeemable (₹) on this bill from balance. */
export function calculateCashbackRedeemable(
  billAmount: number,
  config: CashbackContext,
  balance: number,
): number {
  if (billAmount <= 0 || balance <= 0) return 0;
  if (
    config.minPurchaseForRedemptionEnabled &&
    config.minPurchaseForRedemption != null
  ) {
    if (billAmount < config.minPurchaseForRedemption) return 0;
  }
  let cap = balance;
  if (config.redemptionBalanceLimitEnabled) {
    if (config.redemptionBalanceLimitAmount != null)
      cap = Math.min(cap, config.redemptionBalanceLimitAmount);
    if (config.redemptionBalanceLimitPercentage != null)
      cap = Math.min(
        cap,
        (balance * config.redemptionBalanceLimitPercentage) / 100,
      );
  }
  if (config.redemptionBillLimitEnabled) {
    if (config.redemptionBillLimitAmount != null)
      cap = Math.min(cap, config.redemptionBillLimitAmount);
    if (config.redemptionBillLimitPercentage != null)
      cap = Math.min(
        cap,
        (billAmount * config.redemptionBillLimitPercentage) / 100,
      );
  }
  return Math.min(balance, cap, billAmount);
}

export interface CalculateEarnedOptions {
  /** Resolved tier for TIER type (from lifetimeSpend). When provided, uses tier's cashbackPercentage. */
  resolvedTier?: ResolvedTier | null;
}

/**
 * Earned value for a bill. For CASHBACK: returns ₹ (cashback amount).
 * For TIER: returns ₹ (cashback) using tier's % when resolvedTier provided.
 * For AMOUNT_SPENT/VISIT_MADE: returns points (integer).
 */
export function calculatePointsEarnedForBill(
  amountForEarning: number,
  context: LoyaltyContext,
  options?: CalculateEarnedOptions,
): number {
  if (amountForEarning <= 0) return 0;

  switch (context.type) {
    case "CASHBACK":
      // Cashback stored as integer rupees (100 = ₹100)
      return Math.floor(
        calculateCashbackEarned(amountForEarning, context.config),
      );
    case "TIER": {
      const tier = options?.resolvedTier;
      if (tier) {
        const cashback = calculateTierCashbackEarned(amountForEarning, tier);
        return Math.floor(cashback);
      }
      // Fallback when tier not resolved (e.g. preview): use pointsPerRupee only (no global cap).
      const pointsPerRupee = context.config.pointsPerRupee ?? 1;
      return Math.floor(amountForEarning * pointsPerRupee);
    }
    case "AMOUNT_SPENT": {
      const pts = amountForEarning * (context.config.pointsPerRupee ?? 1);
      const capped =
        context.config.maxPointsPerPurchase != null &&
        context.config.maxPointsPerPurchase > 0
          ? Math.min(pts, context.config.maxPointsPerPurchase)
          : pts;
      return Math.floor(capped);
    }
    case "VISIT_MADE":
      return context.config.pointsPerVisit ?? 1;
    default:
      return 0;
  }
}

export interface CalculateRedeemableOptions {
  /** Resolved tier for TIER type. When provided, enforces tier's minPurchaseForRedemption. */
  resolvedTier?: ResolvedTier | null;
}

/** Max redeemable on this bill. For CASHBACK: ₹. For points types: points (1 pt = ₹1 discount). */
export function calculateRedeemable(
  billAmount: number,
  balance: number,
  context: LoyaltyContext,
  options?: CalculateRedeemableOptions,
): number {
  if (billAmount <= 0 || balance <= 0) return 0;
  if (context.type === "CASHBACK") {
    return (
      Math.floor(
        calculateCashbackRedeemable(billAmount, context.config, balance) * 100,
      ) / 100
    );
  }
  if (context.type === "TIER" && options?.resolvedTier) {
    const tier = options.resolvedTier;
    if (
      tier.minPurchaseForRedemptionEnabled &&
      tier.minPurchaseForRedemption != null
    ) {
      if (billAmount < tier.minPurchaseForRedemption) return 0;
    }
  }
  return Math.min(balance, Math.floor(billAmount));
}
