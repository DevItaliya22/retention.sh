# AMOUNT_SPENT Loyalty — Bill-by-Bill Scenarios

You are the user. The business has **AMOUNT_SPENT** loyalty: points per rupee spent on this bill, redeem as 1 pt = ₹1 discount. Points expire; FIFO redeem/expiry. Code: `calculatePointsEarnedForBill` (AMOUNT_SPENT), `calculateRedeemable` (points), `expireBucketsForCustomer`, `allocateRedemptionFIFO`.

---

## Config

| Param                  | Value | Meaning                                                                                      |
| ---------------------- | ----- | -------------------------------------------------------------------------------------------- |
| `pointsPerRupee`       | 1     | 1 point per ₹1 of amountForEarning                                                           |
| `onFinalAmount`        | true  | Earning base = final amount (after store discount and after any points redeemed this bill)   |
| `maxPointsPerPurchase` | 500   | Max points earned per bill = 500                                                             |
| `pointExpiryDays`      | 30    | Each EARNED bucket expires 30 days after earn (default 180 if null; we use 30 for scenarios) |

**Starting state:** New customer. pointsBalance = **0**. No PointsTransaction rows.

---

## Bill 1 — ₹1000, no redemption

- **finalAmount:** 1000. **amountForEarning:** 1000
- **Earn:** 1000 × 1 = 1000. Cap 500 → **500** points. 1 EARNED row: amount 500, remainingAmount 500, expiresAt = today + 30
- **pointsBalance after:** **500**
- **User pays:** **₹1000**

---

## Bill 2 — ₹300, no redemption

- **Earn:** 300 × 1 = 300, cap 500 → **300**. New EARNED row (300 pts, expires today+30)
- **pointsBalance after:** 500 + 300 = **800**
- **User pays:** **₹300**

---

## Bill 3 — ₹200, redeem 150 points

- **Redeemable:** min(800, floor(200)) = 200. Redeem 150. FIFO: consume from oldest EARNED (500-pt row): remainingAmount 500 → 350
- **finalAmount after redemption:** 200 - 150 = **50**. **amountForEarning:** 50
- **Earn:** 50 × 1 = 50. New EARNED row 50 pts
- **pointsBalance after:** 800 - 150 + 50 = **700**
- **User pays:** **₹50**

---

## Bill 4 — ₹100, redeem 100 points

- **Redeemable:** min(700, 100) = 100. Redeem 100. FIFO: deduct from oldest (350 left on first row: 350 - 100 = 250)
- **finalAmount after:** 0. **amountForEarning:** 0 → earn **0**
- **pointsBalance after:** 700 - 100 = **600**
- **User pays:** **₹0**

---

## Bill 5 — ₹600 (max cap per purchase)

- **Earn:** 600 × 1 = 600, cap 500 → **500**
- **pointsBalance after:** 600 + 500 = **1100**
- **User pays:** **₹600**

---

## Bill 6 — ₹1000, redeem 400 points

- **Redeemable:** min(1100, 1000) = 1000. Redeem 400. FIFO: first row had 250 remaining → 0 (row fully consumed), second row 300 → 300 - 150 = 150, etc. (or one row 500: 500-400=100 remaining)
- Actually FIFO: we have multiple EARNED rows. Oldest first: 250 (from original 500), then 300, then 50, then 500. So 250 + 150 from next = 400. So first row remaining 0, second 300 - 150 = 150
- **finalAmount after:** 1000 - 400 = 600. **amountForEarning:** 600. Earn 500 (cap). New row 500
- **pointsBalance after:** 1100 - 400 + 500 = **1200**
- **User pays:** **₹600**

---

## Bill 7 — Store discount: subtotal 800, discount 200 (onFinalAmount)

- **finalAmount:** 600. **amountForEarning:** 600. Earn 500 (cap)
- **pointsBalance after:** 1200 + 500 = **1700**
- **User pays:** **₹600**

---

## Bill 8 — Redeem more than bill (capped by bill)

