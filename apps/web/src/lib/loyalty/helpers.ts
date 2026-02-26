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

/** Top tier upper limit when left empty — ensures customers above config never fall out of tier. */
export const TIER_TOP_MAX_LIFETIME_SPEND = 10_000_000;

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
  allowSameBillRedemption: boolean;
}

export interface TierContext {
  pointsPerRupee: number;
  onFinalAmount: boolean;
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
  allowSameBillRedemption: boolean;
}

export interface AmountSpentContext {
  pointsPerRupee: number;
  onFinalAmount: boolean;
  maxPointsPerPurchase: number | null;
  pointExpiryDays: number | null;
  allowSameBillRedemption: boolean;
}

export interface VisitMadeContext {
  pointsPerVisit: number;
  visitIntervalEnabled: boolean;
  visitIntervalValue: number | null;
  visitIntervalUnit: string | null;
  pointExpiryDays: number | null;
  allowSameBillRedemption: boolean;
}

/** Raw loyalty record shape (from Prisma findUnique/findFirst). */
export interface LoyaltyRecordInput {
  loyaltyType: string;
  pointExpiryDays?: number | null;
  cashbackConfig?: {
    cashbackPercentage?: number | null;
    onFinalAmount?: boolean | null;
    maxCashbackCap?: number | null;
    minPurchaseForEarningEnabled?: boolean | null;
    minPurchaseForEarning?: number | null;
    minPurchaseForRedemptionEnabled?: boolean | null;
    minPurchaseForRedemption?: number | null;
    redemptionBalanceLimitEnabled?: boolean | null;
    redemptionBalanceLimitAmount?: number | null;
    redemptionBalanceLimitPercentage?: number | null;
    redemptionBillLimitEnabled?: boolean | null;
    redemptionBillLimitAmount?: number | null;
    redemptionBillLimitPercentage?: number | null;
    allowSameBillRedemption?: boolean | null;
  } | null;
  tierConfig?: {
    pointsPerRupee?: number | null;
    onFinalAmount?: boolean | null;
    allowSameBillRedemption?: boolean | null;
    tiers?: Array<{
      id: string;
      name: string;
      rank: number;
      minLifetimeSpend: number;
      maxLifetimeSpend: number | null;
      cashbackPercentage?: number | null;
      minPurchaseForRedemptionEnabled?: boolean | null;
      minPurchaseForRedemption?: number | null;
      maxCashbackCapEnabled?: boolean | null;
      maxCashbackCap?: number | null;
    }>;
  } | null;
  amountSpentConfig?: {
    pointsPerRupee?: number | null;
    onFinalAmount?: boolean | null;
    maxPointsPerPurchase?: number | null;
    allowSameBillRedemption?: boolean | null;
  } | null;
  visitMadeConfig?: {
    pointsPerVisit?: number | null;
    visitIntervalEnabled?: boolean | null;
    visitIntervalValue?: number | null;
    visitIntervalUnit?: string | null;
    allowSameBillRedemption?: boolean | null;
  } | null;
}

