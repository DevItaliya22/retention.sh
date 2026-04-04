# Admin -> Business One-to-Many Migration Plan

## Goal

Support one `User` with admin role owning/managing multiple `Business` records instead of the current one-admin-to-one-business setup.

This document is intentionally detailed and is based on the current codebase state in:

- `packages/prisma/prisma/schema.prisma`
- `packages/prisma/prisma/models/business.prisma`
- `apps/web/src/lib/auth/middleware.ts`
- `apps/web/src/app/api/business/current/route.ts`
- `apps/web/src/app/api/onboarding/route.ts`
- `apps/web/src/hooks/business/useCurrentBusiness.ts`
- the admin-authenticated API routes under `apps/web/src/app/api/**`

It also follows the project rules in `.cursor/rules`, especially:

- Prisma schema lives under `packages/prisma/prisma/models`
- do not run Prisma generate/migrate unless explicitly asked
- API routes must always validate session and scope by current business
- keep frontend/data flow aligned with the existing schema -> API -> hook -> component -> page architecture

---

## Executive Summary

The schema is already very close to a membership/pivot model because `Admin` already links `User` and `Business`. The main blockers are:

1. `Admin.userId` is `@unique`, so a user can only have one admin row.
2. `User.admin` is singular, so Prisma relation shape is one-to-one.
3. Admin auth middleware resolves exactly one admin row with `findFirst({ where: { userId } })` and treats that business as "the current business".
4. Nearly all admin APIs assume `context.business.id` is implicit and globally unique for the logged-in admin session.
5. The UI has no "active business" selector/switcher, so once a user belongs to multiple businesses there is no deterministic way to know which business `/dashboard`, `/settings`, `/api/business/current`, etc. should operate on.

Because of points 3-5, this is not only a Prisma relation change. We need to introduce an explicit active business context for admin sessions.

Recommended direction:

- Reuse `Admin` as the admin-membership table.
- Make `User -> Admin` one-to-many.
- Add a concept of `activeBusinessId` for the logged-in admin.
- Update admin middleware to resolve the active membership instead of "first admin row".
- Audit every admin API route so it keeps scoping to one business, but now the selected business rather than the only business.

---

## Current State

### Prisma relationship today

In `packages/prisma/prisma/schema.prisma`:

- `User.admin    Admin?`
- `Admin.userId  String @unique`
- `Admin.businessId String`
- `Business.admins Admin[]`

What this means:

- one `User` can have at most one `Admin`
- one `Business` can have many admins
- effectively the product behaves as one admin user -> one business

### Business context today

`apps/web/src/lib/auth/middleware.ts` currently does:

- `db.admin.findFirst({ where: { userId: session.user.id }, include: { business: ... } })`
- puts `admin.businessId` and `admin.business` into `context`
- all admin APIs use `context.business.id`

This works only because there is exactly one admin row per user.

### Onboarding today

`apps/web/src/app/api/onboarding/route.ts`:

- creates a `business`
- creates one `admin` row with `userId + businessId`
- upgrades user role to `ADMIN`

This flow creates the first business for an admin, but there is no concept of:

- admin adding a second business
- admin choosing between multiple businesses after login
- admin switching active business in session

### Current business data today

`apps/web/src/app/api/business/current/route.ts` and `apps/web/src/hooks/business/useCurrentBusiness.ts` are built around one implicit business:

- `GET /api/business/current` returns one business or `null`
- `PUT /api/business/current` updates one business
- frontend query key is just `["currentBusiness"]`

This API can still exist, but its meaning must become "currently selected business", not "the only business this admin owns".

---

## Recommended Target Data Model

### Keep `Admin` as the membership table

Recommended Prisma shape:

In `packages/prisma/prisma/schema.prisma`:

- change `User.admin Admin?` to `User.admins Admin[]`
- remove `@unique` from `Admin.userId`
- add a composite unique constraint on `[userId, businessId]`

Recommended `Admin` shape:

