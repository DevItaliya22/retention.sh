| Area      | Test Case               | Input/Setup             | Expected                                   |
| --------- | ----------------------- | ----------------------- | ------------------------------------------ |
| Invariant | Non-negative payable    | Any successful bill     | `userPaidAmount >= 0`                      |
| Invariant | Payable bounded by bill | Any successful bill     | `userPaidAmount <= finalAmount`            |
| Invariant | Non-negative discounts  | Any successful bill     | campaign/cashback/partner discounts `>= 0` |
| Invariant | Numeric sanity          | Any successful bill     | no NaN/Infinity in amounts                 |
| Invariant | Wallet non-negative     | Post bill/redeem        | cashback/points balances never `< 0`       |
| Invariant | Bill uniqueness         | Reuse same `billNumber` | conflict/error, no overwrite               |

| Loyalty Type | Case                     | Input                           | Expected                            |
| ------------ | ------------------------ | ------------------------------- | ----------------------------------- |
| Cashback     | Negative cashback redeem | `redeemCashback=-1`             | 400 reject                          |
| Cashback     | Huge cashback redeem     | `redeemCashback=very large`     | reject or capped safely             |
| Cashback     | Campaign+cashback        | active campaign + cashback flow | combined math correct               |
| Tier         | Tier upgrade boundary    | spend around threshold          | tier changes exactly at boundary    |
| Tier         | Redemption min purchase  | below/at/above min              | enforced correctly                  |
| Amount Spent | Negative points          | `redeemPoints=-1`               | 400 reject                          |
| Amount Spent | Reward stage redeem      | valid `rewardStageId`           | correct discount/free-item behavior |
| Visit Made   | Visit interval boundary  | bills around interval           | earn only when qualifying           |
| Visit Made   | Stage + campaign         | stage redeem + active campaign  | no double-count errors              |

| Billing Validation  | Case                            | Input                 | Expected                |
| ------------------- | ------------------------------- | --------------------- | ----------------------- |
| Required subtotal   | Missing subtotal + no lineItems | empty monetary fields | 400 reject              |
| Invalid phone       | malformed E.164                 | bad `phoneNumber`     | reject (no 500 ideally) |
| Blank bill number   | `billNumber=""`                 | invalid               | 400 reject              |
| Long bill number    | `billNumber` > max              | invalid               | 400 reject              |
| Negative tax        | tax contains negative           | invalid               | 400 reject              |
| Invalid SKU UUID    | line item bad uuid              | invalid               | 400 reject              |
| Inactive SKU        | line item inactive sku          | invalid               | 400 reject              |
| Qty boundary        | `qty=0`, `<0`                   | invalid               | 400 reject              |
| Unit price boundary | `<0`                            | invalid               | 400 reject              |
| Huge values         | very large subtotal/qty         | stress                | no crash, sane output   |

| Partner                      | Case                                        | Setup/Input         | Expected                           |
| ---------------------------- | ------------------------------------------- | ------------------- | ---------------------------------- |
| Partner exists in preview    | active partnership + partner wallet balance | call preview        | partner listed both sides          |
| Invalid partner ID           | random uuid                                 | redeem request      | reject                             |
| Over cap redeem              | above `maxRedeemableOnBill`                 | redeem              | reject                             |
| Insufficient partner balance | redeem > partner wallet                     | redeem              | reject                             |
| Partner conversion math      | known rate values                           | redeem              | redeemed amount matches conversion |
| Partner wallet deduction     | successful partner redeem                   | before/after wallet | partner wallet decreases correctly |
| 3-way interaction            | campaign + loyalty + partner on same bill   | success path        | totals consistent                  |

| Referral                    | Case                         | Setup/Input                  | Expected              |
| --------------------------- | ---------------------------- | ---------------------------- | --------------------- |
| Fresh claim                 | new phone + valid slug       | claim API                    | success               |
| Duplicate claim             | same phone again             | claim API                    | blocked               |
| Lock before first purchase  | referrer reward lock enabled | preview before referred bill | locked/not redeemable |
| Unlock after first purchase | referred creates first bill  | preview after                | unlocked/redeemable   |
| Referral disabled           | service/program off          | claim API                    | blocked               |

| Feedback                | Case             | Setup/Input         | Expected                         |
| ----------------------- | ---------------- | ------------------- | -------------------------------- |
| Submit once             | valid token      | feedback submit     | success                          |
| Submit twice            | same token again | feedback submit     | blocked                          |
| Reward credit           | reward enabled   | wallet before/after | exact reward delta               |
| Transaction correctness | after feedback   | check transaction   | source=`FEEDBACK`, type=`EARNED` |

| Concurrency                | Case                              | Setup                                 | Expected |
| -------------------------- | --------------------------------- | ------------------------------------- | -------- |
| Parallel bill create       | same customer x10 parallel        | no corruption, invariants hold        |
| Duplicate bill number race | same `billNumber` parallel        | single success, others fail           |
| Partner double-spend race  | parallel partner redeems          | no negative balance, capped correctly |
| Mixed concurrent flows     | campaign+loyalty+partner parallel | consistent DB state                   |

| Reporting        | Requirement                                | Expected                   |
| ---------------- | ------------------------------------------ | -------------------------- |
| Per-case verdict | pass/fail with status/details              | always recorded            |
| Summary metrics  | total/passed/failed/pass-rate              | printed each run           |
| Failure evidence | request payload + response + key DB deltas | captured for triage        |
| Isolation        | unique run IDs/phones                      | no cross-run contamination |

If you want, I can next convert this into a checklist markdown file format you can paste directly into your repo docs.