/** Build LoyaltyContext from a Prisma loyalty record. Shared by actions and redeem-info. */
export function loyaltyRecordToContext(
  loyalty: LoyaltyRecordInput | null,
): LoyaltyContext | null {
  if (!loyalty) return null;
  const cc = loyalty.cashbackConfig;
  const tc = loyalty.tierConfig;
  const ac = loyalty.amountSpentConfig;
  const vc = loyalty.visitMadeConfig;

  switch (loyalty.loyaltyType) {
    case "CASHBACK":
      if (!cc) return null;
      return {
        type: "CASHBACK",
        config: {
          cashbackPercentage: cc.cashbackPercentage ?? 0,
          onFinalAmount: cc.onFinalAmount ?? false,
          maxCashbackCap: cc.maxCashbackCap ?? null,
          minPurchaseForEarningEnabled:
            cc.minPurchaseForEarningEnabled ?? false,
          minPurchaseForEarning: cc.minPurchaseForEarning ?? null,
          minPurchaseForRedemptionEnabled:
            cc.minPurchaseForRedemptionEnabled ?? false,
          minPurchaseForRedemption: cc.minPurchaseForRedemption ?? null,
          redemptionBalanceLimitEnabled:
            cc.redemptionBalanceLimitEnabled ?? false,
          redemptionBalanceLimitAmount: cc.redemptionBalanceLimitAmount ?? null,
          redemptionBalanceLimitPercentage:
            cc.redemptionBalanceLimitPercentage ?? null,
          redemptionBillLimitEnabled: cc.redemptionBillLimitEnabled ?? false,
          redemptionBillLimitAmount: cc.redemptionBillLimitAmount ?? null,
          redemptionBillLimitPercentage:
            cc.redemptionBillLimitPercentage ?? null,
          pointExpiryDays: loyalty.pointExpiryDays ?? null,
          allowSameBillRedemption: cc.allowSameBillRedemption ?? false,
        },
      };
    case "TIER":
      if (!tc?.tiers) return null;
      return {
        type: "TIER",
        config: {
          pointsPerRupee: tc.pointsPerRupee ?? 1,
          onFinalAmount: tc.onFinalAmount ?? false,
          tiers: tc.tiers.map((t) => ({
            id: t.id,
            name: t.name,
            rank: t.rank,
            minLifetimeSpend: t.minLifetimeSpend,
            maxLifetimeSpend: t.maxLifetimeSpend,
            cashbackPercentage: t.cashbackPercentage ?? 0,
            minPurchaseForRedemptionEnabled:
              t.minPurchaseForRedemptionEnabled ?? false,
            minPurchaseForRedemption: t.minPurchaseForRedemption ?? null,
            maxCashbackCapEnabled: t.maxCashbackCapEnabled ?? false,
            maxCashbackCap: t.maxCashbackCap ?? null,
          })),
          pointExpiryDays: loyalty.pointExpiryDays ?? null,
          allowSameBillRedemption: tc.allowSameBillRedemption ?? false,
        },
      };
    case "AMOUNT_SPENT":
      if (!ac) return null;
      return {
        type: "AMOUNT_SPENT",
        config: {
          pointsPerRupee: ac.pointsPerRupee ?? 1,
          onFinalAmount: ac.onFinalAmount ?? false,
          maxPointsPerPurchase: ac.maxPointsPerPurchase ?? null,
          pointExpiryDays: loyalty.pointExpiryDays ?? null,
          allowSameBillRedemption: ac.allowSameBillRedemption ?? true,
        },
      };
    case "VISIT_MADE":
      if (!vc) return null;
      return {
        type: "VISIT_MADE",
        config: {
          pointsPerVisit: vc.pointsPerVisit ?? 1,
          visitIntervalEnabled: vc.visitIntervalEnabled ?? false,
          visitIntervalValue: vc.visitIntervalValue ?? null,
          visitIntervalUnit: vc.visitIntervalUnit ?? null,
          pointExpiryDays: loyalty.pointExpiryDays ?? null,
          allowSameBillRedemption: vc.allowSameBillRedemption ?? true,
        },
      };
    default:
      return null;
  }
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
 * Validate tier ranges: no negative values, min < max, and no overlaps (gaps allowed).
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
        if (max > nextMin) {
          errors.push(
            `Tiers must not overlap: tier (rank ${t.rank}) max (${max}) must be less than or equal to next tier min (${nextMin}).`,
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

/** Resolve which tier the customer belongs to based on lifetime spend. Highest-rank tier has no upper bound (spend >= its min keeps customer in that tier). When ranges overlap, returns the tier with the lower cashback (conservative). */
export function resolveTierForLifetimeSpend(
  tiers: ResolvedTier[],
  lifetimeSpend: number,
): ResolvedTier | null {
  if (tiers.length === 0) return null;
  const maxRank = Math.max(...tiers.map((t) => t.rank));
  const matching: ResolvedTier[] = [];
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
    matching.push(t);
  }
  if (matching.length === 0) {
    const first = tiers.reduce((a, b) => (a.rank <= b.rank ? a : b));
    if (lifetimeSpend >= first.minLifetimeSpend) return first;
    return null;
  }
  // When multiple tiers match (e.g. overlapping ranges), use the one with lower cashback (conservative).
  return matching.reduce((a, b) =>
    a.cashbackPercentage < b.cashbackPercentage
      ? a
      : a.cashbackPercentage > b.cashbackPercentage
        ? b
        : a.rank <= b.rank
          ? a
          : b,
  );
}

/** TIER: Earned cashback (₹) using tier's cashbackPercentage. minPurchaseForRedemption applies to redemption only, not earning. */
export function calculateTierCashbackEarned(
  amountForEarning: number,
  tier: ResolvedTier,
): number {
  if (amountForEarning <= 0 || tier.cashbackPercentage <= 0) return 0;
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
  const unitMs = VISIT_INTERVAL_MS[unit as keyof typeof VISIT_INTERVAL_MS];
  if (unitMs == null || unitMs <= 0) {
    // Unknown visitIntervalUnit: treat as 1 day (explicit fallback; validate at save time).
    const fallbackMs = 24 * 60 * 60 * 1000;
    const intervalMs = fallbackMs * value;
    if (!lastVisitAt) return true;
    return Date.now() - lastVisitAt.getTime() >= intervalMs;
  }
  const intervalMs = unitMs * value;
  if (!lastVisitAt) return true;
  return Date.now() - lastVisitAt.getTime() >= intervalMs;
}

/**
 * Amount to use for earning calc.
 * - CASHBACK/TIER: When redemption was applied (finalAmount < billAmount), or when the chosen base
 *   would exceed amount-to-pay (e.g. redeem-info passes billAmount=amountToPay, billSubtotal=pre-redemption):
 *   use finalAmount (amount to pay) so cashback is earned on what the customer actually pays.
 * - Otherwise: when onFinalAmount use finalAmount; else use subtotal or billAmount.
 */
export function getAmountForEarning(
  context: LoyaltyContext,
  billAmount: number,
  billSubtotal: number | null,
  finalAmount?: number,
): number {
  const isCashbackOrTier =
    context.type === "CASHBACK" || context.type === "TIER";
  const redemptionApplied =
    finalAmount != null && finalAmount > 0 && finalAmount < billAmount;

  if (isCashbackOrTier && redemptionApplied) {
    return safeAmount(finalAmount);
  }

  const useFinal =
    (context.type === "CASHBACK" && context.config.onFinalAmount) ||
    (context.type === "TIER" && context.config.onFinalAmount) ||
    (context.type === "AMOUNT_SPENT" && context.config.onFinalAmount);
  let amt =
    useFinal && finalAmount != null && finalAmount > 0
      ? finalAmount
      : billSubtotal != null && billSubtotal > 0
        ? billSubtotal
        : billAmount;

  // CASHBACK/TIER: never earn on more than amount-to-pay (e.g. redeem-info uses amountToPay as billAmount but subtotal as 1000)
  if (
    isCashbackOrTier &&
    finalAmount != null &&
    finalAmount > 0 &&
    amt > finalAmount
  ) {
    amt = finalAmount;
  }
  return safeAmount(amt);
}

/** Ensure amount is a non-negative finite number; otherwise return 0 (prevents NaN/Infinity abuse). */
export function safeAmount(value: number): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0)
    return 0;
  return value;
}