```prisma
model User {
  id      String @id @default(uuid())
  ...
  admins  Admin[]
  ...
}

model Admin {
  id         String   @id @default(uuid())
  userId     String
  businessId String

  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  business    Business @relation(fields: [businessId], references: [id], onDelete: Cascade)

  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@unique([userId, businessId])
  @@index([userId])
  @@index([businessId])
  @@map("admin")
}
```

Why this is the safest fit:

- minimal conceptual change because `Admin` already behaves like a join table
- existing `Business.admins Admin[]` stays valid
- existing admin row IDs can remain intact
- no need to invent a new `AdminBusinessMembership` model unless product roles/permissions become more complex later

### Do not make APIs operate on all businesses at once by default

Do not rewrite admin APIs to become multi-business queries by default.

Instead:

- preserve current business scoping behavior
- define one selected business per admin session/request context
- make all current APIs continue to operate against exactly one business at a time

That keeps blast radius lower and avoids accidental cross-business reads/writes.

---

## Required Product/Architecture Decision

Before implementation, one decision must be made clearly:

### How should the app know the admin's active business?

Recommended answer:

- keep admin URLs unchanged
- store `activeBusinessId` in session or in a dedicated admin cookie
- add UI to switch business
- middleware resolves the active business membership from that value

Why this is recommended:

- existing routes like `/dashboard`, `/settings`, `/campaigns`, `/api/business/current` can keep their URL shape
- the migration is mostly internal
- fewer changes across page routing and links

Alternative, not recommended for first pass:

- make business slug/id part of every admin URL and every admin API request

Why this is bigger:

- every business page route changes
- every navigation link changes
- every hook/API call changes
- existing layout assumptions break more aggressively

For this codebase, session/cookie-based active business is the lower-risk path.

---

## Proposed Active Business Design

### Server-side requirement

Add an admin-scoped active business value, for example one of:

1. `Session.activeBusinessId`
2. a dedicated cookie like `dy.admin.active_business_id`
3. a server-side lookup table keyed by session token

Recommended first choice:

- dedicated cookie or session additional field

Reason:

- small surface area
- easy to read in middleware
- no route changes required

### Middleware behavior after change

Admin middleware should:

1. validate admin session
2. fetch all admin memberships or fetch the membership matching `activeBusinessId`
3. if no memberships exist:
   - allow onboarding routes to proceed with `business: null`
4. if memberships exist but no active business is selected:
   - auto-select first membership for backward compatibility, or return a "business selection required" response
5. if active business is selected but membership no longer exists:
   - clear selection and fall back safely
6. build `context.adminMembership` and `context.business`

Recommended context shape:

```ts
adminMembership: {
  id: string;
  userId: string;
  businessId: string;
}
business: {
  id: string;
  name: string;
  slug: string;
  isServiceEnabled: IsServiceEnabled | null;
}
memberships?: Array<{
  id: string;
  businessId: string;
  business: { id: string; name: string; slug: string };
}>
```

Important:

- avoid keeping field names that imply one admin-one-business forever
- `context.admin.businessId` can stay temporarily for compatibility, but the plan should eventually prefer a clearer membership naming

---

## Detailed Workstreams

## Phase 1: Prisma Schema and DB Migration

Files:

- `packages/prisma/prisma/schema.prisma`
- likely split model files under `packages/prisma/prisma/models/**` depending on actual schema organization

Changes:

1. Change `User.admin` to `User.admins`.
2. Remove `@unique` from `Admin.userId`.
3. Add `@@unique([userId, businessId])` on `Admin`.
4. Keep `@@index([userId])` and `@@index([businessId])`.
5. Review generated Prisma relation names to ensure downstream TypeScript call sites are updated correctly.

Migration concerns:

- existing data should migrate cleanly because every current user has at most one admin row
- composite unique should not fail unless duplicate `userId + businessId` rows already exist
- if duplicate rows exist, they must be deduplicated before applying unique constraint

Pre-migration checks to include later:

