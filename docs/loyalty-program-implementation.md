# Loyalty Program — End-to-End Implementation Guide

This document describes how the codebase implements the four loyalty types: **CASHBACK**, **TIER**, **AMOUNT_SPENT**, and **VISIT_MADE**. It covers config variables, storage, flows, and edge cases.

---

## 1. Overview of the Four Loyalty Types

| Type             | What customer earns                                           | Where it's stored                                                       | Redemption                                        |
| ---------------- | ------------------------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------- |
| **CASHBACK**     | Cashback (₹) per bill at a fixed %                            | `CashbackTransaction` + `BusinessCustomer.totalCashbackEarned/Redeemed` | Redeem ₹ from wallet as discount on bill          |
| **TIER**         | Cashback (₹) per bill at tier’s % (tier from lifetime spend)  | Same as CASHBACK                                                        | Same as CASHBACK; tier’s min/max apply            |
| **AMOUNT_SPENT** | Points per rupee spent on **this bill**                       | `PointsTransaction` + `BusinessCustomer.pointsBalance`                  | Redeem points (1 pt = ₹1 discount); FIFO + expiry |
| **VISIT_MADE**   | Points per **qualifying visit** (1 bill = 1 visit by default) | Same as AMOUNT_SPENT                                                    | Same; reward stages define thresholds             |

---

## 2. Config Variable Usage Matrix

**Yes** = used in earning or redemption logic. **No** = present in schema but not used in current logic. **N/A** = not applicable for that type.

| Config / variable                                                               | CASHBACK                         | TIER                             | AMOUNT_SPENT     | VISIT_MADE       |
| ------------------------------------------------------------------------------- | -------------------------------- | -------------------------------- | ---------------- | ---------------- |
| **Earning base amount**                                                         |                                  |                                  |                  |                  |
| `onFinalAmount`                                                                 | Yes                              | Yes                              | Yes              | N/A              |
| `billSubtotal` / `billAmount` / `finalAmount`                                   | Yes (via amountForEarning)       | Yes                              | Yes              | N/A              |
| **Earning limits / gates**                                                      |                                  |                                  |                  |                  |
| `cashbackPercentage`                                                            | Yes                              | N/A (per tier)                   | N/A              | N/A              |
| `minPurchaseForEarningEnabled` + `minPurchaseForEarning`                        | Yes                              | N/A                              | N/A              | N/A              |
| `maxCashbackCap`                                                                | Yes                              | N/A (per tier)                   | N/A              | N/A              |
| **Per-tier (TIER only)**                                                        |                                  |                                  |                  |                  |
| `minLifetimeSpend` / `maxLifetimeSpend`                                         | N/A                              | Yes (tier resolution)            | N/A              | N/A              |
| `cashbackPercentage` (per tier)                                                 | N/A                              | Yes                              | N/A              | N/A              |
| `minPurchaseForRedemptionEnabled` + `minPurchaseForRedemption` (per tier)       | N/A                              | Yes (earn + redeem)              | N/A              | N/A              |
| `maxCashbackCapEnabled` + `maxCashbackCap` (per tier)                           | N/A                              | Yes                              | N/A              | N/A              |
| **Points earning**                                                              |                                  |                                  |                  |                  |
| `pointsPerRupee`                                                                | N/A                              | N/A (fallback only when no tier) | Yes              | N/A              |
| `maxPointsPerPurchase`                                                          | N/A                              | N/A                              | Yes              | N/A              |
| `pointsPerVisit`                                                                | N/A                              | N/A                              | N/A              | Yes              |
| `visitIntervalEnabled` + `visitIntervalValue` + `visitIntervalUnit`             | N/A                              | N/A                              | N/A              | Yes              |
| **Redemption (cashback types)**                                                 |                                  |                                  |                  |                  |
| `minPurchaseForRedemptionEnabled` + `minPurchaseForRedemption`                  | Yes                              | Yes (per tier)                   | N/A              | N/A              |
| `redemptionBalanceLimitEnabled` + `redemptionBalanceLimitAmount` / `Percentage` | Yes                              | No\*                             | N/A              | N/A              |
| `redemptionBillLimitEnabled` + `redemptionBillLimitAmount` / `Percentage`       | Yes                              | No\*                             | N/A              | N/A              |
| **Redemption (points types)**                                                   |                                  |                                  |                  |                  |
| 1 pt = ₹1 discount                                                              | N/A                              | N/A                              | Yes              | Yes              |
| **Expiry**                                                                      |                                  |                                  |                  |                  |
| `pointExpiryDays` (Loyalty)                                                     | N/A (cashback no expiry in code) | N/A                              | Yes              | Yes              |
| **Reward stages**                                                               |                                  |                                  |                  |                  |
| `rewardStages` (pointsRequired, rewardType, etc.)                               | N/A                              | N/A                              | Display only\*\* | Display only\*\* |