/**
 * Sum of EARNED CASHBACK amounts from transactions.
 * Use this as the single source of truth for "cashback earned on this bill" in APIs and UI.
 */
export function sumCashbackEarnedFromTransactions(
  transactions: Array<{ type: string; valueKind: string; amount: number }>,
): number {
  return transactions
    .filter((t) => t.type === "EARNED" && t.valueKind === "CASHBACK")
    .reduce((s, t) => s + Math.max(0, Number(t.amount)), 0);
}

/** CASHBACK: Earned amount (₹) from bill. 1 unit = ₹1. */
export function calculateCashbackEarned(
  billAmount: number,
  config: CashbackContext,
): number {
  const amount = safeAmount(billAmount);
  if (amount <= 0 || config.cashbackPercentage <= 0) return 0;
  if (
    config.minPurchaseForEarningEnabled &&
    config.minPurchaseForEarning != null
  ) {
    if (amount < config.minPurchaseForEarning) return 0;
  }
  const raw = (amount * config.cashbackPercentage) / 100;
  const capped =
    config.maxCashbackCap != null && config.maxCashbackCap > 0
      ? Math.min(raw, config.maxCashbackCap)
      : raw;
  return Math.floor(capped * 100) / 100; // 2 decimal places
}

/**
 * CASHBACK: Max redeemable (₹) on this bill from balance.
 * - Same-bill rule: caller must pass balance = available cashback (e.g. wallet minus earned on this bill).
 * - maxCashbackCap: absolute cap on how much can be redeemed per bill (when set).
 * - Wallet limit: when enabled, applies EITHER fixed amount (₹) OR % of balance (0–100), not both.
 * - Bill limit: when enabled, applies EITHER fixed amount (₹) OR % of bill amount (0–100), not both.
 * Final max = min(balance, cap from limits, maxCashbackCap, bill amount).
 */