- **Bill:** 200. Redeemable min(1700, 200) = **200**. Request 500 → redeem 200
- **finalAmount after:** 0. **amountForEarning:** 0 → earn **0**
- **pointsBalance after:** 1700 - 200 = **1500**
- **User pays:** **₹0**

---

## Bill 9 — Expiry (conceptual: 30 days pass after Bill 1’s earn)

- **Setup:** Assume we are now 31 days after Bill 1. When we start processing this bill, `expireBucketsForCustomer` runs first. EARNED rows with expiresAt < now get remainingAmount set to 0 and an EXPIRED row created. So the oldest bucket (from Bill 1) has expired. That bucket had 500 - 250 (used in Bill 3) - 150 (used in Bill 3?) No: Bill 3 we used 150 from first row (250 left). So we had 500, then 250 after Bill 3. So first row still has 250. After 30 days that 250 expires.
- **Before Bill 9:** If only the first bucket (250) expired, balance drops by 250. So 1500 - 250 = 1250. (Check: we have many EARNED rows. Expiry runs: any row with expiresAt < now gets zeroed. So the oldest by expiresAt. In our scenario the very first earn was Bill 1, 500 pts, 30 days ago. So that row’s remainingAmount was 250 → expires. balance 1500 - 250 = 1250.)
- **Bill 9:** ₹100, no redeem. Earn 100. **pointsBalance after:** 1250 + 100 = **1350**
- **User pays:** **₹100**

---

## Bill 10 — Redeem exactly balance

- **Bill:** 500. Balance 1350. Redeemable min(1350, 500) = 500. Redeem 500
- **finalAmount after:** 0. Earn 0
- **pointsBalance after:** 1350 - 500 = **850**
- **User pays:** **₹0**

---

## Bill 11 — Small bill, no redeem (earn small)

- **Bill:** 50. Earn 50
- **pointsBalance after:** 850 + 50 = **900**
- **User pays:** **₹50**

---

## Bill 12 — Bill 2000 (cap 500)

- **Earn:** 2000 × 1 = 2000, cap 500 → **500**
- **pointsBalance after:** 900 + 500 = **1400**
- **User pays:** **₹2000**

---

## Bill 13 — Request redeem > balance (rejected)

- **Bill:** 1000. Balance 1400. Redeemable 1000. If user requests 2000, backend caps: min(2000, 1000) = **1000** redeemed
- **finalAmount after:** 0. **amountForEarning:** 0 → earn 0
- **pointsBalance after:** 1400 - 1000 = **400**
- **User pays:** **₹0**

---

## Bill 14 — Zero subtotal after discount (edge)

- **Subtotal:** 100, **Store discount:** 100 → **finalAmount 0**
- **amountForEarning:** 0 → earn **0**
- **pointsBalance after:** 400 (unchanged)
- **User pays:** **₹0**

---

## Bill 15 — After expiry: only new points left

- **Setup:** Assume all old EARNED buckets have expired (e.g. 60 days passed). Only Bill 11’s 50 and Bill 12’s 500 and Bill 13’s 0 might still be there; actually balance was 400 after Bill 13. So we have 400 pts in some buckets. If they all expired, balance becomes 0 (expiry job). Then Bill 15: ₹300, no redeem. Earn 300.
- **pointsBalance after:** 0 + 300 = **300**
- **User pays:** **₹300**

---

## Edge-case summary (AMOUNT_SPENT)

| Case                    | What we tested                                                       |
| ----------------------- | -------------------------------------------------------------------- |
| Max points per purchase | Bills 1, 5, 6, 7, 12 → cap at 500                                    |
| onFinalAmount           | Bill 7: earn on 600 (after discount); Bill 14: 0 after full discount |
| Redeem 1 pt = ₹1        | Bills 3, 4, 6, 8, 10, 13                                             |
| Redeem capped by bill   | Bill 8: redeemable 200 when bill 200                                 |
| FIFO                    | Bill 3, 6: oldest EARNED consumed first                              |
| Expiry                  | Bill 9 (old bucket expired), Bill 15 (all expired then earn)         |
| Zero amountForEarning   | Bills 4, 8, 14 → 0 earn                                              |