- count duplicate admin memberships by `userId + businessId`
- count admin users with more than one row if any manual inserts already happened
- verify no code depends on `User.admin` include/select shape

Important rule note:

- do not run `prisma generate`, `prisma migrate`, or any generation/migration command until explicitly asked

---

## Phase 2: Introduce Active Business State

Files likely to touch:

- `apps/web/src/lib/auth/middleware.ts`
- `apps/web/src/lib/auth/auth.ts`
- `apps/web/src/lib/utils/cookie.ts`
- possibly a new API route like `apps/web/src/app/api/business/switch/route.ts`
- possibly a new hook like `apps/web/src/hooks/business/useBusinessSwitcher.ts`

Changes:

1. Decide storage mechanism for `activeBusinessId`.
2. Add read/write utilities for active business selection.
3. Update admin middleware to resolve active business from membership.
4. Ensure `withAdminAuthOptionalBusiness` still works for onboarding.
5. Add behavior for first login:
   - if one business membership exists, auto-select it
   - if multiple memberships exist, select a default or redirect to selector

Recommended API addition:

- `POST /api/business/switch`
  - body: `{ businessId: string }`
  - validates the logged-in admin belongs to that business
  - stores the new active business in cookie/session
  - returns the selected business payload

Optional companion route:

- `GET /api/business/list`
  - returns all businesses accessible to current admin

This route is not strictly required if the list is returned from `/api/business/current`, but adding a dedicated list API is cleaner.

---

## Phase 3: Rewrite Auth and Access Assumptions

### A. Middleware

Primary file:

- `apps/web/src/lib/auth/middleware.ts`

Required changes:

1. Replace `findFirst({ where: { userId } })` one-row assumption.
2. Resolve membership by `activeBusinessId`.
3. Handle admin with zero businesses.
4. Handle admin with multiple businesses.
5. Optionally expose membership list for business switcher UI.

Potential breaking spots in this file:

- `AdminAuthContext.admin.businessId`
- `AdminAuthContextOptionalBusiness.admin.businessId`
- all code comments saying "admin has one business"

### B. Session/auth helpers

Files:

- `apps/web/src/lib/auth/auth.ts`
- `apps/web/src/lib/actions/auth.ts`
- `apps/web/src/app/(auth)/login/_components/LoginPageClient.tsx`

Required changes:

1. `checkAdminHasBusiness()` currently uses `db.admin.findUnique({ where: { userId } })`; that will break once `userId` is not unique.
2. Replace with count/existence check such as `findFirst` or `count`.
3. Login redirect logic must distinguish:
   - no businesses -> `/welcome`
   - one business -> `/dashboard`
   - multiple businesses -> likely `/dashboard` with default active business or a business-selection UI

Recommended behavior:

- if exactly one membership exists, auto-select it
- if multiple exist and no active business cookie/session exists, choose the most recently created membership or show a selector modal/page

---

## Phase 4: Onboarding and Business Creation Flow

Primary files:

- `apps/web/src/app/api/onboarding/route.ts`
- `apps/web/src/components/forms/onboarding/WelcomeForm.tsx`
- `apps/web/src/components/settings/business/BusinessOnboardingSettings.tsx`
- `apps/web/src/components/settings/business/BusinessSettingsContainer.tsx`

Required changes:

1. Decide whether onboarding remains "first business only" or becomes "create another business".
2. Allow an already-onboarded admin to create an additional business if product wants that.
3. After creating a new business, set it as active business automatically.
4. Ensure slug ownership check still works when same admin already owns other businesses.
5. Ensure optional cashier creation uses the newly created business ID, not the previous active business.

Important product choice:

- If `/welcome` should remain first-time-only, add a separate "Create business" flow elsewhere.
- If `/welcome` is reused for adding another business, update copy and redirect rules.

Current code behavior to revisit:

- `WelcomeForm` assumes one created business becomes "the business" and then refetches `currentBusiness`
- this still works if new business becomes active immediately after creation

---

## Phase 5: Current Business API and Hook Contract

Primary files:

