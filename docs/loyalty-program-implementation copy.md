# Loyalty Program — End-to-End Implementation Guide (Detailed)

This document describes how the codebase implements the four loyalty types: **CASHBACK**, **TIER**, **AMOUNT_SPENT**, and **VISIT_MADE**. It covers config variables, storage, flows, edge cases, **model audit**, **vulnerabilities**, and **future breakers**.

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

Exact order in `applyLoyaltyForBill(tx, params)`:

1. **Expire points** (all types): `expireBucketsForCustomer(tx, { businessId, customerId })` — so `pointsBalance` and EARNED rows’ `remainingAmount` are current before any logic.
2. **Load BusinessCustomer**: `pointsBalance`, `totalCashbackEarned`, `totalCashbackRedeemed`, `lifetimeSpend`, `lastVisitAt`.
3. **Resolve tier** (TIER only): `resolveTierForLifetimeSpend(context.config.tiers, bc.lifetimeSpend)` — uses spend **before** this bill.
4. **Compute redeemable**:
   - Cashback types: `calculateRedeemable(billAmount, cashbackBalance, context, { resolvedTier })`.
   - Points types: `calculateRedeemable(billAmount, pointsBalance, context)` → min(balance, floor(billAmount)).
5. **Cap requested redemption**:
   - `redeemedCashback = min(redeemCashbackRequested, redeemable)` (cashback types).
   - `redeemedPoints = min(redeemPointsRequested, floor(redeemable))` (points types).
6. **Apply cashback redemption** (if redeemedCashback > 0):
   - `finalAmount = billAmount - redeemedCashback`.
   - Insert `CashbackTransaction` (amount = -redeemedCashback, source = REDEEMED).
   - `BusinessCustomer.totalCashbackRedeemed += redeemedCashback`.
7. **Apply points redemption** (if redeemedPoints > 0):
   - Load EARNED rows (remainingAmount > 0) ordered by `expiresAt` asc.
   - `allocateRedemptionFIFO(earnedRows, redeemedPoints)` → allocations.
   - Decrement `remainingAmount` on allocated rows; insert REDEEMED row; `pointsBalance -= redeemedPoints`; `finalAmount = billAmount - redeemedPoints`.
8. **Compute amountForEarning**:
   - If (CASHBACK or TIER or AMOUNT_SPENT) and config.onFinalAmount → `finalAmount`.
   - Else → `billSubtotal` if not null and > 0, else `billAmount`.
9. **Visit check** (VISIT_MADE only): `visitQualifies = isVisitQualifying(config, lastVisitAt)`.
10. **Compute earned**: `earnedPoints = visitQualifies ? calculatePointsEarnedForBill(amountForEarning, context, { resolvedTier }) : 0`.
11. **Persist earning**:
    - Cashback types and earnedPoints > 0: insert `CashbackTransaction` (BILL), `totalCashbackEarned += earnedPoints`.
    - Points types and earnedPoints > 0: insert `PointsTransaction` (EARNED, expiresAt, remainingAmount), `pointsBalance += earnedPoints`.
12. **Update TIER/VISIT_MADE**:
    - Always: `lifetimeSpend += billAmount` (for both TIER and VISIT_MADE in current code).
    - TIER: `visitCount += 1`, `lastVisitAt = now`, `currentTierId = newTier.id` (from resolveTierForLifetimeSpend with `lifetimeSpend + billAmount`).
    - VISIT_MADE and visitQualifies: `visitCount += 1`, `lastVisitAt = now`.
13. **Return**: loyaltyType, earnedPoints, redeemedPoints, cashbackAmount, cashbackRedeemedAmount, pointsBalance (effective), finalAmount, tierUpgrade, currentTier.

Caller then updates **Bill**: `cashbackAmount`, `cashbackRedeemedAmount`, `userPaidAmount = loyalty.finalAmount`.

---

## 5. Flow and Code Snippets by Loyalty Type

### 5.1 CASHBACK

