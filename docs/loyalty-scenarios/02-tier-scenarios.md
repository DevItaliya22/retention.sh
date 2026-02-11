# TIER Loyalty — Bill-by-Bill Scenarios

You are the user. The business has **TIER** loyalty. Tiers are based on **lifetime spend** (before this bill). We do 15 bills and track: tier, wallet, lifetimeSpend, earn, redeem, user paid. Code: `resolveTierForLifetimeSpend`, `calculateTierCashbackEarned`, `calculatePointsEarnedForBill` (TIER), `calculateRedeemable` (TIER uses tier’s minPurchaseForRedemption only; no balance/bill limit).

---

## Config

| Param           | Value |
| --------------- | ----- |
| `onFinalAmount` | true  |

**Tiers (contiguous: tier[i].max = tier[i+1].min):**

| Tier     | minLifetimeSpend | maxLifetimeSpend | cashbackPercentage | minPurchaseForRedemptionEnabled | minPurchaseForRedemption | maxCashbackCapEnabled | maxCashbackCap |
| -------- | ---------------- | ---------------- | ------------------ | ------------------------------- | ------------------------ | --------------------- | -------------- |
| Silver   | 0                | 5000             | 3%                 | true                            | 500                      | true                  | 30             |
| Gold     | 5000             | 15000            | 5%                 | true                            | 400                      | true                  | 60             |
| Platinum | 15000            | — (top)          | 8%                 | true                            | 300                      | true                  | 100            |