- `apps/web/src/app/api/business/current/route.ts`
- `apps/web/src/hooks/business/useCurrentBusiness.ts`

Required changes:

1. Keep `/api/business/current` semantics as "active business".
2. Extend response to include accessible businesses or add separate list endpoint.
3. Ensure `PUT /api/business/current` updates only the active business.
4. Ensure all cache invalidation still targets the selected business correctly.

Recommended response shape evolution:

```ts
{
  business: CurrentBusiness | null,
  businesses?: Array<{ id: string; name: string; slug: string }>,
  error?: string
}
```

or keep `/current` narrow and add:

- `/api/business/list`
- `/api/business/switch`

Preferred clean design:

- `/api/business/current` -> one active business
- `/api/business/list` -> all memberships
- `/api/business/switch` -> mutation

Frontend changes needed:

1. `useCurrentBusiness()` may stay mostly unchanged.
2. add `useBusinessList()`
3. add `useSwitchBusiness()`
4. invalidate `["currentBusiness"]` after switch
5. invalidate business-scoped feature queries after switch if necessary

---

## Phase 6: Exhaustive Admin API Audit

Everything below is built on `withAdminAuth` or `withAdminAuthOptionalBusiness` and must be checked.

Important note:

- most of these routes do not need multi-business query logic
- they need correct active-business resolution
- the audit goal is to ensure none of them still rely on "first admin row wins"

### Tier 1: Must change because they define or expose current business context

These are the most critical routes.

1. `apps/web/src/app/api/business/current/route.ts`
2. `apps/web/src/app/api/onboarding/route.ts`
3. `apps/web/src/app/api/shopify/install/route.ts`
4. any new route added for switching/listing businesses

Why Tier 1:

- these routes set up the current business lifecycle
- if they are wrong, the rest of the app scopes to the wrong business

### Tier 2: Must verify because they are admin-authenticated and implicitly business-scoped

#### Analytics APIs

- `apps/web/src/app/api/analytics/customers-by-day/route.ts`
- `apps/web/src/app/api/analytics/customers/frequency/route.ts`
- `apps/web/src/app/api/analytics/customers/new-vs-repeat/route.ts`
- `apps/web/src/app/api/analytics/customers/snapshot/route.ts`
- `apps/web/src/app/api/analytics/highlights/route.ts`
- `apps/web/src/app/api/analytics/insights/route.ts`
- `apps/web/src/app/api/analytics/loyalty/chart/route.ts`
- `apps/web/src/app/api/analytics/loyalty/overview/route.ts`
- `apps/web/src/app/api/analytics/loyalty/top-rewards/route.ts`
- `apps/web/src/app/api/analytics/referrals/monthly/route.ts`
- `apps/web/src/app/api/analytics/referrals/overview/route.ts`
- `apps/web/src/app/api/analytics/revenue/route.ts`
- `apps/web/src/app/api/analytics/rfm-stats/route.ts`
- `apps/web/src/app/api/analytics/segments/[segment]/route.ts`
- `apps/web/src/app/api/analytics/segments/route.ts`
- `apps/web/src/app/api/analytics/sku/category-breakdown/route.ts`
- `apps/web/src/app/api/analytics/sku/overview/route.ts`
- `apps/web/src/app/api/analytics/sku/top-items/route.ts`
- `apps/web/src/app/api/analytics/sku/trend/route.ts`
- `apps/web/src/app/api/analytics/weekly-trends/route.ts`

What to check:

- all use `context.business.id` only
- none query `db.admin.findFirst({ userId })` directly
- caches/query keys remain safe when active business switches

#### Audience and segmentation APIs

- `apps/web/src/app/api/audiences/preview/route.ts`
- `apps/web/src/app/api/segments/route.ts`
- `apps/web/src/app/api/segments/[id]/route.ts`

What to check:

- segment CRUD remains correctly scoped
- preview resolution cannot leak customers from another business after switch

#### Bills APIs