\* TIER redemption uses only balance, bill amount, and tier’s `minPurchaseForRedemption`; no balance/bill limit caps.  
\*\* Reward stages are not used for actual redemption logic; redemption is flat “X points = ₹X discount”.

---

## 3. Where We Store Points vs Cashback — Tables and Fields

### 3.1 Cashback (CASHBACK + TIER only)

| What                    | Where                                                                       | When                                  |
| ----------------------- | --------------------------------------------------------------------------- | ------------------------------------- |
| **Each earn event**     | `CashbackTransaction`: `amount` > 0, `source = BILL`                        | After bill; cashback earned this bill |
| **Each redeem event**   | `CashbackTransaction`: `amount` < 0, `source = REDEEMED`                    | When customer uses wallet on bill     |
| **Running “wallet”**    | `BusinessCustomer.totalCashbackEarned`, `totalCashbackRedeemed`             | Updated on every earn/redeem          |
| **Balance**             | `totalCashbackEarned - totalCashbackRedeemed`                               | Read for redeemable cap and UI        |
| **This bill’s amounts** | `Bill.cashbackAmount`, `Bill.cashbackRedeemedAmount`, `Bill.userPaidAmount` | After `applyLoyaltyForBill`           |

### 3.2 Points (AMOUNT_SPENT + VISIT_MADE only)

| What                | Where                                                                                      | When                                                     |
| ------------------- | ------------------------------------------------------------------------------------------ | -------------------------------------------------------- |
| **Each earn**       | `PointsTransaction`: `type = EARNED`, `amount` > 0, `remainingAmount`, `expiresAt`         | After bill (and other sources: feedback, campaign, etc.) |
| **Each redeem**     | `PointsTransaction`: `type = REDEEMED`, `amount` < 0                                       | When customer redeems points on bill (FIFO)              |
| **Expiry**          | `PointsTransaction`: `type = EXPIRED`, `amount` < 0; EARNED rows get `remainingAmount = 0` | Cron / `expireBucketsForCustomer`                        |
| **Running balance** | `BusinessCustomer.pointsBalance`                                                           | Updated on every earn/redeem/expire                      |
| **FIFO**            | `PointsTransaction.remainingAmount` on EARNED rows, ordered by `expiresAt`                 | Redemption and expiry consume oldest first               |

### 3.3 Other fields used by loyalty

| Field                            | Used by    | Purpose                                         |
| -------------------------------- | ---------- | ----------------------------------------------- |
| `BusinessCustomer.lifetimeSpend` | TIER       | Tier resolution (`resolveTierForLifetimeSpend`) |
| `BusinessCustomer.currentTierId` | TIER       | Current tier for UI / APIs                      |
| `BusinessCustomer.visitCount`    | VISIT_MADE | Qualifying visits (and display)                 |
| `BusinessCustomer.lastVisitAt`   | VISIT_MADE | Visit interval check (`isVisitQualifying`)      |

---

## 4. End-to-End Flow (Single Bill) — Order of Operations

High-level order in `applyLoyaltyForBill`:

1. **Expire points** (points types only): `expireBucketsForCustomer` so balance is up to date.
2. **Load context**: `BusinessCustomer` (pointsBalance, cashback totals, lifetimeSpend, lastVisitAt), resolve tier for TIER.
3. **Redemption (cashback types)**: If CASHBACK/TIER and `redeemCashbackRequested` > 0: apply discount, create `CashbackTransaction` (REDEEMED), increment `totalCashbackRedeemed`, set `finalAmount = billAmount - redeemedCashback`.
4. **Redemption (points types)**: If AMOUNT_SPENT/VISIT_MADE and `redeemPointsRequested` > 0: FIFO over EARNED rows, decrement `remainingAmount`, create REDEEMED row, update `pointsBalance`, set `finalAmount = billAmount - redeemedPoints`.
5. **Amount for earning**:  
   `amountForEarning = onFinalAmount ? finalAmount : (billSubtotal ?? billAmount)`  
   (So: after redemption for cashback types; subtotal or bill amount when not onFinalAmount.)
6. **Visit check (VISIT_MADE)**: `visitQualifies = isVisitQualifying(config, lastVisitAt)`; only award points if true.
7. **Earning**: `earnedPoints = calculatePointsEarnedForBill(amountForEarning, context, { resolvedTier })`.
8. **Persist earning**:
   - CASHBACK/TIER: create `CashbackTransaction` (BILL), increment `totalCashbackEarned`.
   - AMOUNT_SPENT/VISIT_MADE: create `PointsTransaction` (EARNED), set `expiresAt`/`remainingAmount`, update `pointsBalance`.
9. **TIER / VISIT_MADE**: Update `lifetimeSpend += billAmount`; for TIER also `visitCount`, `lastVisitAt`, `currentTierId`; for VISIT_MADE (if visitQualifies) `visitCount`, `lastVisitAt`.

---

## 5. Flow and Code Snippets by Loyalty Type

### 5.1 CASHBACK

- **Earning base**: `onFinalAmount` → use `finalAmount` (after any cashback redemption); else `billSubtotal` or `billAmount`.
- **Earn formula**: `min(cashbackPercentage% of amountForEarning, maxCashbackCap)`; if `minPurchaseForEarningEnabled` and bill < min → 0.
- **Redemption**: Cap by balance, `minPurchaseForRedemption`, and (if enabled) balance limit and bill limit.

```ts
// Earning: lib/loyalty/helpers.ts
function calculateCashbackEarned(
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
  return Math.floor(capped * 100) / 100;
}

// Redeemable cap: same file
function calculateCashbackRedeemable(
  billAmount: number,
  config: CashbackContext,
  balance: number,
): number {
  // ... minPurchaseForRedemption check, then
  // redemptionBalanceLimit*, redemptionBillLimit* applied to cap
  return Math.min(balance, cap, billAmount);
}
```

- **Storage**: Earn → `CashbackTransaction` (BILL) + `totalCashbackEarned` += amount. Redeem → `CashbackTransaction` (REDEEMED) + `totalCashbackRedeemed` += amount.

---

### 5.2 TIER

- **Tier resolution**: From `BusinessCustomer.lifetimeSpend` (before this bill). Contiguous ranges; top tier has no `maxLifetimeSpend`.
- **Earning base**: Same as CASHBACK: `onFinalAmount` ? `finalAmount` : `billSubtotal` ?? `billAmount`.
- **Earn formula**: Resolved tier’s `cashbackPercentage` and `maxCashbackCap`; if tier’s `minPurchaseForRedemptionEnabled` and `amountForEarning < minPurchaseForRedemption` → 0. If no tier (below first tier) → 0.
- **Redemption**: Tier’s `minPurchaseForRedemption` only (no balance/bill limit in code). Cap = min(balance, billAmount).

