# CASHBACK Loyalty — Bill-by-Bill Scenarios

You are the user. The business has **CASHBACK** loyalty with the config below. We walk through 15 bills in order and see wallet, redeemable, and amount paid. Code ref: `calculateCashbackEarned`, `calculateCashbackRedeemable`, `calculatePointsEarnedForBill` (CASHBACK case stores **integer** rupees via `Math.floor`).

---

## Config (set at start)

| Param                             | Value | Meaning                                                                                      |
| --------------------------------- | ----- | -------------------------------------------------------------------------------------------- |
| `cashbackPercentage`              | 10    | 10% cashback on eligible amount                                                              |
| `onFinalAmount`                   | true  | Earning base = final amount (after store discount and after any cashback redeemed this bill) |
| `maxCashbackCap`                  | 50    | Max cashback earned per bill = ₹50                                                           |
| `minPurchaseForEarningEnabled`    | true  | Must meet min to earn                                                                        |
| `minPurchaseForEarning`           | 500   | Bill (amountForEarning) must be ≥ ₹500 to earn                                               |
| `minPurchaseForRedemptionEnabled` | true  | Must meet min to redeem                                                                      |
| `minPurchaseForRedemption`        | 300   | Bill must be ≥ ₹300 to use wallet                                                            |
| `redemptionBalanceLimitEnabled`   | true  | Cap how much of balance can be used at once                                                  |
| `redemptionBalanceLimitAmount`    | 200   | Max ₹200 from wallet per bill                                                                |
| `redemptionBillLimitEnabled`      | true  | Cap redemption as % of bill                                                                  |
| `redemptionBillLimitPercentage`   | 25    | Max redemption = 25% of bill amount                                                          |

**Starting state:** New customer. Wallet (totalCashbackEarned - totalCashbackRedeemed) = **₹0**.

---

## Bill 1 — Bill ₹1000, no redemption

- **Subtotal:** 1000, **Store discount:** 0, **Tax:** 0 → **finalAmount = 1000**
- **Redeem cashback:** 0
- **amountForEarning:** 1000 (onFinalAmount = true, no redemption)
- **Earn:** 1000 ≥ 500 ✓. Raw = 1000 × 10% = 100. Cap = min(100, 50) = **50**. Stored as Math.floor(50) = **50**
- **Wallet after:** 0 + 50 = **₹50**
- **User pays:** 1000 - 0 = **₹1000**

---

## Bill 2 — Bill ₹400 (below min for earning)

- **Subtotal:** 400, **Store discount:** 0 → **finalAmount = 400**
- **Redeem cashback:** 0
- **Earn:** 400 < 500 → **0**
- **Wallet after:** 50 + 0 = **₹50**
- **User pays:** **₹400**

---

## Bill 3 — Bill ₹600, redeem ₹100 (below min for redemption)

- **finalAmount:** 600
- **Redeem requested:** 100. **Min for redemption:** bill ≥ 300 ✓. Balance 50. Balance limit 200 ✓. Bill limit 25% of 600 = 150. Redeemable = min(50, 200, 150, 600) = **50**
- **Redeemed:** min(100, 50) = **50**
- **finalAmount after redemption:** 600 - 50 = 550. **amountForEarning:** 550 (onFinalAmount)
- **Earn:** 550 ≥ 500 ✓. Raw = 55, cap = min(55, 50) = **50**. Stored **50**
- **Wallet after:** 50 - 50 + 50 = **₹50**
- **User pays:** **₹550**

---

## Bill 4 — Bill ₹200 (below min for redemption)

- **finalAmount:** 200. **Redeem requested:** 50. Bill 200 < 300 → redeemable = **0**. So redeemed = 0
- **Earn:** 200 < 500 → **0**
- **Wallet after:** 50 (unchanged)
- **User pays:** **₹200**

---

## Bill 5 — Bill ₹1000, no redemption (max cap hit again)

- **Earn:** 1000 × 10% = 100, cap 50 → **50**
- **Wallet after:** 50 + 50 = **₹100**
- **User pays:** **₹1000**

---

## Bill 6 — Bill ₹300, redeem max allowed