- `apps/web/src/app/api/bills/route.ts`
- `apps/web/src/app/api/bills/import/route.ts`
- `apps/web/src/app/api/bills/[id]/route.ts`
- `apps/web/src/app/api/bills/[id]/invoice/route.ts`
- `apps/web/src/app/api/bills/[id]/receipt/route.ts`

What to check:

- invoice/receipt generation uses active business branding/details
- import paths continue writing to only one business

#### Campaign APIs

- `apps/web/src/app/api/campaigns/route.ts`
- `apps/web/src/app/api/campaigns/[id]/route.ts`
- `apps/web/src/app/api/campaigns/revalidate-status/route.ts`

What to check:

- create/edit/list remain active-business scoped
- any background revalidation/status polling still targets current business correctly

#### Cashier management APIs under admin auth

- `apps/web/src/app/api/cashier/route.ts`
- `apps/web/src/app/api/cashier/[id]/route.ts`

What to check:

- cashier creation stays unique per active business
- admin cannot accidentally view/edit cashiers from another owned business unless switched there

#### Category APIs

- `apps/web/src/app/api/categories/route.ts`
- `apps/web/src/app/api/categories/[id]/route.ts`
- `apps/web/src/app/api/categories/import/route.ts`

#### Customer management APIs

- `apps/web/src/app/api/customers/route.ts`
- `apps/web/src/app/api/customers/import/route.ts`
- `apps/web/src/app/api/customers/[slugId]/route.ts`
- `apps/web/src/app/api/customers/[slugId]/activity/route.ts`
- `apps/web/src/app/api/customers/[slugId]/avatar/route.ts`
- `apps/web/src/app/api/customers/[slugId]/bills/route.ts`
- `apps/web/src/app/api/customers/[slugId]/profile/route.ts`

What to check:

- customer slug lookups remain limited by active business
- avatar uploads remain stored under correct business key path
- any customer merge/upsert logic does not cross businesses incorrectly

#### Feedback APIs

- `apps/web/src/app/api/feedback/config/route.ts`
- `apps/web/src/app/api/feedback/config/selection-options/route.ts`
- `apps/web/src/app/api/feedback/config/selection-options/[id]/route.ts`
- `apps/web/src/app/api/feedback/config/selection-options/reorder/route.ts`
- `apps/web/src/app/api/feedback/stats/route.ts`
- `apps/web/src/app/api/feedback/stats/[id]/route.ts`
- `apps/web/src/app/api/feedback/stats/category-wise/route.ts`
- `apps/web/src/app/api/feedback/stats/how-did-you-hear/route.ts`
- `apps/web/src/app/api/feedback/stats/overview/route.ts`
- `apps/web/src/app/api/feedback/stats/rating-trend/route.ts`
- `apps/web/src/app/api/feedback/stats/selection-options/route.ts`

What to check:

- all config/stats queries remain active-business scoped
- no stale cache after business switch

#### Loyalty APIs under admin auth

- `apps/web/src/app/api/loyalty/route.ts`
- `apps/web/src/app/api/loyalty-stats/route.ts`

What to check:

- reward stages, tiers, settings, and stats are all driven by active business

#### Message logs

- `apps/web/src/app/api/message-logs/route.ts`

#### Partnership APIs

- `apps/web/src/app/api/partnership/route.ts`
- `apps/web/src/app/api/partnership/[id]/route.ts`
- `apps/web/src/app/api/partnership/[id]/dissolve/route.ts`
- `apps/web/src/app/api/partnership/[id]/lock/route.ts`
- `apps/web/src/app/api/partnership/[id]/logs/route.ts`
- `apps/web/src/app/api/partnership/[id]/unlock-request/route.ts`
- `apps/web/src/app/api/partnership/campaigns/route.ts`
- `apps/web/src/app/api/partnership/campaigns/[id]/route.ts`
- `apps/web/src/app/api/partnership/logs/route.ts`
- `apps/web/src/app/api/partnership/requests/route.ts`
- `apps/web/src/app/api/partnership/requests/[id]/route.ts`
- `apps/web/src/app/api/partnership/settings/route.ts`

