# Tier-Based Loyalty — Test Plan

This document covers **tier-based loyalty only**: recommended admin config, bill creation flow, and end-to-end test cases including edge cases.

**Note:** CASHBACK and TIER do **not** use loyalty points. Cashback is stored in `CashbackTransaction` (one row per bill), `Bill.cashbackAmount`, and `BusinessCustomer.totalCashbackEarned`. No `PointsTransaction` EARNED rows are created for tier bills; redemption from points is disabled for tier (and cashback) types.

---

## 1. How Tier Loyalty Works (Summary)

- **Earning:** Customer’s **lifetime spend** (sum of all bill amounts) determines their **tier**. Each tier has a **cashback %** applied on the **current bill** (using `amountForEarning` = `billSubtotal ?? billAmount`). **Every bill counts toward lifetime spend** (and tier progression). **Cashback on this bill** is given only when the bill amount ≥ tier’s **min purchase for redemption** (when enabled); otherwise cashback = 0 for this bill.
- **Cashback** = when `amountForEarning >= tier.minPurchaseForRedemption` (when enabled): `(amountForEarning × tier.cashbackPercentage) / 100`, then if tier has **max cashback cap** enabled → cap at that value (e.g. ₹50). If bill &lt; min purchase for redemption → cashback = 0 (bill still counts in total).
- **Redemption:** Tier (and CASHBACK) types do **not** use points; `redeemPointsRequested` is ignored. Only AMOUNT_SPENT and VISIT_MADE use points and redemption.
- **After each bill:** `lifetimeSpend` increases by `billAmount`, `currentTierId` is recalculated, one **CashbackTransaction** row is created **only when cashback > 0** (none when cashback = 0, e.g. bill amount 0 or tier 0% cashback), `totalCashbackEarned` is incremented when cashback > 0, and tier upgrade info is returned when the customer moves to a higher tier. **finalAmount** = billAmount − cashbackAmount (no points redemption).

---

## 2. Recommended Admin Panel Config (Tier-Based)

Use this config in **Settings → Loyalty** (multistep onboarding: choose **Tier**, then complete steps).

### Step 1 — Tier configuration

| Field                | Value | Purpose                                                             |
| -------------------- | ----- | ------------------------------------------------------------------- |
| **Points per rupee** | `1`   | Used when tier is not resolved (e.g. preview). Tier earning uses %. |

(No global max cap — max cap is **per tier** only.)

### Step 2 — Tier definitions

Create **3 tiers** to test tier resolution and upgrades.

| Tier | Name     | Rank | Min lifetime spend (₹) | Max lifetime spend (₹) | Cashback % | Min purchase for redemption | Max cashback cap |
| ---- | -------- | ---- | ---------------------- | ---------------------- | ---------- | --------------------------- | ---------------- |
| 1    | Bronze   | 1    | 0                      | 5,000                  | 2          | Off                         | **On: 50**       |
| 2    | Silver   | 2    | 5,000                  | 20,000                 | 5          | On: 1,000                   | On: 200          |
| 3    | Platinum | 3    | 20,000                 | — (empty)              | 8          | On: 2,000                   | On: 500          |

**Why this config:**

- **Bronze (0–5k):** 2% + **max cap 50** → tests cap (e.g. bill ₹10,000 → 2% = ₹200, capped to **₹50**).
- **Silver (5k–20k):** 5%, min redeem 1,000, cap 200 → tests per-tier cap and min purchase for redemption (if points redemption is added later for tier; currently tier has no redemption).
- **Platinum (20k+):** 8%, min redeem 2,000, cap 500 → tests top tier.

---

## 3. What to Test When Making a Bill

1. **Request:** `billNumber`, `phoneNumber`, `name`, `amount`, optional `subtotal`, optional `lineItems`. (No `redeemPoints` for tier — ignored.)
2. **Earning:** Backend uses `amountForEarning = billSubtotal ?? amount`; resolves tier from **current** `lifetimeSpend` (before this bill); applies tier’s % and **per-tier** max cashback cap; returns `cashbackAmount`; creates one **CashbackTransaction**; updates `totalCashbackEarned` and `lifetimeSpend`/`currentTierId`. **No** PointsTransaction EARNED.
3. **Response:** `bill`, `loyalty` (with `cashbackAmount`, `tierUpgrade`, `finalAmount` = billAmount − cashbackAmount). Verify `Bill.cashbackAmount`, `BusinessCustomer.totalCashbackEarned`, and one `CashbackTransaction` row linked to the bill.

---

## 4. End-to-End Test Cases