- **finalAmount:** 300. Min for redemption 300 ✓. Redeemable: balance 100, balance limit 200, bill limit 25%×300=75 → min(100, 200, 75, 300) = **75**
- **Redeem:** 75
- **finalAmount after redemption:** 225. **amountForEarning:** 225. 225 < 500 → earn **0**
- **Wallet after:** 100 - 75 = **₹25**
- **User pays:** **₹225**

---

## Bill 7 — Bill ₹500, no redemption (exactly at min for earning)

- **Earn:** 500 ≥ 500 ✓. 500 × 10% = 50, cap 50 → **50**
- **Wallet after:** 25 + 50 = **₹75**
- **User pays:** **₹500**

---

## Bill 8 — Bill ₹2000 (cap applies)

- **Earn:** 2000 × 10% = 200, cap 50 → **50**
- **Wallet after:** 75 + 50 = **₹125**
- **User pays:** **₹2000**

---

## Bill 9 — Bill ₹400, redeem ₹50

- **finalAmount:** 400. 400 ≥ 300 ✓. Redeemable: min(125, 200, 25%×400=100, 400) = **100**. Redeem 50
- **After redemption:** 400 - 50 = 350. **amountForEarning:** 350. 350 < 500 → earn **0**
- **Wallet after:** 125 - 50 = **₹75**
- **User pays:** **₹350**

---

## Bill 10 — Store discount: subtotal 1000, discount 200 (onFinalAmount = true)

- **finalAmount:** 1000 - 200 = **800**. Earning base = finalAmount = 800
- **Earn:** 800 ≥ 500 ✓. 800 × 10% = 80, cap 50 → **50**
- **Wallet after:** 75 + 50 = **₹125**
- **User pays:** **₹800**

---

## Bill 11 — Subtotal 600, discount 200, redeem 100

- **finalAmount before loyalty:** 400. Redeemable: min(125, 200, 25%×400=100, 400) = **100**. Redeem 100
- **finalAmount after redemption:** 300. **amountForEarning:** 300. 300 < 500 → earn **0**
- **Wallet after:** 125 - 100 = **₹25**
- **User pays:** **₹300**

---

## Bill 12 — Fractional cashback (code floors to integer)

- **finalAmount:** 505. 505 × 10% = 50.5. Cap 50 → 50. Math.floor(50.5\*100)/100 = 50.5 in calculateCashbackEarned; then Math.floor(50.5) = **50** stored
- **Wallet after:** 25 + 50 = **₹75**
- **User pays:** **₹505**

---

## Bill 13 — Bill 499 (just below min for earning)

- **Earn:** 499 < 500 → **0**
- **Wallet after:** 75 (unchanged)
- **User pays:** **₹499**

---

## Bill 14 — Bill 299 (just below min for redemption), try redeem 50

- **Redeemable:** bill 299 < 300 → **0**. Redeem 0
- **Earn:** 299 < 500 → 0
- **Wallet after:** 75
- **User pays:** **₹299**

---

## Bill 15 — Large bill, redeem up to balance limit

- **Wallet before:** 75. **Bill:** 1000. Redeemable: min(75, 200, 250, 1000) = **75**. Redeem 75
- **finalAmount after:** 925. **amountForEarning:** 925. 925 ≥ 500 ✓. Raw 92.5, cap 50 → **50**
- **Wallet after:** 75 - 75 + 50 = **₹50**
- **User pays:** **₹925**

---

## Edge-case summary (CASHBACK)

| Case               | What we tested                                                                         |
| ------------------ | -------------------------------------------------------------------------------------- |
| Min for earning    | Bill 2 (400), Bill 4 (200), Bill 13 (499) → 0 earn                                     |
| Max cap            | Bill 1, 5, 8 (1000, 1000, 2000) → earn capped at 50                                    |
| Min for redemption | Bill 4 (200), Bill 14 (299) → cannot redeem                                            |
| Balance limit      | Bill 3 redeems full wallet 50; Bill 15 redeems 75 (balance limit 200 not binding here) |
| Bill % limit       | 25% of bill caps redemption (e.g. Bill 6 max 75)                                       |
| onFinalAmount      | Bill 10 (subtotal 1000, discount 200) → earn on 800                                    |
| Fractional         | Bill 12 → 50.5 truncated to 50 in stored cashback                                      |