What to check:

- this area is especially sensitive because it already deals with multiple businesses conceptually
- active business must be explicit, otherwise the wrong side of a partnership could be mutated
- all `actorBusinessId`, receiver/sender checks, and membership checks must resolve from the selected business, not arbitrary first admin row

#### Referral APIs under admin auth

- `apps/web/src/app/api/referral/logs/route.ts`
- `apps/web/src/app/api/referral/program/route.ts`
- `apps/web/src/app/api/referral/stats/route.ts`

#### Shopify APIs under admin auth

- `apps/web/src/app/api/shopify/install/route.ts`
- `apps/web/src/app/api/shopify/stores/route.ts`
- `apps/web/src/app/api/shopify/stores/[id]/route.ts`
- `apps/web/src/app/api/shopify/sync/products/route.ts`

What to check:

- OAuth `state` and callback expectations must map to the selected business correctly
- listing/removing stores must be active-business scoped

#### SKU APIs

- `apps/web/src/app/api/sku/route.ts`
- `apps/web/src/app/api/sku/[id]/route.ts`
- `apps/web/src/app/api/sku/import/route.ts`

#### Storage API under admin auth

- `apps/web/src/app/api/storage/upload/route.ts`

What to check:

- generated R2 keys continue to use active business ID
- this must stay aligned with `.cursor/rules/r2-signed-url-flow.mdc`

### Tier 3: APIs probably do not need logic changes, but should be regression-checked

These are not admin-membership driven in the same way, but they depend on business data being correct elsewhere.

#### Cashier-authenticated APIs

- `apps/web/src/app/api/auth/cashier/login/route.ts`
- `apps/web/src/app/api/auth/cashier/logout/route.ts`
- `apps/web/src/app/api/cashier/bill/route.ts`
- `apps/web/src/app/api/cashier/bills/route.ts`
- `apps/web/src/app/api/cashier/bills/[id]/route.ts`
- `apps/web/src/app/api/cashier/bills/[id]/claim-free-item/route.ts`
- `apps/web/src/app/api/cashier/bills/[id]/finalize-earn/route.ts`
- `apps/web/src/app/api/cashier/bills/[id]/redeem/route.ts`
- `apps/web/src/app/api/cashier/bills/[id]/redeem-info/route.ts`
- `apps/web/src/app/api/cashier/customer/search/business-customer/route.ts`
- `apps/web/src/app/api/cashier/customer/search/other-customer/route.ts`
- `apps/web/src/app/api/cashier/loyalty/preview/route.ts`
- `apps/web/src/app/api/cashier/next-bill-number/route.ts`
- `apps/web/src/app/api/cashier/sku/route.ts`

Why regression-check only:

- cashier context already comes from `cashier.businessId`
- direct schema change is mostly on admin memberships
- still worth verifying because business creation/switching flows might affect cashier setup/management data

#### Public/customer-facing APIs

- `apps/web/src/app/api/customer/loyalty/route.ts`
- `apps/web/src/app/api/customer/loyalty/[businessSlug]/route.ts`
- `apps/web/src/app/api/feedback/[businessSlug]/[token]/route.ts`
- `apps/web/src/app/api/public/business/[slug]/register-info/route.ts`
- `apps/web/src/app/api/referral/program/[businessSlug]/route.ts`
- `apps/web/src/app/api/referral/program/by-claim/[referralSlug]/route.ts`
- `apps/web/src/app/api/referral/claim/route.ts`
- `apps/web/src/app/api/shopify/webhooks/orders/route.ts`

Why regression-check only:

- these resolve business by slug, token, linkage, or webhook data rather than admin membership
- they should still be validated after migration because business creation/admin ownership flows may affect setup timing and linked records

---

## Phase 7: Non-API Server Code That Must Be Updated

### Auth/business helpers

- `apps/web/src/lib/actions/auth.ts`
  - `findUnique({ where: { userId } })` must change

### Middleware

- `apps/web/src/lib/auth/middleware.ts`
  - core of the change