export function calculateCashbackRedeemable(
  billAmount: number,
  config: CashbackContext,
  balance: number,
): number {
  const amt = safeAmount(billAmount);
  const bal = safeAmount(balance);
  if (amt <= 0 || bal <= 0) return 0;
  if (
    config.minPurchaseForRedemptionEnabled &&
    config.minPurchaseForRedemption != null
  ) {
    if (amt < config.minPurchaseForRedemption) return 0;
  }
  let cap = bal;
  // Wallet limit: mutually exclusive — either fixed amount (₹) or % of balance (config stores 0–100)
  if (config.redemptionBalanceLimitEnabled) {
    if (config.redemptionBalanceLimitAmount != null) {
      cap = Math.min(cap, config.redemptionBalanceLimitAmount);
    } else if (config.redemptionBalanceLimitPercentage != null) {
      const pctCap =
        Math.floor(
          ((bal * config.redemptionBalanceLimitPercentage) / 100) * 100,
        ) / 100;
      cap = Math.min(cap, pctCap);
    }
  }
  // Bill limit: mutually exclusive — either fixed amount (₹) or % of bill (config stores 0–100)
  if (config.redemptionBillLimitEnabled) {
    if (config.redemptionBillLimitAmount != null) {
      cap = Math.min(cap, config.redemptionBillLimitAmount);
    } else if (config.redemptionBillLimitPercentage != null) {
      const billPctCap =
        Math.floor(((amt * config.redemptionBillLimitPercentage) / 100) * 100) /
        100;
      cap = Math.min(cap, billPctCap);
    }
  }
  // Per-bill redemption cap (same as earning cap): max cashback redeemable on one bill
  if (config.maxCashbackCap != null && config.maxCashbackCap > 0) {
    cap = Math.min(cap, config.maxCashbackCap);
  }
  return Math.min(bal, cap, amt);
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
  const amount = safeAmount(amountForEarning);
  if (amount <= 0) return 0;

  switch (context.type) {
    case "CASHBACK":
      // Cashback stored as integer rupees (100 = ₹100)
      return Math.floor(calculateCashbackEarned(amount, context.config));
    case "TIER": {
      const tier = options?.resolvedTier;
      if (tier) {
        const cashback = calculateTierCashbackEarned(amount, tier);
        return Math.floor(cashback);
      }
      // Customer below first tier (e.g. minLifetimeSpend not yet met): no cashback.
      return 0;
    }
    case "AMOUNT_SPENT": {
      const pts = amount * (context.config.pointsPerRupee ?? 1);
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

/** Max redeemable on this bill. For CASHBACK: ₹. For points types: points (1 pt = ₹1 discount). TIER: 0 when no tier resolved. */
export function calculateRedeemable(
  billAmount: number,
  balance: number,
  context: LoyaltyContext,
  options?: CalculateRedeemableOptions,
): number {
  const amt = safeAmount(billAmount);
  const bal = safeAmount(balance);
  if (amt <= 0 || bal <= 0) return 0;
  if (context.type === "CASHBACK") {
    return (
      Math.floor(calculateCashbackRedeemable(amt, context.config, bal) * 100) /
      100
    );
  }
  // TIER: minPurchaseForRedemption and tier's maxCashbackCap (redemption cap per bill) apply.
  if (context.type === "TIER") {
    if (!options?.resolvedTier) return 0;
    const tier = options.resolvedTier;
    if (
      tier.minPurchaseForRedemptionEnabled &&
      tier.minPurchaseForRedemption != null &&
      amt < tier.minPurchaseForRedemption
    ) {
      return 0;
    }
    let cap = Math.min(bal, Math.floor(amt));
    if (
      tier.maxCashbackCapEnabled &&
      tier.maxCashbackCap != null &&
      tier.maxCashbackCap > 0
    ) {
      cap = Math.min(cap, Math.floor(tier.maxCashbackCap * 100) / 100);
    }
    return cap;
  }
  return Math.min(bal, Math.floor(amt));
}