**Starting state:** New customer. lifetimeSpend = 0, wallet = 0, currentTier = none (below Silver’s 0; actually Silver is 0–5000 so at 0 they're in Silver). Check: resolveTierForLifetimeSpend with 0: tier Silver has min 0, so customer is in **Silver**.

---

## Bill 1 — ₹2000 (Silver, but below min for earning)

- **lifetimeSpend before bill:** 0 → **Silver** (0–5k)
- **finalAmount:** 2000. Redeem: 0
- **amountForEarning:** 2000. Silver: minPurchaseForRedemption 500. 2000 ≥ 500 ✓. Earn: 2000×3% = 60, cap 30 → **30**
- **Wallet after:** 30. **lifetimeSpend after:** 0 + 2000 = **2000**
- **User pays:** **₹2000**

---

## Bill 2 — ₹400 (Silver, below min for earning)

- **lifetimeSpend before:** 2000 → Silver
- **amountForEarning:** 400. 400 < 500 → earn **0**
- **Wallet after:** 30. **lifetimeSpend after:** 2000 + 400 = **2400**
- **User pays:** **₹400**

---

## Bill 3 — ₹3000 (Silver, cap hit)

- **lifetimeSpend before:** 2400 → Silver
- **amountForEarning:** 3000. 3000 ≥ 500 ✓. 3000×3% = 90, cap 30 → **30**
- **Wallet after:** 30 + 30 = **60**. **lifetimeSpend after:** 2400 + 3000 = **5400** → still Silver (max 5000). Actually 5400 ≥ 5000 so next tier: Gold starts at 5000. So after this bill lifetimeSpend = 5400 → **Gold** for next bill.

---

## Bill 4 — ₹100 (Silver→Gold boundary; this bill still Silver)

- **lifetimeSpend before:** 5400 → **Gold** (5k–15k)
- **amountForEarning:** 100. Gold minPurchaseForRedemption 400. 100 < 400 → earn **0**
- **Wallet after:** 60. **lifetimeSpend after:** 5400 + 100 = **5500** (Gold)
- **User pays:** **₹100**

---

## Bill 5 — ₹1000, redeem ₹40

- **lifetimeSpend before:** 5500 → Gold. Wallet 60. Redeemable: Gold min 400, bill 1000 ≥ 400 ✓. min(60, 1000) = **60**. Redeem 40
- **finalAmount after redemption:** 960. **amountForEarning:** 960. 960 ≥ 400 ✓. 960×5% = 48, cap 60 → **48**
- **Wallet after:** 60 - 40 + 48 = **68**. **lifetimeSpend after:** 5500 + 1000 = **6500**
- **User pays:** **₹960**

---

## Bill 6 — ₹2000 (Gold, cap 60)

- **lifetimeSpend before:** 6500 → Gold
- **Earn:** 2000×5% = 100, cap 60 → **60**
- **Wallet after:** 68 + 60 = **128**. **lifetimeSpend after:** 6500 + 2000 = **8500**
- **User pays:** **₹2000**

---

## Bill 7 — ₹7000 (cross into Platinum)

- **lifetimeSpend before:** 8500 → Gold
- **Earn:** 7000×5% = 350, cap 60 → **60**
- **lifetimeSpend after:** 8500 + 7000 = **15500** → **Platinum** (15k+)
- **Wallet after:** 128 + 60 = **188**
- **User pays:** **₹7000**

---

## Bill 8 — ₹500 (Platinum, min 300)

- **lifetimeSpend before:** 15500 → Platinum
- **amountForEarning:** 500. 500 ≥ 300 ✓. 500×8% = 40, cap 100 → **40**
- **Wallet after:** 188 + 40 = **228**. **lifetimeSpend after:** 15500 + 500 = **16000**
- **User pays:** **₹500**

---

## Bill 9 — ₹200 (Platinum, below min for earning)

- **lifetimeSpend before:** 16000 → Platinum
- **amountForEarning:** 200. 200 < 300 → earn **0**
- **Wallet after:** 228. **lifetimeSpend after:** 16200
- **User pays:** **₹200**

---

## Bill 10 — ₹1500, redeem 150

- **lifetimeSpend before:** 16200 → Platinum. Bill 1500 ≥ 300 ✓. Redeemable min(228, 1500) = 228. Redeem 150
- **finalAmount after:** 1350. **amountForEarning:** 1350. 1350×8% = 108, cap 100 → **100**
- **Wallet after:** 228 - 150 + 100 = **178**. **lifetimeSpend after:** 16200 + 1500 = **17700**
- **User pays:** **₹1350**

---

## Bill 11 — ₹299 (just below Platinum min redeem)

- **lifetimeSpend before:** 17700 → Platinum. Redeem requested 50. Bill 299 < 300 → redeemable **0**. Redeem 0
- **Earn:** 299 < 300 → **0**
- **Wallet after:** 178. **lifetimeSpend after:** 17999
- **User pays:** **₹299**

---

## Bill 12 — ₹300 (exactly at min), redeem 50

- **Bill 300 ≥ 300 ✓.** Redeemable min(178, 300) = 178. Redeem 50
- **finalAmount after:** 250. **amountForEarning:** 250. 250 < 300 → earn **0**
- **Wallet after:** 178 - 50 = **128**. **lifetimeSpend after:** 18299
- **User pays:** **₹250**

---

## Bill 13 — Store discount: subtotal 1000, discount 300 (onFinalAmount)

- **finalAmount:** 700. **amountForEarning:** 700. 700×8% = 56, cap 100 → **56**
- **Wallet after:** 128 + 56 = **184**. **lifetimeSpend after:** 18299 + 1000 = **19299** (lifetimeSpend uses billAmount = 1000 - 300 + 0 = 700? No — code uses billAmount = finalAmountBeforeLoyalty = 700. So lifetimeSpend += 700)
- Actually in code: `lifetimeSpend: { increment: billAmount }` and billAmount is the param = finalAmountBeforeLoyalty = subtotal - discount + tax = 1000 - 300 = 700. So lifetimeSpend += 700.
- **User pays:** **₹700**

---

## Bill 14 — Redeem full wallet

- **lifetimeSpend before:** 19999 → Platinum. Wallet 184. Bill 2000. Redeemable min(184, 2000) = 184. Redeem 184
- **finalAmount after:** 1816. **amountForEarning:** 1816. 1816×8% = 145.28, cap 100 → **100**
- **Wallet after:** 184 - 184 + 100 = **100**. **lifetimeSpend after:** 19999 + 2000 = **21999**
- **User pays:** **₹1816**

---

## Bill 15 — Large bill in Platinum (cap 100)

- **lifetimeSpend before:** 21999 (after Bill 14). Bill 2000.
- **Earn:** 2000×8% = 160, cap 100 → **100**
- **Wallet after:** 100 + 100 = **200**. **lifetimeSpend after:** 21999 + 2000 = **23999**
- **User pays:** **₹2000**

---

## Edge-case summary (TIER)

| Case                            | What we tested                                                                 |
| ------------------------------- | ------------------------------------------------------------------------------ |
| Tier movement                   | Bills 1–3 Silver; Bill 4+ Gold; Bill 8+ Platinum                               |
| Min for earning (per tier)      | Silver 500 (Bills 2, 4), Gold 400 (Bill 4), Platinum 300 (Bills 9, 11, 12)     |
| Max cap per tier                | Silver 30, Gold 60, Platinum 100                                               |
| Min for redemption              | Bill 11 (299), Bill 12 (300 exactly)                                           |
| onFinalAmount                   | Bill 13: earn on 700 (after store discount)                                    |
| No balance/bill limit on redeem | TIER redeemable = min(balance, billAmount) only after minPurchaseForRedemption |