### Server pages that query admin directly

- `apps/web/src/app/(business)/campaigns/create/[id]/page.tsx`

Current issue:

- it directly does `db.admin.findFirst({ where: { userId }, select: { businessId: true } })`
- once an admin has multiple businesses, this page may load/edit a campaign from the wrong business

Action:

- switch it to the same active-business resolver used by middleware

### Possible other direct admin lookups

Audit any future `db.admin.findFirst/findUnique` usage across app code and replace one-row assumptions.

Known files from current scan:

- `apps/web/src/lib/actions/auth.ts`
- `apps/web/src/app/(business)/campaigns/create/[id]/page.tsx`
- `apps/web/src/lib/auth/middleware.ts`

---

## Phase 8: Frontend UX Changes

The backend cannot safely support one admin -> many businesses unless the UI can expose the selected business.

### Required UI changes

1. Add business switcher UI in admin shell, likely inside app layout/sidebar/header.
2. Add query/hook for business list.
3. Add mutation/hook for switching business.
4. Refresh/invalidate business-scoped pages after switch.

Likely UI touchpoints:

- `apps/web/src/app/(business)/layout.tsx`
- `apps/web/src/components/layouts/**`
- `apps/web/src/hooks/business/useCurrentBusiness.ts`
- settings/dashboard components that currently assume one business forever

### Existing screens that need behavior review

- `apps/web/src/components/settings/business/BusinessSettingsContainer.tsx`
- `apps/web/src/components/settings/business/BusinessExistingSettings.tsx`
- `apps/web/src/components/settings/business/BusinessOnboardingSettings.tsx`
- `apps/web/src/components/forms/onboarding/WelcomeForm.tsx`
- `apps/web/src/app/(auth)/login/_components/LoginPageClient.tsx`

Questions to answer during implementation:

1. Where does the business switcher live?
2. Should switching business full-refresh the app or just invalidate queries?
3. Should admin be able to create a new business from settings/sidebar?
4. When there are zero businesses, should the layout redirect to `/welcome` immediately?

---

## Phase 9: Query Cache and State Isolation

Potential issue:

- many frontend hooks likely use generic query keys without business ID because there was only one business context

Minimum safe strategy:

- on business switch, invalidate all business-scoped queries

Better long-term strategy:

- include `businessId` in query keys for business-scoped data

Examples:

- `["currentBusiness"]` can remain if it always means "active business"
- feature-specific caches may need to become:
  - `["campaigns", businessId, queryString]`
  - `["customers", businessId, queryString]`
  - `["feedbackConfig", businessId]`

This prevents stale UI when switching between businesses quickly.

---

## Phase 10: Data Migration and Backfill Plan

Because current data is simple, the DB migration itself is straightforward, but the active business selection still needs defaults.

### Data migration steps

1. Remove unique constraint on `admin.userId`.
2. Add composite unique on `admin(userId, businessId)`.
3. Leave existing admin rows as-is.

### Active business backfill/defaulting

If active business is stored in cookie/session:

- there is no DB backfill required
- first request after deploy can auto-select:
  - the only business if exactly one membership exists
  - first/recent business if multiple memberships exist and no selection exists

If active business is stored in DB:

- backfill active business for all admins from their current membership

Recommended first release behavior:

- auto-select the only business if exactly one membership exists
- if multiple memberships exist later, default to the most recently created membership and allow switching

---

## Phase 11: Testing Plan

### Unit/integration test scenarios

#### Schema and membership resolution

1. same user can have two admin rows for two different businesses
2. same user cannot have duplicate admin row for same business
3. admin with no memberships is allowed through optional-business auth only

#### Middleware

1. admin with one business gets that business in context
2. admin with multiple businesses and valid active business gets correct context
3. admin with invalid active business falls back safely
4. admin with no businesses gets `business: null` in optional middleware
5. admin route with required business returns appropriate error if none selected/available

#### Onboarding