Use **one test customer** (fixed phone number) so lifetime spend accumulates. Assume the admin config above is saved.

---

### TC-T1: New customer, small bill (Bronze)

- **Pre:** New customer (no prior bills). Tier = Bronze (0–5k).
- **Bill:** amount = **400**, subtotal = 400. No redemption.
- **Expected:**
  - Tier = Bronze, 2% on 400 = **₹8** cashback.
  - `cashbackAmount`: 8, `finalAmount`: 392 (400 − 8).
  - One **CashbackTransaction** row (billId, amount 8); `BusinessCustomer.totalCashbackEarned` += 8; **no** PointsTransaction EARNED.
  - After: `lifetimeSpend` = 400, `currentTierId` = Bronze.

---

### TC-T2: Max cashback cap (50) — bill ₹10,000 at 2%

- **Pre:** Same customer; `lifetimeSpend` = 400 (Bronze).
- **Bill:** amount = **10,000**, subtotal = 10,000.
- **Expected:**
  - Tier = Bronze. Raw = 2% of 10,000 = ₹200; tier max cap = **50** → cashback = **₹50**.
  - `cashbackAmount`: 50, `finalAmount`: 9,950.
  - One CashbackTransaction (amount 50); totalCashbackEarned += 50; no PointsTransaction EARNED.
  - After: `lifetimeSpend` = 10,400 → customer moves to **Silver**. `tierUpgrade`: `wasUpgraded: true`, `previousTierName`: "Bronze", `newTierName`: "Silver", `newCashbackPercentage`: 5.

---

### TC-T3: Next bill in Silver (5%)

- **Pre:** Same customer; `lifetimeSpend` = 10,400, tier = Silver.
- **Bill:** amount = **1,000**, subtotal = 1,000.
- **Expected:**
  - Silver: 5% on 1,000 = **₹50**. Cap 200 → 50 ✓.
  - `cashbackAmount`: 50, `finalAmount`: 950.
  - One CashbackTransaction (50); totalCashbackEarned += 50. After: `lifetimeSpend` = 11,400; still Silver.

---

### TC-T4: Bill below min purchase for redemption — no cashback, bill still counts

- **Pre:** Same customer; tier = Silver. Silver has **min purchase for redemption** = 1,000 (cashback only when bill ≥ 1,000).
- **Bill:** amount = **300**, subtotal = 300.
- **Expected:**
  - 300 &lt; 1,000 → **no cashback** on this bill. `cashbackAmount`: 0, `finalAmount`: 300. **No** CashbackTransaction for this bill; totalCashbackEarned unchanged.
  - Bill still counts: `lifetimeSpend` += 300; `currentTierId` unchanged (Silver).

---

### TC-T5: Redemption not applicable (tier has no points)

- **Pre:** Same customer; tier = Silver. Tier does not use points — no points balance from cashback.
- **Bill:** amount = **800**, redeemPoints = **100** (ignored).
- **Expected:**
  - No redemption. Cashback = 5% of 800 = **40**. `finalAmount`: 760; `redeemedPoints`: 0. One CashbackTransaction (40); totalCashbackEarned += 40.

---

### TC-T6: Silver cap 200 — bill large enough to hit cap

- **Pre:** Same customer; tier = Silver (5%, cap 200).
- **Bill:** amount = **10,000**, subtotal = 10,000.
- **Expected:**
  - 5% of 10,000 = 500; cap 200 → `cashbackAmount`: **200**, `finalAmount`: 9,800. One CashbackTransaction (200); totalCashbackEarned += 200.

---

### TC-T7: Reach Platinum (20k lifetime)

- **Pre:** Same customer; `lifetimeSpend` = 19,500 (Silver).
- **Bill:** amount = **1,000**, subtotal = 1,000.
- **Expected:**
  - Silver: 5% of 1,000 = 50. After: `lifetimeSpend` = 20,500 → tier becomes **Platinum**.
  - `tierUpgrade`: `wasUpgraded: true`, `newTierName`: "Platinum", `newCashbackPercentage`: 8.

---

### TC-T8: Platinum — small bill still earns (no min purchase for earning)

- **Pre:** Same customer; tier = Platinum (8%).
- **Bill:** amount = **800**, subtotal = 800.
- **Expected:**
  - 8% of 800 = **64**. `cashbackAmount`: 64, `finalAmount`: 736. One CashbackTransaction (64); totalCashbackEarned += 64.

---

### TC-T9: Subtotal vs amount