```ts
// Tier resolution: lib/loyalty/helpers.ts
function resolveTierForLifetimeSpend(
  tiers: ResolvedTier[],
  lifetimeSpend: number,
): ResolvedTier | null {
  // Highest-rank tier: no upper bound. Contiguous: tier[i].max === tier[i+1].min.
  // Returns tier where lifetimeSpend in [minLifetimeSpend, maxLifetimeSpend) or top tier.
}

// Per-tier earning: lib/loyalty/helpers.ts
function calculateTierCashbackEarned(
  amountForEarning: number,
  tier: ResolvedTier,
): number {
  if (amountForEarning <= 0 || tier.cashbackPercentage <= 0) return 0;
  if (
    tier.minPurchaseForRedemptionEnabled &&
    tier.minPurchaseForRedemption != null &&
    amountForEarning < tier.minPurchaseForRedemption
  )
    return 0;
  const raw = (amountForEarning * tier.cashbackPercentage) / 100;
  const capped =
    tier.maxCashbackCapEnabled &&
    tier.maxCashbackCap != null &&
    tier.maxCashbackCap > 0
      ? Math.min(raw, tier.maxCashbackCap)
      : raw;
  return Math.floor(capped * 100) / 100;
}
```

- **After bill**: `lifetimeSpend += billAmount`, `currentTierId` = new tier, `visitCount` and `lastVisitAt` updated.
- **Storage**: Same as CASHBACK (`CashbackTransaction` + `totalCashbackEarned` / `totalCashbackRedeemed`).

---

### 5.3 AMOUNT_SPENT

- **Earning base**: `onFinalAmount` ? `finalAmount` : `billSubtotal` ?? `billAmount`. Points = `amountForEarning * pointsPerRupee`, capped by `maxPointsPerPurchase`.
- **Redemption**: Integer points; 1 pt = ₹1. Redeemable cap = min(pointsBalance, floor(billAmount)). FIFO over EARNED rows.
- **Expiry**: `Loyalty.pointExpiryDays` (or default) → `expiresAt` on EARNED row; expiry job and `expireBucketsForCustomer` zero out `remainingAmount` and create EXPIRED row.

```ts
// Earning: lib/loyalty/helpers.ts — inside calculatePointsEarnedForBill
case "AMOUNT_SPENT": {
  const pts = amountForEarning * (context.config.pointsPerRupee ?? 1);
  const capped = context.config.maxPointsPerPurchase != null && context.config.maxPointsPerPurchase > 0
    ? Math.min(pts, context.config.maxPointsPerPurchase) : pts;
  return Math.floor(capped);
}
```

- **Storage**: Earn → `PointsTransaction` (EARNED, `remainingAmount`, `expiresAt`), `pointsBalance` += amount. Redeem → FIFO decrement `remainingAmount`, new REDEEMED row, `pointsBalance` -= amount.

---

### 5.4 VISIT_MADE

- **Qualifying visit**: `isVisitQualifying(config, lastVisitAt)`: if `visitIntervalEnabled`, require `now - lastVisitAt >= interval` (or first visit). Else every bill counts.
- **Earning**: If visit qualifies, points = `pointsPerVisit` (no amount-based formula).
- **Redemption / expiry / storage**: Same as AMOUNT_SPENT (points ledger, FIFO, expiry).
- **After bill**: If visit qualifies: `visitCount += 1`, `lastVisitAt = now`. `lifetimeSpend` is also incremented (for TIER/VISIT_MADE block) but not used for VISIT_MADE logic.

```ts
// Visit check: lib/loyalty/helpers.ts
function isVisitQualifying(config: VisitMadeContext, lastVisitAt: Date | null): boolean {
  if (!config.visitIntervalEnabled) return true;
  const intervalMs = (value * unitMs); // MINUTE/HOUR/DAY/WEEK/MONTH
  if (!lastVisitAt) return true;
  return Date.now() - lastVisitAt.getTime() >= intervalMs;
}

// Earning: same file — inside calculatePointsEarnedForBill
case "VISIT_MADE": return context.config.pointsPerVisit ?? 1;
```

---

## 6. Edge Cases and Behaviour Summary