1. first business creation still works
2. second business creation works if product allows it
3. newly created business becomes active
4. optional cashier creation attaches to newly created business

#### Current business APIs

1. `/api/business/current` returns selected business
2. updating current business updates only selected business
3. switching business changes subsequent `/api/business/current` response

#### Admin feature APIs

Smoke-test at least one route from each major domain after switch:

1. analytics
2. campaigns
3. customers
4. feedback
5. loyalty
6. referral
7. partnership
8. cashier management
9. categories/SKU
10. storage upload
11. shopify

### Manual QA checklist

1. login as admin with one business
2. login as admin with multiple businesses
3. switch business from dashboard
4. visit settings after switch
5. create/edit campaign after switch
6. create cashier in business A, confirm not visible in business B
7. view customers in business A and business B
8. update branding in business A, confirm business B unchanged
9. run partnership flows while switched to the correct business
10. verify storage uploads use correct `business/<businessId>/...` key prefix

---

## Risk Register

### High risk

1. Wrong business selected silently because middleware falls back to first membership.
2. Stale React Query cache shows data from previous business after switch.
3. Direct `db.admin.findFirst({ userId })` calls outside middleware continue using arbitrary membership.
4. Partnership actions mutate the wrong business side.
5. Shopify install/state ends up binding the store to the wrong selected business.

### Medium risk

1. Onboarding/login redirect loops for admins with zero vs multiple businesses.
2. Business settings UI still renders onboarding screen because current business selection was not established.
3. Generated types break across codebase because `User.admin` becomes `User.admins`.

### Low risk

1. Public/customer routes remain mostly unaffected if business records are intact.

---

## Suggested Implementation Order

This order respects the repo's architecture rule as closely as possible while accounting for auth/middleware work.

1. Prisma schema update plan
2. active business storage design
3. auth middleware refactor
4. `/api/business/current` plus new list/switch endpoints
5. auth helper and login flow changes
6. onboarding flow changes
7. direct server-page/admin lookup fixes
8. business switcher UI and hooks
9. admin API smoke audit by domain
10. cache hardening
11. tests and QA

---

## Concrete File Checklist

### Must change

- `packages/prisma/prisma/schema.prisma`
- `apps/web/src/lib/auth/middleware.ts`
- `apps/web/src/lib/actions/auth.ts`
- `apps/web/src/app/api/business/current/route.ts`
- `apps/web/src/app/api/onboarding/route.ts`
- `apps/web/src/hooks/business/useCurrentBusiness.ts`
- `apps/web/src/app/(auth)/login/_components/LoginPageClient.tsx`
- `apps/web/src/app/(business)/campaigns/create/[id]/page.tsx`

### Very likely add/change

- `apps/web/src/lib/auth/auth.ts`
- `apps/web/src/lib/utils/cookie.ts`
- `apps/web/src/app/(business)/layout.tsx`
- app layout/sidebar/header component files for switcher UI
- new business list/switch hooks
- new business list/switch API routes

### Admin APIs that must be audited after middleware change

- all admin-auth routes listed in Phase 6 Tier 1 and Tier 2

---

## Recommended First PR Scope

To reduce risk, do not ship everything in one giant PR.

Recommended PR split:

### PR 1

- Prisma schema relation changes
- active business resolution infrastructure
- middleware refactor
- `/api/business/current`
- auth helper/login fixes

### PR 2

- business list/switch APIs
- business switcher UI
- onboarding/add-business behavior

### PR 3

- admin API audit fixes
- cache/query-key hardening
- regression tests

This split keeps the critical auth/context change isolated first.

---

## Final Recommendation

The correct implementation is not "make `Admin.userId` non-unique and done".

The real complete change is:

1. convert `User -> Admin` to one-to-many
2. treat `Admin` as an admin-membership table
3. introduce active business selection
4. make middleware resolve the selected membership
5. audit every admin API route to ensure it scopes to the selected business
6. add UI support for business switching

If we skip step 3 and 4, the app will become nondeterministic because every `findFirst({ userId })` may pick the wrong business.