- **Pre:** Same customer; tier = Silver.
- **Bill:** amount = **1,000** (final), subtotal = **800**.
- **Expected:**
  - `amountForEarning` = 800. Cashback = 5% of 800 = **40**. `cashbackAmount`: 40, `finalAmount`: 960.

---

**Edge cases and boundaries (TC-T10–TC-T17):**

### TC-T10: Bill amount 0 (no cashback, no CashbackTransaction)

- **Pre:** New or existing customer; tier = Bronze (or any).
- **Bill:** amount = **0**, subtotal omitted or 0.
- **Expected:**
  - Cashback = **0** (amountForEarning ≤ 0). **No** CashbackTransaction row created. **No** PointsTransaction EARNED.
  - `cashbackAmount`: 0 (or null), `finalAmount`: 0.
  - DB: `lifetimeSpend` incremented by 0; `currentTierId` unchanged (or first tier). `totalCashbackEarned` not incremented.

---

### TC-T11: Exactly at tier boundary — lifetimeSpend 5000 → Silver

- **Pre:** Same customer; `lifetimeSpend` = **4,000** (Bronze).
- **Bill:** amount = **1,000**, subtotal = 1,000.
- **Expected:**
  - Tier for **this bill** = Bronze (tier is resolved from lifetimeSpend **before** this bill). 2% of 1,000 = **₹20**.
  - `cashbackAmount`: 20, `finalAmount`: 980. One CashbackTransaction (20); totalCashbackEarned += 20.
  - **After bill:** `lifetimeSpend` = 5,000. Tier resolution: 5000 ≥ 5000 (Silver min), 5000 < 20000 → **Silver**. `tierUpgrade`: `wasUpgraded: true`, `newTierName`: "Silver".

---

### TC-T12: Subtotal omitted (only amount sent)

- **Pre:** Same customer; tier = Silver.
- **Bill:** amount = **1,000**, **no subtotal** in request.
- **Expected:**
  - `amountForEarning` = `billAmount` = 1,000 (subtotal null/omitted → fallback to amount). 5% = **50**. `cashbackAmount`: 50, `finalAmount`: 950.

---

### TC-T13: Subtotal zero (fallback to amount)

- **Pre:** Same customer; tier = Silver.
- **Bill:** amount = **1,000**, subtotal = **0**.
- **Expected:**
  - `amountForEarning` = billAmount = 1,000 (subtotal 0 is not used; logic uses subtotal only when `> 0`). 5% = **50**. Same as TC-T12.

---

### TC-T14: Platinum cap 500 hit

- **Pre:** Same customer; tier = Platinum (8%, cap 500).
- **Bill:** amount = **10,000**, subtotal = 10,000.
- **Expected:**
  - Raw 8% of 10,000 = 800; per-tier cap 500 → `cashbackAmount`: **500**, `finalAmount`: 9,500. One CashbackTransaction (500); totalCashbackEarned += 500.

---

### TC-T15: Fractional rounding (floor to 2 decimals)

- **Pre:** Same customer; tier = Silver (5%).
- **Bill:** amount = **333.33**, subtotal = 333.33.
- **Expected:**
  - Raw = 333.33 × 5% = 16.6665; floored to 2 decimals → **16.66**. `cashbackAmount`: 16.66, `finalAmount`: 316.67. One CashbackTransaction (16.66).

---

### TC-T16: Exactly at top-tier boundary (20,000 → Platinum)

- **Pre:** Same customer; `lifetimeSpend` = **19,500** (Silver).
- **Bill:** amount = **500**, subtotal = 500.
- **Expected:**
  - Tier for bill = Silver. 5% of 500 = **25**. After: `lifetimeSpend` = 20,000. Tier: 20000 ≥ 20000 (Platinum min), Platinum has `maxLifetimeSpend` null → **Platinum**. `tierUpgrade`: `wasUpgraded: true`, `newTierName`: "Platinum", `newCashbackPercentage`: 8.

---

### TC-T17: finalAmount never negative

- **Pre:** Any tier with cap; if cap were somehow > bill (config error), ensure code guards.
- **Expected:** Implementation uses `finalAmount = Math.max(0, billAmount - cashbackAmount)`. So even with bad config, `finalAmount` ≥ 0. (No separate bill needed; verify in code / single sanity bill.)

---

## 5. Quick Reference: Expected Cashback Formula (Tier)