| Topic                        | Behaviour                                                                                                                                                                                    |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **onFinalAmount**            | True → earning base = `finalAmount` (after store discount and after any loyalty redemption). False → earning base = `billSubtotal` if provided and > 0, else `billAmount`.                   |
| **Subtotal missing**         | `amountForEarning` falls back to `billAmount` when `billSubtotal` is null or not positive.                                                                                                   |
| **TIER below first tier**    | `resolvedTier = null` → earn 0 cashback (no pointsPerRupee fallback).                                                                                                                        |
| **TIER min for earning**     | Tier’s `minPurchaseForRedemptionEnabled` + `minPurchaseForRedemption` gate **earning**: if `amountForEarning < minPurchaseForRedemption` → 0 cashback.                                       |
| **CASHBACK min for earning** | `minPurchaseForEarningEnabled` + `minPurchaseForEarning`: bill below min → 0 cashback.                                                                                                       |
| **Redemption order**         | Cashback redemption is applied first; then earning uses `finalAmount` when `onFinalAmount` is true.                                                                                          |
| **Points FIFO**              | Redemption and expiry consume oldest EARNED rows first (order by `expiresAt`).                                                                                                               |
| **Expiry**                   | Only points (AMOUNT_SPENT / VISIT_MADE). `pointExpiryDays` from Loyalty; default 180. Cashback has no expiry in code.                                                                        |
| **lifetimeSpend**            | Incremented by `billAmount` (pre-loyalty) for TIER and VISIT_MADE. Used only for TIER tier resolution.                                                                                       |
| **Reward stages**            | Used for UI (e.g. “unlock at X points”). Actual redemption is flat: X points = ₹X discount; stage types (FREE_ITEM, PERCENTAGE_DISCOUNT, CASH_DISCOUNT) are not applied in redemption logic. |

---

## 7. File Reference

| Responsibility                                         | File                                                                                                                                                                      |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Config → context (per type)                            | `lib/actions/loyalty/index.ts` → `getBusinessLoyaltyContext`                                                                                                              |
| Apply to bill (earn + redeem, DB updates)              | `lib/actions/loyalty/index.ts` → `applyLoyaltyForBill`                                                                                                                    |
| Expire points (per customer)                           | `lib/actions/loyalty/index.ts` → `expireBucketsForCustomer`                                                                                                               |
| Earned / redeemable formulas                           | `lib/loyalty/helpers.ts` → `calculatePointsEarnedForBill`, `calculateRedeemable`, `calculateCashbackEarned`, `calculateTierCashbackEarned`, `calculateCashbackRedeemable` |
| Tier resolution / validation                           | `lib/loyalty/helpers.ts` → `resolveTierForLifetimeSpend`, `validateTierRanges`                                                                                            |
| Visit qualification                                    | `lib/loyalty/helpers.ts` → `isVisitQualifying`                                                                                                                            |
| FIFO redemption (points)                               | `lib/actions/loyalty/index.ts` → `allocateRedemptionFIFO`                                                                                                                 |
| Schema (Loyalty, Cashback, Points, Tiers, RewardStage) | `packages/prisma/prisma/models/loyalty.prisma`                                                                                                                            |
| BusinessCustomer loyalty fields                        | `packages/prisma/prisma/models/customer.prisma`                                                                                                                           |

---

## 8. Quick Checklist: All Four Types Behaving as Designed

- **CASHBACK**: Single % and cap; min for earn; min + balance/bill limits for redeem; cashback stored and redeemed from wallet; no points, no expiry.
- **TIER**: Tier from lifetime spend; per-tier % and cap; per-tier min for earn and for redeem; same cashback storage as CASHBACK; lifetimeSpend and currentTierId updated.
- **AMOUNT_SPENT**: Points from bill amount (onFinalAmount/subtotal); cap per purchase; points ledger with FIFO and expiry; redeem X pts = ₹X.
- **VISIT_MADE**: Points per qualifying visit (interval optional); same points ledger and redemption as AMOUNT_SPENT; visitCount and lastVisitAt updated when visit qualifies.
