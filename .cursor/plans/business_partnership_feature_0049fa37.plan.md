---
name: Business Partnership Feature
overview: Add a "Connect with Partners" settings page allowing two businesses to form partnerships, share referrals, create joint campaigns, and enable cross-business loyalty point usage with configurable exchange ratios. This involves new Prisma models, API routes, React hooks, and a settings page UI following existing codebase patterns.
todos:
  - id: prisma-models
    content: Create partnership.prisma with PartnerRequest, BusinessPartnership, PartnershipMember, PartnerCampaign models + update business.prisma and enums.prisma
    status: completed
  - id: prisma-generate
    content: Run prisma generate and prisma db push / migrate to apply schema changes
    status: completed
  - id: schemas
    content: Create partnership.ts Zod validation schemas for requests, settings, campaigns
    status: completed
  - id: api-settings
    content: Create /api/partnership/settings route for receiveOffers and maxPartner toggle
    status: completed
  - id: api-requests
    content: Create /api/partnership/requests routes for send, list, accept, reject, permanently-reject, re-request
    status: completed
  - id: api-partnerships
    content: Create /api/partnership routes for list, get, update (rates + toggles), dissolve
    status: completed
  - id: api-partner-campaigns
    content: Create /api/partnership/campaigns routes for CRUD
    status: completed
  - id: hooks
    content: "Create React hooks: usePartnershipSettings, usePartnerRequests, usePartnerships, usePartnerCampaigns"
    status: completed
  - id: settings-page
    content: Create settings/partners page with all UI sections (settings card, request form, tables, active partnerships)
    status: completed
  - id: nav-update
    content: Add Partners nav item to settings/layout.tsx
    status: completed
  - id: shared-referral
    content: Modify referral claim route to handle shared referrals and configurable reward sharing
    status: completed
isProject: false
---

# Business Partnership Feature

## Data Model Design (Prisma)

New file: `[packages/prisma/prisma/models/partnership.prisma](packages/prisma/prisma/models/partnership.prisma)`

### Core Models

**PartnerRequest** -- the directional request flow (sender/receiver is semantically meaningful here, not generic partyA/partyB):

```prisma
enum PartnerRequestStatus {
  PENDING
  ACCEPTED
  REJECTED
  PERMANENTLY_REJECTED
}

model PartnerRequest {
  id String @id @default(uuid())

  senderBusinessId   String
  senderBusiness     Business @relation("PartnerRequestsSent", fields: [senderBusinessId], references: [id], onDelete: Cascade)

  receiverBusinessId String
  receiverBusiness   Business @relation("PartnerRequestsReceived", fields: [receiverBusinessId], references: [id], onDelete: Cascade)

  status PartnerRequestStatus @default(PENDING)

  partnershipId String?              @unique
  partnership   BusinessPartnership? @relation(fields: [partnershipId], references: [id])

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([senderBusinessId, receiverBusinessId])
  @@map("partner_request")
}
```

**BusinessPartnership** -- the active partnership (no partyA/partyB; members are in a pivot table):

```prisma
enum PartnershipStatus {
  ACTIVE
  DISSOLVED
}

model BusinessPartnership {
  id String @id @default(uuid())

  status          PartnershipStatus @default(ACTIVE)
  sharedReferrals Boolean           @default(false)
  shareReferralRewards Boolean      @default(false)
  sharedCampaigns Boolean           @default(false)

  members   PartnershipMember[]
  campaigns PartnerCampaign[]
  request   PartnerRequest?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("business_partnership")
}
```

**PartnershipMember** -- each business's side of the partnership with its own exchange rate:

```prisma
model PartnershipMember {
  id String @id @default(uuid())

  partnershipId String
  partnership   BusinessPartnership @relation(fields: [partnershipId], references: [id], onDelete: Cascade)

  businessId String
  business   Business @relation(fields: [businessId], references: [id], onDelete: Cascade)

  // 1 rupee of this business's balance = exchangeRate rupees at partner
  exchangeRate Float @default(1.0)

  // For AMOUNT_SPENT / VISIT_MADE: how many rupees 1 point is worth
  // For CASHBACK / TIER: leave at 1.0 (balance already in rupees)
  pointToCurrencyRate Float @default(1.0)

  @@unique([partnershipId, businessId])
  @@map("partnership_member")
}
```

