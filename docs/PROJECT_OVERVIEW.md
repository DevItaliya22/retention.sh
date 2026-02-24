# Project overview (dy)

High-level view of the monorepo for adding integrations (e.g. Shopify).

## Repo structure

- **`packages/prisma`** – Database schema and client. Schema lives in `prisma/` (root `schema.prisma` + `prisma/models/*.prisma`). Prisma 7 is used with `--schema ./prisma` (folder = multi-file schema).
- **`apps/web`** – Next.js dashboard: business admin, cashier portal, customer portal, admin-auth (see `.cursor/rules`).

## Core data model

### Auth & roles

- **User** – Auth identity (email/phone). Has `role`: `CUSTOMER` | `ADMIN` | `CASHIER`.
- **Admin** – Links User → Business (one admin can have one business).
- **Cashier** – Links User → Business; has `email`, `cashierLinkSlug`, `password`; creates Bills.
- **Session**, **Account**, **Verification** – Better Auth / session and OAuth.

### Business & catalog

- **Business** – Central tenant: `name`, `slug`, `website`, currency/points settings, `isServiceEnabled` (JSON toggles for referral, loyalty, etc.). Has categories, skus, loyalty, feedback, campaigns, referral, etc.
- **Category** – Belongs to Business; optional `parentId` for subcategories; `name`, `sortOrder`. Has many **Sku**.
- **Sku** – Product/item: `businessId`, `categoryId`, `sku` (code), `name`, `description`, `price`, `unit`, `isActive`. Used in **BillLineItem** and in loyalty/referral (e.g. free item rewards).

### Customers & orders

- **Customer** – Links to User; has `email`, address fields. Can belong to many businesses via **BusinessCustomer**.
- **BusinessCustomer** – Pivot `(businessId, customerId)`: referral slug, wallet, tags, bills, transactions.
- **Bill** – One purchase: `businessId`, `customerId` (via BusinessCustomer), optional `cashierId`; amounts (subtotal, storeDiscount, tax, finalAmount, cashbackAmount, cashbackRedeemedAmount, userPaidAmount); has **BillLineItem[]**, **Transaction[]**, **FeedbackLink**.
- **BillLineItem** – `billId`, `skuId`, `qty`, `unitPrice` (snapshot at purchase).

### Loyalty & wallet

- **Transaction** – Unified ledger: `valueKind` (CASHBACK, AMOUNT_SPENT_POINTS, VISIT_POINTS), `type` (EARNED, REDEEMED, …), `source` (BILL, FEEDBACK, …); links to BusinessCustomer, Bill, etc.
- **Wallet** – Per BusinessCustomer: `cashbackBalance`, `amountSpentBalance`, `visitPointsBalance`, `freeItems` (JSON), `lifetimeSpend`, `visitCount` (for visit-based loyalty).

### Other domains

- **Loyalty**, **LoyaltyTierConfig**, **LoyaltyCashbackConfig**, etc. – Loyalty programs.
- **FeedbackConfig**, **FeedbackQuestion**, **FeedbackResponse**, **FeedbackLink** – Surveys and feedback.
- **ReferralProgram**, **ReferralLog** – Referral programs.
- **Campaign** – Marketing campaigns.
- **Membership**, **Qr**, **ScratchCard** – Other engagement features.

## Integration points for Shopify

- **Business** – One (or more) Shopify store connection(s) per business.
- **Sku** – Can be synced from Shopify products/variants; need a mapping (e.g. `shopifyProductId`, `shopifyVariantId`) to avoid duplicates and support sync.
- **Category** – Optional mapping to Shopify collections.
- **Bill** – Optional: sync Shopify orders into Bills or a separate order view for reporting.

The Shopify schema added in `prisma/models/shopify.prisma` provides: store connection (credentials + metadata) and product/sku sync mapping.
