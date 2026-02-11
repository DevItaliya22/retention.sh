# VISIT_MADE Loyalty — Bill-by-Bill Scenarios

You are the user. The business has **VISIT_MADE** loyalty: points per **qualifying visit** (1 bill = 1 visit when interval not enforced). Visit interval can require a minimum gap between visits. Points expire; redemption 1 pt = ₹1. Code: `isVisitQualifying`, `calculatePointsEarnedForBill` (VISIT_MADE), `expireBucketsForCustomer`, FIFO redeem.

---

## Config

| Param                  | Value | Meaning                                           |
| ---------------------- | ----- | ------------------------------------------------- |
| `pointsPerVisit`       | 50    | 50 points per qualifying visit                    |
| `visitIntervalEnabled` | true  | Only count visit if enough time since lastVisitAt |
| `visitIntervalValue`   | 1     | 1 unit                                            |
| `visitIntervalUnit`    | DAY   | 1 day = 24h gap required                          |
| `pointExpiryDays`      | 60    | EARNED points expire 60 days after earn           |

**Starting state:** New customer. pointsBalance = 0, visitCount = 0, lastVisitAt = null. Every bill we assume we run `expireBucketsForCustomer` first (so expired points are already deducted).

---

## Bill 1 — First visit (qualifies)

- **lastVisitAt:** null → **visit qualifies**
- **Earn:** 50 points. visitCount → 1, lastVisitAt → now
- **pointsBalance after:** **50**
- **User pays:** (e.g. ₹500) **₹500**

---

## Bill 2 — Same “day” (within 24h) — does NOT qualify

- **lastVisitAt:** set at Bill 1 (e.g. 2 hours ago). now - lastVisitAt < 24h → **visit does not qualify**
- **Earn:** 0. visitCount and lastVisitAt **unchanged** (we do not increment for VISIT_MADE when !visitQualifies). Code: only when `context.type === "VISIT_MADE" && visitQualifies` we do visitCount += 1, lastVisitAt = now. So visitCount stays 1.
- **pointsBalance after:** 50
- **User pays:** (e.g. ₹200) **₹200**

---

## Bill 3 — Next day (>24h later) — qualifies

- **lastVisitAt:** yesterday. now - lastVisitAt ≥ 24h → **qualifies**
- **Earn:** 50. visitCount → 2, lastVisitAt → now
- **pointsBalance after:** 50 + 50 = **100**
- **User pays:** (e.g. ₹300) **₹300**

---

## Bill 4 — Redeem 30 points

- **Bill:** ₹400. Redeemable min(100, 400) = 100. Redeem 30
- **finalAmount after:** 400 - 30 = 370. **Earn:** This bill is a new visit (we’re assuming >24h since Bill 3). So **qualifies** → 50 pts
- **pointsBalance after:** 100 - 30 + 50 = **120**. visitCount → 3, lastVisitAt → now
- **User pays:** **₹370**

---

## Bill 5 — Same day again — no qualify

- **lastVisitAt:** Bill 4 (same day). **Does not qualify**
- **Earn:** 0. visitCount stays 3
- **pointsBalance after:** 120
- **User pays:** (e.g. ₹100) **₹100**

---

## Bill 6 — Next day — qualify, redeem 50

- **Qualifies.** Redeem 50. finalAmount e.g. 500 - 50 = 450. Earn 50
- **pointsBalance after:** 120 - 50 + 50 = **120**. visitCount → 4
- **User pays:** **₹450**

---

## Bill 7 — Large bill, redeem 100 (full balance if balance were 100)

- **Before:** 120. Bill ₹1000. Redeemable min(120, 1000) = 120. Redeem 100
- **finalAmount after:** 900. **Earn:** assume next day → qualifies → 50
- **pointsBalance after:** 120 - 100 + 50 = **70**. visitCount → 5
- **User pays:** **₹900**

---

## Bill 8 — Two bills same day (second doesn’t count)

- **Bill 8a:** Same day as Bill 7. Does not qualify. Earn 0. Wallet 70. User pays e.g. ₹50
- **Bill 8b:** Still same day. Does not qualify. Earn 0. Wallet 70. User pays e.g. ₹80
- **visitCount:** still 5