- **Tier** = by `lifetimeSpend` **before** this bill: `minLifetimeSpend ≤ spend < maxLifetimeSpend` (top tier has `maxLifetimeSpend` null → no upper bound). Boundaries: e.g. exactly 5,000 = Silver; exactly 20,000 = Platinum.
- **amountForEarning** = `billSubtotal ?? billAmount`, with **subtotal used only when present and > 0**; otherwise `billAmount`. So subtotal 0 or omitted → use `billAmount`.
- **Min gate:** If tier has **min purchase for redemption** enabled and `amountForEarning < minPurchaseForRedemption` → cashback = 0 (bill still counts toward lifetime spend and tier).
- **Raw** = `(amountForEarning × tier.cashbackPercentage) / 100`. If `amountForEarning ≤ 0` or `tier.cashbackPercentage ≤ 0` → cashback = 0.
- If tier **maxCashbackCap** enabled and > 0 → cashback = min(raw, maxCashbackCap). Result **floored to 2 decimals**.
- **finalAmount** = `Math.max(0, billAmount - cashbackAmount)` (never negative).

**Edge-case behaviour (for implementation verification):**

- **Single-tier config:** If the business has only one tier (e.g. min 0, max null), all customers resolve to that tier; no upgrades.
- **Tier with 0% cashback:** If a tier has `cashbackPercentage = 0`, cashback is 0, no CashbackTransaction, but `lifetimeSpend` and `currentTierId` still update after the bill.

---

## 6. Checklist: What to Verify Per Test

- [ ] Response `loyalty.cashbackAmount` matches expected ₹.
- [ ] Response `loyalty.finalAmount` = bill amount − cashback (no points redemption for tier); never negative.
- [ ] Response `loyalty.tierUpgrade` when applicable (boundary crosses: 5k → Silver, 20k → Platinum).
- [ ] **When cashback > 0:** exactly **one** CashbackTransaction row (billId, loyaltyId, businessId, customerId, amount = cashback). **When cashback = 0:** **zero** CashbackTransaction rows for this bill.
- [ ] **No** PointsTransaction EARNED row for any tier bill.
- [ ] DB: `BusinessCustomer.totalCashbackEarned` incremented by cashbackAmount (only when cashback > 0); `lifetimeSpend`, `currentTierId` updated after every tier bill (including when cashback is 0).
- [ ] DB: `Bill.cashbackAmount` = cashbackAmount; `Bill.finalAmount` = finalAmount.
- [ ] **TIER only:** CashbackTransaction `metadata` includes `tierName`, `tierId`, `cashbackPercentage` when tier is resolved.
- [ ] UI: Cashier sees “You got ₹X cashback” and upgrade message when relevant.

---

## 7. Summary Table (Key Tests)

| Scenario             | Bill amount (₹)           | Tier (before)   | Expected cashback | Notes                                          |
| -------------------- | ------------------------- | --------------- | ----------------- | ---------------------------------------------- |
| New, small           | 400                       | Bronze          | 8 (2%)            | No cap hit                                     |
| Cap 50               | 10,000                    | Bronze          | **50** (capped)   | 2% would be 200                                |
| Silver 5%            | 1,000                     | Silver          | 50                |                                                |
| Bill &lt; min redeem | 300                       | Silver          | **0**             | 300 &lt; 1000 → no cashback; bill still counts |
| Silver cap           | 10,000                    | Silver          | 200 (capped)      | 5% = 500, cap 200                              |
| Upgrade Platinum     | 1,000                     | Silver→Platinum | 50                | lifetimeSpend 19.5k→20.5k                      |
| Platinum small       | 800                       | Platinum        | 64 (8%)           | No min earn                                    |
| Subtotal vs amount   | amount 1000, subtotal 800 | Silver          | 40                | Earning on 800                                 |
| **Bill amount 0**    | 0                         | any             | 0                 | No CashbackTransaction; lifetime +0            |
| **Boundary 5k**      | 1,000 (life 4k→5k)        | Bronze→Silver   | 20 (Bronze 2%)    | After bill = Silver                            |
| **Subtotal omitted** | 1,000 (no subtotal)       | Silver          | 50                | amountForEarning = amount                      |
| **Subtotal 0**       | 1000, subtotal 0          | Silver          | 50                | Fallback to amount                             |
| **Platinum cap**     | 10,000                    | Platinum        | **500** (capped)  | 8% = 800, cap 500                              |
| **Fractional round** | 333.33                    | Silver          | 16.66             | Floor to 2 decimals                            |
| **Boundary 20k**     | 500 (life 19.5k→20k)      | Silver→Platinum | 25 (Silver 5%)    | After bill = Platinum                          |

Use this config and these cases to test tier-based loyalty end-to-end. Assert CashbackTransaction (only when cashback > 0) and totalCashbackEarned; confirm no points are used for tier; verify tier boundaries and edge cases above.