**PartnerCampaign** -- separate model from Campaign, linked to a partnership:

```prisma
model PartnerCampaign {
  id   String @id @default(uuid())
  slug String @unique

  partnershipId       String
  partnership         BusinessPartnership @relation(fields: [partnershipId], references: [id], onDelete: Cascade)

  createdByBusinessId String
  createdByBusiness   Business @relation(fields: [createdByBusinessId], references: [id], onDelete: Cascade)

  title       String?
  description String?
  contactNumber String?
  expiresAt   DateTime
  status      CampaignStatus @default(DRAFT)

  themeColor  String?
  textColor   String?
  logo        String?
  bannerImage String?

  rewardType           CampaignRewardType @default(FREE_ITEM)
  rewardValue          String?
  appliesTo            BenefitAppliesTo   @default(ENTIRE_PURCHASE)
  maxRedemptionAmount  Float?
  maxRedemptionEnabled Boolean            @default(false)

  minPurchaseForEarningEnabled    Boolean @default(false)
  minPurchaseForEarning           Float?
  minPurchaseForRedemptionEnabled Boolean @default(false)
  minPurchaseForRedemption        Float?

  instantCashbackRedeemable Boolean        @default(false)
  redemptionLimit           RedemptionLimit @default(ONCE)
  termsAndConditions        String[]        @default([])

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([partnershipId])
  @@map("partner_campaign")
}
```

### Modifications to Existing Models

In `[packages/prisma/prisma/models/business.prisma](packages/prisma/prisma/models/business.prisma)` -- add to Business model:

```prisma
receivePartnershipOffers Boolean @default(false)
maxPartnerAllowed        Int     @default(1)

partnershipMembers      PartnershipMember[]
partnerRequestsSent     PartnerRequest[]    @relation("PartnerRequestsSent")
partnerRequestsReceived PartnerRequest[]    @relation("PartnerRequestsReceived")
partnerCampaignsCreated PartnerCampaign[]
```

In `[packages/prisma/prisma/models/enums.prisma](packages/prisma/prisma/models/enums.prisma)` -- add `PARTNER_EXCHANGE` to `TransactionSource`:

```prisma
PARTNER_EXCHANGE // Points/cashback used at partner business
```

---

## Cross-Business Point Exchange Logic

The "better" approach for converting all wallet types to partner-usable value:

- **CASHBACK / TIER loyalty**: `cashbackBalance` is already in rupees. Multiply by `exchangeRate`.
- **AMOUNT_SPENT loyalty**: `amountSpentBalance * pointToCurrencyRate * exchangeRate` = rupee value at partner. The `pointToCurrencyRate` defaults to `1 / pointsPerRupee` from the loyalty config, but the admin can override it on the partnership member.
- **VISIT_MADE loyalty**: `visitPointsBalance * pointToCurrencyRate * exchangeRate`. No natural conversion exists, so the admin MUST set `pointToCurrencyRate` explicitly.

On redemption at partner business:

1. Calculate total available partner value in rupees
2. Debit from customer's wallet at home business (cashback first, then points)
3. Apply as a discount line on the partner's bill
4. Create Transaction records with `source: PARTNER_EXCHANGE` at BOTH businesses (debit at home, credit-like at partner)
5. **Critical**: the partner-credit discount must NOT earn loyalty points -- it is a pure deduction, not a "purchase amount"

---

## API Routes

All routes use the existing `withAdminAuth` middleware pattern from `[apps/web/src/lib/auth/middleware.ts](apps/web/src/lib/auth/middleware.ts)`.