---

## Bill 9 — Next day, qualify; then expiry note

- **Qualifies.** Earn 50. **pointsBalance after:** 70 + 50 = **120**
- **Expiry:** 60 days later, the oldest EARNED buckets will expire. When customer comes after 60 days, `expireBucketsForCustomer` runs: any EARNED row with expiresAt < now gets remainingAmount = 0 and EXPIRED row created; balance drops. So “Bill 10” could be 61 days later: balance might be lower (e.g. first few buckets expired).

---

## Bill 10 — After 61 days (some points expired)

- **Setup:** 61 days passed. Old EARNED rows (e.g. from Bills 1, 3, 4, 6, 7, 9) have expiresAt = earnDate + 60. So at least the oldest few have expired. Assume 3 buckets of 50 expired → balance was 120 - 150 = -30? No, we can’t go negative. So we had 120, three 50-pt buckets expire → 120 - 150 would be -30; actually we expire in FIFO order and we only expire what exists. So if we had 120 = 50+50+20 (partial), we might expire 50+50 = 100, balance 20. So **pointsBalance before Bill 10:** e.g. **20**
- **Bill 10:** Next visit (qualifies). Earn 50. No redeem. **pointsBalance after:** 20 + 50 = **70**
- **User pays:** (e.g. ₹200) **₹200**

---

## Bill 11 — Redeem more than bill (capped)

- **Bill:** ₹30. Balance 70. Redeemable min(70, 30) = **30**. Redeem 30
- **finalAmount after:** 0. **Earn:** assume qualifies (next day) → 50
- **pointsBalance after:** 70 - 30 + 50 = **90**. visitCount += 1
- **User pays:** **₹0**

---

## Bill 12 — Visit interval: exactly 24h (boundary)

- **lastVisitAt:** exactly 24h ago. Code: `Date.now() - lastVisitAt.getTime() >= intervalMs`. So 24h >= 24h → **true** → qualifies
- **Earn:** 50
- **pointsBalance after:** 90 + 50 = **140**
- **User pays:** (e.g. ₹100) **₹100**

---

## Bill 13 — 23h 59m later (does not qualify)

- **lastVisitAt:** 23h 59m ago. now - lastVisitAt < 24h → **does not qualify**
- **Earn:** 0. visitCount unchanged
- **pointsBalance after:** 140
- **User pays:** (e.g. ₹50) **₹50**

---

## Bill 14 — Zero bill amount, redeem 0 (still a “visit” if qualifies)

- **Bill:** ₹0 (e.g. exchange only). **amountForEarning:** 0 (not used for VISIT_MADE; earn = pointsPerVisit). If visit qualifies: earn **50**
- **pointsBalance after:** 140 + 50 = **190**
- **User pays:** **₹0**

---

## Bill 15 — Full redeem then earn same bill

- **Bill:** ₹500. Balance 190. Redeemable 190. Redeem 190
- **finalAmount after:** 310. **Earn:** visit qualifies → 50
- **pointsBalance after:** 190 - 190 + 50 = **50**. visitCount += 1
- **User pays:** **₹310**

---

## Edge-case summary (VISIT_MADE)

| Case                   | What we tested                                                          |
| ---------------------- | ----------------------------------------------------------------------- |
| First visit            | Bill 1: lastVisitAt null → qualifies, +50                               |
| Visit interval (1 DAY) | Bills 2, 5, 8: same day → no qualify, 0 earn, visitCount unchanged      |
| Next day               | Bills 3, 4, 6, 7, 9: qualifies, +50, visitCount and lastVisitAt updated |
| Redemption 1 pt = ₹1   | Bills 4, 6, 7, 11, 15                                                   |
| Redeem capped by bill  | Bill 11: redeemable 30 when bill 30                                     |
| Expiry                 | Bill 10: after 60 days some buckets expired, balance lower              |
| 24h boundary           | Bill 12: exactly 24h → qualifies; Bill 13: 23h59m → no                  |
| Zero bill              | Bill 14: earn still 50 if visit qualifies (no amount-based earn)        |
