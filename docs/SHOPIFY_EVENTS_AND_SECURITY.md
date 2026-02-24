# Shopify integration: events tracked and security review

## 1. Events tracked per shop

Webhooks are registered in `register-webhooks.ts` when a store is connected (OAuth callback). All use the same endpoint: `POST /api/shopify/webhooks/orders`. Events are identified by the `X-Shopify-Topic` header.

| Event (topic)        | Registered | Handled in webhook | What we do                                                                                                                                                                                                                            |
| -------------------- | ---------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **orders/create**    | Yes        | Yes                | Treated like `orders/updated`: resolve store, find/create customer, create Bill if not exists, upsert `ShopifyOrder`. Grant loyalty only when `fulfillment_status === "fulfilled"` and `financial_status` is not `refunded`/`voided`. |
| **orders/updated**   | Yes        | Yes                | Same as above. If we had already granted loyalty but `fulfillment_status` is no longer `fulfilled`, we revoke (deduct and set `refundedAt`). We never grant when `financial_status` is `refunded` or `voided`.                        |
| **orders/cancelled** | Yes        | Yes                | Look up `ShopifyOrder` by store + order id. If loyalty was granted, call `deductLoyaltyForShopifyOrderRefund`; set `refundedAt` and `financialStatus: voided`.                                                                        |
| **orders/delete**    | Yes        | Yes                | Same as `orders/cancelled`: find order, deduct loyalty if granted, set `refundedAt` and `financialStatus: voided` so we never re-grant.                                                                                               |
| **refunds/create**   | Yes        | Yes                | Use `order_id` from payload to find `ShopifyOrder`. If loyalty was granted, deduct; set `refundedAt` and `financialStatus: refunded`. All-or-nothing: first refund revokes 100% of that order’s points.                               |

### Summary

- **Order lifecycle**
  - **Create/Update** → create Bill (once), create/update `ShopifyOrder`, grant loyalty when `fulfillment_status === "fulfilled"`.
  - **Cancel** → deduct loyalty if it was granted, mark order refunded/voided.
  - **Refund** → same deduction, mark refunded.

- **Not tracked**
  - No product webhooks (`products/create`, `products/update`, `products/delete`). Product sync is manual via `POST /api/shopify/sync/products`.
  - No customer webhooks.
  - No other order topics (e.g. `orders/fulfilled`, `orders/paid`) beyond create/updated/cancelled/delete and refunds.

### Partial refunds (policy)

We use **all-or-nothing** deduction for refunds: the first refund (full or partial) for an order revokes **100%** of the loyalty granted for that order and sets `refundedAt`. Any further `refunds/create` for the same order are no-ops (we already have `refundedAt`). We do not deduct proportionally by refund amount. If you need proportional behavior (e.g. 50% refund → revoke 50% of points), the refund handler would need to be extended to use refund amount/line items and only set “fully refunded” when the sum of refunds covers the order.

---

## 2. Webhook payload shape (what it means)

Shopify can send the webhook body in two ways:

- **Root:** The resource is the whole JSON body, e.g. `{ "id": 123, "email": "...", ... }`.
- **Wrapped:** The resource is under a key, e.g. `{ "order": { "id": 123, "email": "...", ... } }` or `{ "refund": { "order_id": 123, ... } }`.

If we only read from the root (e.g. `order.id`), and Shopify sends a wrapped payload, then the root object has a key `order`, not `id`, so `order.id` is undefined and we fail. We now **normalize** in code: parse the JSON, then take the inner object from `payload.order` or `payload.refund` when present, otherwise use the root. That way both formats work and behaviour stays the same.

---

## 3. Issues and vulnerabilities

### Fixed

1. **OAuth redirect URI** – Now built from `NEXT_PUBLIC_URL` (with `VERCEL_URL` / localhost fallback) in `install/route.ts`.
2. **OAuth state signature** – Comparison is constant-time via `crypto.timingSafeEqual` in `oauth-state.ts`.
3. **Webhook payload shape** – `orders/cancelled` and `refunds/create` normalize payload (accept both root and `payload.order` / `payload.refund`) in `webhooks/orders/route.ts`.
4. **Duplicate webhooks** – We already have a unique constraint on `ShopifyOrder(shopifyStoreId, shopifyOrderId)`. On duplicate delivery the second request hits P2002; we catch it and return `200 { ok: true }` so Shopify does not retry and we never create a second Bill.

### Medium (open)

5. **Customer resolution is global by email** (unchanged)
   - **File:** `apps/web/src/app/api/shopify/webhooks/orders/route.ts` → `findOrCreateCustomerByEmail`
   - **Issue:** `findFirst({ where: { email } })` on `Customer` is not scoped by business. One email is treated as one global customer.
   - **Impact:** In a multi-tenant setup, two businesses with the same customer email share the same `Customer` and thus the same `Wallet` per business via `BusinessCustomer`. If the product is meant to be strict per-tenant isolation (same email = different people per business), this is wrong.
   - **Fix:** If tenants must be isolated, scope customer by `businessId` (e.g. via `BusinessCustomer` + join, or a composite identity).

6. **Access token stored in plaintext**
   - **File:** Prisma model `ShopifyStore.accessToken`; callback and sync routes.
   - **Issue:** `accessToken` is stored unencrypted.
   - **Impact:** DB compromise exposes Shopify API access for all connected stores.
   - **Fix:** Encrypt at rest (e.g. envelope encryption with KMS or app secret) and decrypt when reading for API calls.

### Low / hardening

7. **Webhook secret vs app secret**
   - **Current:** Webhooks are verified with `SHOPIFY_API_SECRET` (app Client secret).
   - **Note:** If you ever use a per-store webhook secret (e.g. `ShopifyStore.webhookSecret`), verification must use that for requests tied to that store.

8. **Callback has no CSRF beyond state**
   - **File:** `apps/web/src/app/api/shopify/callback/route.ts`
   - **Issue:** Callback is public; only protection is signed state with expiry.
   - **Impact:** If an attacker obtains a valid state (e.g. short window after admin clicks “Connect”), they could complete the flow and attach a store to the victim’s business.
   - **Mitigation:** State includes short expiry (10 min) and is HMAC-signed; ensure state is single-use (e.g. invalidate after use or bind to nonce).

9. **Sync and stores routes**
   - **Stores:** `GET` and `DELETE /api/shopify/stores[/:id]` are behind `withAdminAuth` and scoped to `context.business.id`.
   - **Sync:** `POST /api/shopify/sync/products` is admin-only and uses first active store for that business.
   - No extra issues identified; continue to scope all queries by `businessId`.

10. **Typo fix applied**
    - **File:** `apps/web/src/lib/actions/loyalty/shopify-order.ts`
    - **Issue:** Stray `w` after closing `});` (syntax error).
    - **Fix:** Removed the typo.

---

## 4. Checklist for production

- [x] Redirect URI from `NEXT_PUBLIC_URL` in install route.
- [x] Constant-time comparison for OAuth state in `oauth-state.ts`.
- [x] Normalize webhook payload for `orders/cancelled` and `refunds/create`.
- [x] Idempotent order webhooks: catch P2002 and return 200.
- [ ] Decide customer model: global-by-email vs per-business; implement and document.
- [ ] Plan encrypt-at-rest for `accessToken` (and any other secrets in DB).
- [ ] Ensure `SHOPIFY_API_SECRET` and `SHOPIFY_API_KEY` are not committed and are set in production env.