| Route                                       | Methods        | Purpose                                                                                                            |
| ------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------ |
| `/api/partnership/settings`                 | `GET`, `PUT`   | Get/update partnership settings (receiveOffers, maxPartner)                                                        |
| `/api/partnership/requests`                 | `GET`, `POST`  | List incoming/outgoing requests; send new request (by business slug)                                               |
| `/api/partnership/requests/[id]`            | `PATCH`        | Accept / reject / permanently reject a request                                                                     |
| `/api/partnership/requests/[id]/re-request` | `POST`         | Send a re-request from the "permanently rejected" table (creates new request with receiver as the original sender) |
| `/api/partnership`                          | `GET`          | List active partnerships for current business                                                                      |
| `/api/partnership/[id]`                     | `GET`, `PATCH` | Get details / update partnership settings (rates, feature toggles)                                                 |
| `/api/partnership/[id]/dissolve`            | `POST`         | Dissolve a partnership                                                                                             |
| `/api/partnership/campaigns`                | `GET`, `POST`  | List / create partner campaigns                                                                                    |
| `/api/partnership/campaigns/[id]`           | `GET`, `PATCH` | Get / update a partner campaign                                                                                    |

---

## Frontend: Settings Page

### Navigation

In `[apps/web/src/app/(business)/settings/layout.tsx](<apps/web/src/app/(business)`/settings/layout.tsx>) -- add a "Partners" navigation item (using `Handshake` icon from lucide-react) after "Shopify".

### Page Structure

New directory: `apps/web/src/app/(business)/settings/partners/`

- `page.tsx` -- server component, renders `PartnersSettingsPageClient`
- `_components/PartnersSettingsPageClient.tsx` -- main client component

### UI Sections (following the Card-based pattern from existing settings pages)

1. **General Partnership Settings Card**

- Toggle: "Receive Partnership Offers" (`receivePartnershipOffers`)
- Input: "Maximum Partners Allowed" (`maxPartnerAllowed`, default 1)
- Save button

1. **Send Partnership Request Card**

- Text input for partner business slug
- "Send Request" button
- Validation: check slug exists, check target has `receivePartnershipOffers` on, check neither business is at maxPartner limit

1. **Incoming Requests Table**

- Columns: Business Name, Business Slug, Sent At, Actions
- Actions: Accept / Reject / Permanently Reject buttons
- Accept triggers partnership creation (with default exchange rates)

1. **Active Partnerships Card(s)**

- Shows partner business name/slug
- Exchange rate config (this business's rate and partner's rate, both editable by respective admins)
- `pointToCurrencyRate` input (shown only for AMOUNT_SPENT / VISIT_MADE loyalty types)
- Feature toggles: Shared Referrals, Share Referral Rewards, Shared Campaigns
- "Dissolve Partnership" button (with confirmation)

1. **Sent Requests Table**

- Columns: Target Business, Status, Sent At
- Read-only; shows status of outgoing requests

1. **Permanently Rejected Table**

- Shows businesses that were permanently rejected
- Action: "Move to Rejected" (allows future re-request)
- Action: "Send Partner Request from Your Side" (creates a new request with this business as sender, the previously rejected business as receiver)

### Hooks

New directory: `apps/web/src/hooks/partnership/`

- `usePartnershipSettings.ts` -- query/mutation for partnership toggle and maxPartner field
- `usePartnerRequests.ts` -- query for incoming/outgoing requests, mutations for accept/reject/permanently reject/re-request
- `usePartnerships.ts` -- query active partnerships, mutation for update settings and dissolve
- `usePartnerCampaigns.ts` -- query/mutation for partner campaigns

### Schemas

New file: `apps/web/src/lib/schemas/partnership.ts` -- Zod schemas for:

- Send request (business slug validation)
- Update partnership settings (exchange rates, feature toggles)
- Partner campaign create/update

---

## Shared Referral Integration

When shared referrals are enabled on a partnership and a new customer is referred to Business A:

Modify `[apps/web/src/app/api/referral/claim/route.ts](apps/web/src/app/api/referral/claim/route.ts)`:

- After creating the BusinessCustomer for Business A, check if A has an active partnership with `sharedReferrals: true`
- If yes, also create a BusinessCustomer linking the new customer to Business B (the partner)
- If `shareReferralRewards` is enabled, also trigger Business B's referral program rewards for both the referrer (if the referrer is a customer of B) and the new customer
- Create appropriate Transaction records

---

## Risks and Safeguards

1. **Loyalty double-dipping** (HIGH RISK): When a customer uses partner points as a discount at Business B, the discounted amount must NOT earn loyalty. The bill's earning calculation must subtract `partnerCreditAmount` from the base, similar to how `cashbackRedeemedAmount` works. Without this, infinite point loops are possible (earn at A, spend at B, earn at B, spend at A).
2. **Race conditions on wallet**: Cross-business deductions touch wallets from a different business's context. Must use DB transactions (`runTransaction`) and ensure the wallet read + debit is atomic. The existing pattern in `[apps/web/src/app/api/referral/claim/route.ts](apps/web/src/app/api/referral/claim/route.ts)` already uses `runTransaction` for similar operations.
3. **Exchange rate manipulation**: One admin could set a very favorable rate without the partner noticing. Mitigation: show both rates clearly in the UI and potentially notify the partner business when rates change.
4. **Referral reward stacking cost**: When `shareReferralRewards` is enabled, a single referral triggers rewards from BOTH businesses. The UI should display a clear warning about the doubled cost before enabling this toggle.
5. **maxPartnerAllowed enforcement**: On both accept and send-request, validate that neither business has reached their `maxPartnerAllowed` count (counting only ACTIVE partnerships). This prevents over-partnering.
6. **Permanently rejected re-request flow**: When Business A permanently rejects B, and later moves B to "rejected," B can now re-request. The re-request must create a NEW `PartnerRequest` row (delete or mark the old one as superseded) to keep the audit trail clean.
7. **Partnership dissolution cleanup**: When dissolved, set `status: DISSOLVED`. Do NOT delete records -- keep for audit. Partner campaigns should be moved to a "CANCELLED" or frozen state. Cross-business redemption stops immediately (check `status: ACTIVE` on every redemption).
8. **Transaction audit trail**: Every cross-business point movement must create Transaction records at BOTH businesses (debit at home, credit at partner) with `source: PARTNER_EXCHANGE` and metadata linking to the partnership ID. This is critical for reconciliation.

---

## Files to Create

- `packages/prisma/prisma/models/partnership.prisma`
- `apps/web/src/app/(business)/settings/partners/page.tsx`
- `apps/web/src/app/(business)/settings/partners/_components/PartnersSettingsPageClient.tsx`
- `apps/web/src/app/api/partnership/settings/route.ts`
- `apps/web/src/app/api/partnership/requests/route.ts`
- `apps/web/src/app/api/partnership/requests/[id]/route.ts`
- `apps/web/src/app/api/partnership/route.ts`
- `apps/web/src/app/api/partnership/[id]/route.ts`
- `apps/web/src/app/api/partnership/[id]/dissolve/route.ts`
- `apps/web/src/app/api/partnership/campaigns/route.ts`
- `apps/web/src/app/api/partnership/campaigns/[id]/route.ts`
- `apps/web/src/hooks/partnership/usePartnershipSettings.ts`
- `apps/web/src/hooks/partnership/usePartnerRequests.ts`
- `apps/web/src/hooks/partnership/usePartnerships.ts`
- `apps/web/src/hooks/partnership/usePartnerCampaigns.ts`
- `apps/web/src/lib/schemas/partnership.ts`

## Files to Modify

- `packages/prisma/prisma/models/business.prisma` (add fields + relations)
- `packages/prisma/prisma/models/enums.prisma` (add enums + PARTNER_EXCHANGE source)
- `apps/web/src/app/(business)/settings/layout.tsx` (add nav item)
- `apps/web/src/app/api/referral/claim/route.ts` (shared referral logic)