- **Earning base**: `onFinalAmount` → `finalAmount` (after any cashback redemption); else `billSubtotal` or `billAmount`.
- **Earn formula**: `min(cashbackPercentage% of amountForEarning, maxCashbackCap)`; if `minPurchaseForEarningEnabled` and amountForEarning < min → 0. Result floored to 2 decimals then **floored to integer** when stored as “earnedPoints” (so fractional rupees are dropped).
- **Redemption**: Cap by balance, `minPurchaseForRedemption`, and (if enabled) `redemptionBalanceLimit*` and `redemptionBillLimit*`.

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

// Redeemable cap: same file — applies balance/bill limits after minPurchaseForRedemption
function calculateCashbackRedeemable(
  billAmount: number,
  config: CashbackContext,
  balance: number,
): number {
  // minPurchaseForRedemption check, then cap = min(balance, redemptionBalanceLimit*, redemptionBillLimit*)
  return Math.min(balance, cap, billAmount);
}
```

- **Storage**: Earn → `CashbackTransaction` (BILL) + `totalCashbackEarned` += amount. Redeem → `CashbackTransaction` (REDEEMED) + `totalCashbackRedeemed` += amount.

---

### 5.2 TIER

- **Tier resolution**: From `BusinessCustomer.lifetimeSpend` (before this bill). Tiers must be contiguous (tier[i].max === tier[i+1].min); top tier has no `maxLifetimeSpend`. Returns null only when customer is below first tier’s `minLifetimeSpend`.
- **Earning base**: Same as CASHBACK.
- **Earn formula**: Resolved tier’s `cashbackPercentage` and `maxCashbackCap`; if tier’s `minPurchaseForRedemptionEnabled` and `amountForEarning < minPurchaseForRedemption` → 0. If no tier (below first tier) → 0.
- **Redemption**: Tier’s `minPurchaseForRedemption` only; no redemptionBalanceLimit/redemptionBillLimit. Cap = min(balance, billAmount).

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
- **Storage**: Same as CASHBACK.

---

### 5.3 AMOUNT_SPENT

- **Earning base**: `onFinalAmount` ? `finalAmount` : `billSubtotal` ?? `billAmount`. Points = floor(amountForEarning \* pointsPerRupee), capped by `maxPointsPerPurchase`.
- **Redemption**: Integer points; 1 pt = ₹1. Redeemable = min(pointsBalance, floor(billAmount)). FIFO over EARNED rows.
- **Expiry**: `Loyalty.pointExpiryDays` (or default 180) → `expiresAt` on EARNED row; `expireBucketsForCustomer` zeros `remainingAmount` and creates EXPIRED row.

```ts
// Earning: lib/loyalty/helpers.ts — inside calculatePointsEarnedForBill
case "AMOUNT_SPENT": {
  const pts = amountForEarning * (context.config.pointsPerRupee ?? 1);
  const capped = context.config.maxPointsPerPurchase != null && context.config.maxPointsPerPurchase > 0
    ? Math.min(pts, context.config.maxPointsPerPurchase) : pts;
  return Math.floor(capped);
}
```

- **Storage**: Earn → `PointsTransaction` (EARNED, remainingAmount, expiresAt), `pointsBalance` += amount. Redeem → FIFO decrement remainingAmount, new REDEEMED row, `pointsBalance` -= amount.

---

### 5.4 VISIT_MADE

- **Qualifying visit**: `isVisitQualifying(config, lastVisitAt)`: if `visitIntervalEnabled`, require `now - lastVisitAt >= interval` (or first visit). Else every bill counts.
- **Earning**: If visit qualifies, points = `pointsPerVisit` (no amount-based formula).
- **Redemption / expiry / storage**: Same as AMOUNT_SPENT.
- **After bill**: If visit qualifies: `visitCount += 1`, `lastVisitAt = now`. `lifetimeSpend` is also incremented (shared block with TIER) but not used for VISIT_MADE logic.

```ts
// Visit check: lib/loyalty/helpers.ts
function isVisitQualifying(config: VisitMadeContext, lastVisitAt: Date | null): boolean {
  if (!config.visitIntervalEnabled) return true;
  const intervalMs = (value * unitMs); // MINUTE/HOUR/DAY/WEEK/MONTH
  if (!lastVisitAt) return true;
  return Date.now() - lastVisitAt.getTime() >= intervalMs;
}
case "VISIT_MADE": return context.config.pointsPerVisit ?? 1;
```

---

## 6. Edge Cases and Behaviour Summary

| Topic                        | Behaviour                                                                                                                                                                  |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **onFinalAmount**            | True → earning base = `finalAmount` (after store discount and after any loyalty redemption). False → earning base = `billSubtotal` if provided and > 0, else `billAmount`. |
| **Subtotal missing**         | `amountForEarning` falls back to `billAmount` when `billSubtotal` is null or not positive.                                                                                 |
| **TIER below first tier**    | `resolvedTier = null` → earn 0 cashback.                                                                                                                                   |
| **TIER min for earning**     | Tier’s `minPurchaseForRedemptionEnabled` + `minPurchaseForRedemption` gate **earning**: if `amountForEarning < minPurchaseForRedemption` → 0 cashback.                     |
| **CASHBACK min for earning** | `minPurchaseForEarningEnabled` + `minPurchaseForEarning`: bill below min → 0 cashback.                                                                                     |
| **Redemption order**         | Cashback redemption is applied first; then earning uses `finalAmount` when `onFinalAmount` is true.                                                                        |
| **Points FIFO**              | Redemption and expiry consume oldest EARNED rows first (order by `expiresAt`).                                                                                             |
| **Expiry**                   | Only points (AMOUNT_SPENT / VISIT_MADE). `pointExpiryDays` from Loyalty; default 180. Cashback has no expiry in code.                                                      |
| **lifetimeSpend**            | Incremented by `billAmount` (pre-loyalty) for TIER and VISIT_MADE. Used only for TIER tier resolution.                                                                     |
| **Reward stages**            | Used for UI. Actual redemption is flat: X points = ₹X discount; FREE_ITEM / PERCENTAGE_DISCOUNT / CASH_DISCOUNT not applied in redemption.                                 |

---

## 7. Deep Dive — amountForEarning and finalAmount in Every Scenario

| Loyalty type | onFinalAmount | Redemption this bill | amountForEarning formula                        | finalAmount after loyalty (for userPaidAmount) |
| ------------ | ------------- | -------------------- | ----------------------------------------------- | ---------------------------------------------- |
| CASHBACK     | true          | None                 | finalAmount ( = billAmount )                    | billAmount - cashbackRedeemed + 0 earned       |
| CASHBACK     | true          | Cashback redeemed    | finalAmount ( = billAmount - redeemedCashback ) | billAmount - redeemedCashback                  |
| CASHBACK     | false         | Any                  | billSubtotal ?? billAmount                      | billAmount - redeemedCashback                  |
| TIER         | same as above | same logic           | same as CASHBACK                                | same                                           |
| AMOUNT_SPENT | true          | None                 | finalAmount ( = billAmount )                    | billAmount - redeemedPoints                    |
| AMOUNT_SPENT | true          | Points redeemed      | finalAmount ( = billAmount - redeemedPoints )   | billAmount - redeemedPoints                    |
| AMOUNT_SPENT | false         | Any                  | billSubtotal ?? billAmount                      | billAmount - redeemedPoints                    |
| VISIT_MADE   | N/A           | Points only          | Not used (points = pointsPerVisit)              | billAmount - redeemedPoints                    |

**Important**: `billAmount` here is the bill total **before** any loyalty (subtotal - storeDiscount + taxSum). So `finalAmount` in step 8 is already reduced by any redemption applied in steps 6–7.

---

## 8. File Reference

| Responsibility                        | File                                                                                   |
| ------------------------------------- | -------------------------------------------------------------------------------------- |
| Config → context (per type)           | `lib/actions/loyalty/index.ts` → `getBusinessLoyaltyContext`                           |
| Apply to bill (earn + redeem, DB)     | `lib/actions/loyalty/index.ts` → `applyLoyaltyForBill`                                 |
| Expire points (per customer)          | `lib/actions/loyalty/index.ts` → `expireBucketsForCustomer`                            |
| Earned / redeemable formulas          | `lib/loyalty/helpers.ts` → `calculatePointsEarnedForBill`, `calculateRedeemable`, etc. |
| Tier resolution / validation          | `lib/loyalty/helpers.ts` → `resolveTierForLifetimeSpend`, `validateTierRanges`         |
| Visit qualification                   | `lib/loyalty/helpers.ts` → `isVisitQualifying`                                         |
| FIFO redemption (points)              | `lib/actions/loyalty/index.ts` → `allocateRedemptionFIFO`                              |
| Schema (Loyalty, Cashback, Points, …) | `packages/prisma/prisma/models/loyalty.prisma`                                         |
| BusinessCustomer loyalty fields       | `packages/prisma/prisma/models/customer.prisma`                                        |

---

## 9. Model Audit — Bill, Customer, Business, BusinessCustomer

### 9.1 Bill (`packages/prisma/prisma/models/bill.prisma`)

| Field                      | Purpose                                                              | Issue / improvement                                                                                                                                                                                                                                                                                              |
| -------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `subtotal`                 | Sum of line items before discount/tax                                | OK.                                                                                                                                                                                                                                                                                                              |
| `storeDiscount`            | Store discount (₹)                                                   | OK.                                                                                                                                                                                                                                                                                                              |
| `tax`                      | Int[] — per-rate tax; sum added to finalAmount                       | OK. Type is Int[]; code sums them.                                                                                                                                                                                                                                                                               |
| `finalAmount`              | subtotal - storeDiscount + sum(tax); before loyalty                  | OK.                                                                                                                                                                                                                                                                                                              |
| `cashbackAmount`           | Cashback **earned** this bill (added to wallet)                      | OK.                                                                                                                                                                                                                                                                                                              |
| `cashbackRedeemedAmount`   | Cashback **redeemed** from wallet this bill                          | OK.                                                                                                                                                                                                                                                                                                              |
| `userPaidAmount`           | What customer pays = finalAmount - cashbackRedeemed - pointsRedeemed | **Gap**: Comment says “after cashback (and points redemption)” but there is **no** `pointsRedeemedAmount` on Bill. For points types, “points redeemed this bill” is only derivable from `PointsTransaction` (REDEEMED + billId). So reporting “discount from points” per bill requires aggregating transactions. |
| `businessId`, `customerId` | Link to BusinessCustomer                                             | OK. Bill create path ensures BusinessCustomer exists.                                                                                                                                                                                                                                                            |

**Improvements / must-fix**

- **Add `pointsRedeemedAmount` (Int? or Float?) on Bill**: When loyalty is AMOUNT_SPENT/VISIT_MADE and points are redeemed, set this on the Bill (same way we set `cashbackRedeemedAmount`). This keeps “discount from points” on the bill for reporting and avoids relying only on PointsTransaction. **Strongly recommended** to avoid future reporting/audit pain.
- **Optional**: Add `loyaltyType` or a small enum on Bill (e.g. CASHBACK / TIER / AMOUNT_SPENT / VISIT_MADE / NONE) so bill list/detail can show loyalty type without joining Loyalty. Not critical if you always have business context.

---

### 9.2 Customer (`packages/prisma/prisma/models/customer.prisma`)

| Field        | Purpose                                | Issue / improvement                           |
| ------------ | -------------------------------------- | --------------------------------------------- |
| `userId`     | Auth (User)                            | OK.                                           |
| `email`      | Real email (User.email is placeholder) | OK.                                           |
| `address*`   | Optional address                       | OK.                                           |
| `businesses` | BusinessCustomer[]                     | All loyalty state is on BusinessCustomer. OK. |

No loyalty-specific fields on Customer; design is correct. **No change required** for loyalty.

---

### 9.3 Business (`packages/prisma/prisma/models/business.prisma`)

| Field                     | Purpose                                 | Issue / improvement                                                              |
| ------------------------- | --------------------------------------- | -------------------------------------------------------------------------------- |
| `defaultPointsName`       | Display name for “points”               | OK.                                                                              |
| `defaultCurrencySymbol`   | e.g. ₹                                  | OK.                                                                              |
| `registrationBonusPoints` | Bonus points on customer registration   | Used in auth/register flow. OK.                                                  |
| `isServiceEnabled`        | Json — toggles (e.g. loyalty, referral) | Loyalty code checks this. OK. Ensure any new loyalty entry points also check it. |
| `loyalty`                 | 1:1 Loyalty (one program per business)  | OK.                                                                              |

**Improvements**

- **Document `isServiceEnabled` shape**: e.g. in a shared type/schema (e.g. `lib/schemas/service-enabled.ts` or similar) so all keys and expected values are in one place. Reduces risk of typos and inconsistent checks.
- No structural change required for loyalty.

---

### 9.4 BusinessCustomer (`packages/prisma/prisma/models/customer.prisma`)

| Field                   | Purpose                                                 | Issue / improvement                                                                                                                                                                                                                                    |
| ----------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `pointsBalance`         | Denormalized points balance (AMOUNT_SPENT / VISIT_MADE) | **Risk**: Source of truth is SUM(PointsTransaction.amount). If any write fails after updating transactions but before updating BusinessCustomer (or vice versa), or if REFUNDED/other types are added without updating balance, **balance can drift**. |
| `lifetimeSpend`         | Cumulative pre-loyalty bill total (TIER)                | **Risk**: Comment says “Source of truth: SUM(Bill.finalAmount)”. If bills are ever voided/refunded without decrementing lifetimeSpend, **tier placement will be wrong**.                                                                               |
| `visitCount`            | Qualifying visits (VISIT_MADE)                          | Same risk if bills are voided without decrementing.                                                                                                                                                                                                    |
| `lastVisitAt`           | Last qualifying visit time                              | OK.                                                                                                                                                                                                                                                    |
| `currentTierId`         | Current LoyaltyTier (TIER)                              | Must be kept in sync when lifetimeSpend changes (today only on new bill).                                                                                                                                                                              |
| `totalCashbackEarned`   | Denormalized cashback earned (CASHBACK / TIER)          | **Risk**: Source of truth is CashbackTransaction. Same drift risk as pointsBalance if updates are partial.                                                                                                                                             |
| `totalCashbackRedeemed` | Denormalized cashback redeemed                          | Same.                                                                                                                                                                                                                                                  |

**Improvements / must-fix**

- **Reconciliation job (recommended)**: Periodic job that recomputes `pointsBalance` from PointsTransaction, `totalCashbackEarned`/`totalCashbackRedeemed` from CashbackTransaction, and optionally `lifetimeSpend` from Bill, then fixes BusinessCustomer rows where they differ. Prevents permanent drift from bugs or partial failures.
- **Void/refund flow (must-fix when you add it)**: When you add “void bill” or “refund”:
  - Reverse cashback earned (deduct `totalCashbackEarned`, create compensating CashbackTransaction or new type).
  - Reverse cashback redeemed (refund to wallet: reduce `totalCashbackRedeemed` or add back earned).
  - Reverse points earned (create REFUNDED PointsTransaction or deduct from EARNED remainingAmount) and reverse points redeemed (add back points, update FIFO rows).
  - Decrement `lifetimeSpend` by that bill’s `finalAmount`, decrement `visitCount` if it was a qualifying visit, and re-resolve `currentTierId` for TIER.
- **Index**: Ensure there are indexes on (businessId, customerId) for BusinessCustomer (you have composite PK); and on PointsTransaction/CashbackTransaction for (businessId, customerId, createdAt) for reconciliation queries. Already present in schema.

---

## 10. Vulnerabilities and What We’re Missing

### 10.1 Logic / behaviour

| Item                           | Severity | Description                                                                                                                                                                                  |
| ------------------------------ | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Bill import**                | Medium   | Import route passes only `redeemPointsRequested` to `applyLoyaltyForBill`, never `redeemCashbackRequested`. So CASHBACK/TIER cashback redemption cannot be applied on import.                |
| **Reward stages**              | Medium   | Reward stages (FREE_ITEM, PERCENTAGE_DISCOUNT, CASH_DISCOUNT) are not used in redemption; only “X points = ₹X” is applied. So configured rewards are display-only.                           |
| **CASHBACK fractional rupees** | Low      | `calculatePointsEarnedForBill` returns `Math.floor(calculateCashbackEarned(...))` for CASHBACK, so fractional cashback (e.g. 100.50) is stored as 100. Intentional or not should be decided. |
| **TIER redemption limits**     | Low      | TIER has no redemptionBalanceLimit or redemptionBillLimit; only tier’s minPurchaseForRedemption. If you want per-tier caps on redeem amount per bill, they’re missing.                       |

### 10.2 Data integrity and ops

| Item                                 | Severity | Description                                                                                                                                                                              |
| ------------------------------------ | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Denormalized balance drift**       | High     | `pointsBalance`, `totalCashbackEarned`, `totalCashbackRedeemed` can drift from ledger if a step in `applyLoyaltyForBill` or expiry fails mid-way. No reconciliation.                     |
| **No void/refund**                   | High     | Void or refund bill is not implemented. When added, loyalty must be reversed (cashback and points, lifetimeSpend, visitCount, currentTierId); otherwise balances and tier will be wrong. |
| **Bill has no pointsRedeemedAmount** | Medium   | For points types, “how much discount from points on this bill?” is not on Bill; only on PointsTransaction. Harder reporting and inconsistent with cashbackRedeemedAmount.                |

### 10.3 Security / abuse (brief)

| Item                 | Severity | Description                                                                                                                    |
| -------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **Redeem limits**    | Low      | TIER has no per-bill or per-balance redemption cap; customer could redeem full balance in one go. May be acceptable; document. |
| **Concurrent bills** | Low      | Updates are inside `$transaction` and use increments/row updates; race conditions are mitigated.                               |

---

## 11. Future Breakers — What We 100% Should Improve

These are the changes that will prevent breakage or major tech debt once you extend the product.

1. **Void / refund bill**  
   When you add it, implement full loyalty reversal (cashback and points, lifetimeSpend, visitCount, currentTierId). Otherwise balances and tier will be incorrect and hard to fix.

2. **Reconciliation job**  
   Periodically recompute `pointsBalance`, `totalCashbackEarned`, `totalCashbackRedeemed` (and optionally `lifetimeSpend`) from transactions/bills and correct BusinessCustomer. Run after deploy or on a schedule.

3. **Bill.pointsRedeemedAmount**  
   Add and set it whenever points are redeemed on a bill (AMOUNT_SPENT/VISIT_MADE). Use it for reporting and to mirror the way cashback redemption is stored.

4. **Bill import and cashback**  
   In `apps/web/src/app/api/bills/import/route.ts`, pass `redeemCashbackRequested` from import payload to `applyLoyaltyForBill` when loyalty is CASHBACK/TIER, and accept it in the import schema.

5. **Document and centralise `isServiceEnabled`**  
   One place (type/schema) for all keys and values so every loyalty (and referral) path checks the same shape and avoids silent bypasses.

6. **Optional: TIER redemption limits**  
   If product needs “max redeem per bill” or “max redeem per balance” for TIER, add config and use it in `calculateRedeemable` for TIER (similar to CASHBACK).

---

## 12. Quick Checklist: All Four Types Behaving as Designed

- **CASHBACK**: Single % and cap; min for earn; min + balance/bill limits for redeem; cashback stored and redeemed from wallet; no points, no expiry.
- **TIER**: Tier from lifetime spend; per-tier % and cap; per-tier min for earn and for redeem; same cashback storage as CASHBACK; lifetimeSpend and currentTierId updated; no redemption balance/bill caps in code.
- **AMOUNT_SPENT**: Points from bill amount (onFinalAmount/subtotal); cap per purchase; points ledger with FIFO and expiry; redeem X pts = ₹X.
- **VISIT_MADE**: Points per qualifying visit (interval optional); same points ledger and redemption as AMOUNT_SPENT; visitCount and lastVisitAt updated when visit qualifies.
