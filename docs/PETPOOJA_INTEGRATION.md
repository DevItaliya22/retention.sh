# Petpooja Integration

This doc describes how Petpooja (restaurant POS) integration works and how we use it so **when an order is created** in Petpooja we know about it and create a Bill in dy (for loyalty, feedback, and reporting).

---

## What is Petpooja?

Petpooja is a restaurant POS / billing system used in India. It manages:

- Orders (dine-in, takeaway, delivery)
- Menu and items
- Payments (cash, card, online)
- Integrations with aggregators (Swiggy, Zomato, etc.)

Integrations with Petpooja are typically **two-way**: orders can flow from your platform into Petpooja, and order status updates can flow back.

---

## How Petpooja APIs Work (from research)

### 1. Getting API access

Petpooja does **not** publish full public REST API docs. To integrate you need to:

1. **Contact Petpooja** for API credentials and documentation:
   - **Email:** Support@Petpooja.com
   - **Phone:** +91 7969223344
   - **Support:** [petpooja.com/poss/support](http://www.petpooja.com/poss/support)

2. **Credentials they provide** (used by partners like Yelo, Tookan):
   - **App Key** – unique identifier for API calls
   - **Access Token** – application access
   - **App Secret Key** – used for signing/verification
   - **Restaurant / Merchant / Store ID** – identifies the outlet in Petpooja

3. **Ask them specifically for:**
   - **Inbound orders:** How do we get notified when a new order is created in Petpooja?
     - **Option A:** Webhook URL we provide; they POST order payload to us.
     - **Option B:** REST endpoint to **poll** for new orders (e.g. `GET /orders?since=...`).
   - **Payload shape:** JSON structure for an order (order id, customer, line items, amounts, status).
   - **Signature:** If webhook, how they sign the body (e.g. HMAC with App Secret) so we can verify.

### 2. Typical flow (what we need)

We want: **“When order is created (in Petpooja), we know and create a Bill in dy.”**

- **Inbound (Petpooja → dy):**
  1. Order is created in Petpooja (POS, aggregator, or their online ordering).
  2. We are notified either by:
     - **Webhook:** Petpooja POSTs to our URL (e.g. `POST /api/petpooja/webhooks/orders`) with order payload, or
     - **Polling:** We call their “list new orders” API on a schedule.
  3. We verify the request (signature / auth).
  4. We find the linked **Business** (via Petpooja store/restaurant ID).
  5. We find or create **Customer** (e.g. by phone/email if provided).
  6. We create a **Bill** (and optionally **PetpoojaOrder** for idempotency and status sync).
  7. Optionally we apply loyalty and create a feedback link (same as Shopify/cashier flow).

- **Outbound (dy → Petpooja) – optional later:**  
  When we create a bill in dy (e.g. cashier), we could push it to Petpooja if they expose an “create order” API. That would require their API docs.

### 3. Steps to add Petpooja in this codebase

| Step | What to do                                                                                                                                                                                                          |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | Get from Petpooja: credentials (App Key, Access Token, App Secret, Restaurant ID), webhook/polling docs, and order payload sample.                                                                                  |
| 2    | **Schema:** Add `PetpoojaStore` (credentials + businessId) and `PetpoojaOrder` (petpoojaOrderId, businessId, customerId, billId, status, amounts). One Bill per Petpooja order (like Shopify).                      |
| 3    | **Config:** Store credentials per business (e.g. settings page “Petpooja” with App Key, Access Token, App Secret, Restaurant ID).                                                                                   |
| 4    | **Webhook or poll:** Implement either: (a) `POST /api/petpooja/webhooks/orders` that verifies signature and creates Bill + PetpoojaOrder, or (b) a cron/job that calls Petpooja “new orders” API and creates Bills. |
| 5    | **Idempotency:** Use `(petpoojaStoreId, petpoojaOrderId)` to avoid duplicate Bills (same pattern as `ShopifyOrder`).                                                                                                |
| 6    | **Mapping:** If Petpooja sends item IDs, add `PetpoojaProductSync` (or similar) to map to our `Sku`; otherwise use a fallback SKU (e.g. “PETPOOJA-ORDER”) like Shopify.                                             |
| 7    | **Loyalty / feedback:** Reuse existing logic (apply loyalty for bill, create feedback link) once Bill is created.                                                                                                   |

### 4. What’s already in the repo (mirror Shopify)

- **Shopify flow:** Webhook `orders/create` and `orders/updated` → find/create customer by email → create Bill + `ShopifyOrder` → loyalty and feedback link.
- **Petpooja** should follow the same idea: one “external order” record (`PetpoojaOrder`) linked to one `Bill`, same customer resolution and loyalty/feedback behaviour.

### 5. Files to add/use

- **Docs:** `docs/PETPOOJA_INTEGRATION.md` (this file).
- **Schema:** `packages/prisma/prisma/models/petpooja.prisma` – `PetpoojaStore`, `PetpoojaOrder` (and optionally product sync later).
- **API:** `apps/web/src/app/api/petpooja/webhooks/orders/route.ts` – receive webhook (or similar for poll).
- **Verification:** If webhook is signed, `apps/web/src/lib/petpooja/verify.ts` (e.g. HMAC with App Secret).
- **Settings:** UI to add/edit Petpooja credentials and optional “test connection” (call a simple Petpooja API if they provide one).

---

## Summary

- **Goal:** When an order is created in Petpooja, we know and create a Bill in dy.
- **Blockers:** Official API docs and order payload/signature from Petpooja (contact Support@Petpooja.com).
- **Implementation:** Same pattern as Shopify: store config → webhook or poll → create Bill + external order row → reuse loyalty and feedback.

Once you have the exact webhook URL format, payload JSON, and signature method from Petpooja, the skeleton in this repo can be filled in (payload parsing, verification, and mapping to Bill/line items).
