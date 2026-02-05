# Authentication System Analysis

## Overview

This document analyzes the authentication system for the three user roles: **ADMIN**, **CASHIER**, and **CUSTOMER**. Each role has its own session management and can co-exist in the same browser.

---

## Architecture Summary

| Role     | Auth Method                               | Session Cookie              | Route Group                  |
| -------- | ----------------------------------------- | --------------------------- | ---------------------------- |
| ADMIN    | Better Auth (magic link + email/password) | `dy.admin.session_token`    | `(admin-auth)`, `(business)` |
| CASHIER  | Custom (email/password)                   | `dy.cashier.session.token`  | `(cashier)`                  |
| CUSTOMER | Custom (OTP via phone)                    | `dy.customer.session.token` | `(customer)`                 |

---

## SECURITY VULNERABILITIES

### 🔴 CRITICAL

#### 1. Plaintext Password Comparison

**File:** `@apps/web/src/lib/auth/auth.ts` (lines 231-235)

```typescript
if (cashier.password !== password) {
  return { success: false, error: "Invalid password" };
}
```

**Issue:** Cashier passwords are stored in PLAINTEXT and compared directly. This is a severe security vulnerability.

**Fix:**

- Hash passwords using `bcrypt` or `argon2` before storing
- Compare using constant-time comparison to prevent timing attacks

---

#### 2. Session Token Parsing Vulnerability

**Files:**

- `@apps/web/src/lib/auth/cashier-session.ts` (lines 14-17, 77-80)
- `@apps/web/src/lib/auth/customer-session.ts` (lines 16-19)

```typescript
const sessionToken = cookieHeader
  .split(";")
  .find((c) => c.trim().startsWith(`${COOKIE_NAME}=`))
  ?.split("=")[1];
```

**Issue:** Naive cookie parsing that doesn't handle edge cases (URL-encoded values, malformed cookies, etc.)

**Fix:** Use a proper cookie parsing library or `better-auth/cookies` for consistency

---

#### 3. Error Message Information Leakage

**File:** `@apps/web/src/lib/auth/auth.ts` (lines 186-214)

**Issue:** Detailed error messages reveal system state:

- "Business not found" → Confirms business existence
- "Cashier not found in this business" → Confirms business exists but cashier doesn't
- "Invalid email for this cashier" → Confirms cashier exists

**Fix:** Use generic "Invalid credentials" for all auth failures

---

### 🟡 MEDIUM

#### 4. Missing Rate Limiting for Custom Auth

**Files:**

- `@apps/web/src/app/api/cashier/auth/login/route.ts`
- `@apps/web/src/app/api/customer/auth/verify-otp/route.ts`

**Issue:** Better Auth has rate limiting configured, but custom cashier/customer auth endpoints have NO rate limiting. This allows brute force attacks.

**Fix:** Implement rate limiting middleware or use `upstash/ratelimit`

---

#### 5. Session Token Entropy

**Files:**

- `@apps/web/src/app/api/cashier/auth/login/route.ts` (line 81)
- `@apps/web/src/app/api/customer/auth/verify-otp/route.ts` (line 107)

```typescript
const token = randomBytes(32).toString("hex");
```

**Issue:** While 32 bytes is acceptable, the token generation is duplicated across files. Session creation logic should be centralized.

---

#### 6. Missing CSRF Protection

**Files:** All POST endpoints for custom auth

**Issue:** No CSRF token validation on custom auth endpoints. Cookie-based auth is vulnerable to CSRF.

**Fix:** Implement CSRF tokens or use `SameSite=Strict` consistently (already using `strict`, so lower priority)

---

### 🟢 LOW

#### 7. IP Address Tracking Inconsistency

**File:** `@apps/web/src/app/api/cashier/auth/login/route.ts` (lines 12-25)

**Issue:** `getIpAddress` helper is duplicated in multiple files. Should be centralized.

---

## CODE ORGANIZATION ISSUES

### 1. Misplaced Functions

#### `validateCashierLogin` in wrong file

**Current:** `@apps/web/src/lib/auth/auth.ts` (lines 173-259)

**Problem:** This function handles cashier-specific validation but lives in the main Better Auth config file. It pollutes the core auth configuration.

**Fix:** Move to `@apps/web/src/lib/auth/cashier/validate-login.ts`

---

#### Duplicate Session Functions

**File:** `@apps/web/src/lib/auth/cashier-session.ts`

**Current State:**

- `getCashierSession()` - Uses `headers()` from next/headers (lines 10-68)
- `getCashierSessionFromHeaders(cookieHeader)` - Takes cookie header directly (lines 70-131)

**Problem:** 95% duplicate code. The difference is only how the cookie header is obtained.

**Why both exist:**

- `getCashierSession()` → For Server Components (uses `headers()`)
- `getCashierSessionFromHeaders()` → For API routes/middleware (request headers available)

**Fix:** Refactor to single internal function with wrapper:

```typescript
// Internal implementation
async function _getCashierSessionFromCookie(cookieHeader: string | null);

// For Server Components
export async function getCashierSession() {
  const headersList = await headers();
  return _getCashierSessionFromCookie(headersList.get("cookie"));
}

// For API routes/middleware
export async function getCashierSessionFromHeaders(
  cookieHeader: string | null,
) {
  return _getCashierSessionFromCookie(cookieHeader);
}
```

---

#### Customer Session Missing `getCustomerSession()`

**File:** `@apps/web/src/lib/auth/customer-session.ts`

**Issue:** Only has `getCustomerSessionFromHeaders()`, missing the Server Component version that cashier-session has. This is inconsistent.

**Fix:** Add `getCustomerSession()` for consistency if used in Server Components

---

### 2. Email System Architecture

**File:** `@apps/web/src/lib/auth/send-magic-link-email.ts`

**Current Problems:**

1. HTML template hardcoded inline (lines 24-28)
2. No separation between email sending logic and email content
3. No React Email components (violates monorepo best practice)
4. `from` email is hardcoded as "Acme" (line 21)
5. DEV/PROD logic is backwards - should ONLY log in DEV, currently logs warning in PROD too

**Required Structure:**

```
packages/
├── transactional/           # New package for emails
│   ├── emails/
│   │   ├── MagicLinkEmail.tsx
│   │   └── index.ts
│   └── package.json

apps/web/src/lib/
├── email/
│   ├── send-email.ts        # DAD function - core email sender
│   ├── magic-link.ts        # Uses DAD + MagicLinkEmail component
│   └── index.ts
```

**DAD Function Pattern:**

```typescript
// send-email.ts
interface SendEmailOptions {
  to: string | string[];
  subject: string;
  react: React.ReactElement;
  from?: string;
}

export async function sendEmail(
  options: SendEmailOptions,
): Promise<{ success: boolean; error?: string }> {
  const isDev = process.env.NODE_ENV !== "production";

  // In DEV, log and return success
  if (isDev && !process.env.RESEND_API_KEY) {
    console.log("[email] Would send email:", {
      to: options.to,
      subject: options.subject,
    });
    return { success: true };
  }

  // In PROD, actually send via Resend
  const resend = new Resend(process.env.RESEND_API_KEY);
  // ... send logic
}
```

---

### 3. Proxy (Middleware) Issues

**File:** `@apps/web/src/proxy.ts`

#### Missing Customer Route Protection

**Current:** Only protects admin routes and cashier routes. Customer routes (`/loyalty/*`) have NO protection in proxy.

**Fix:** Add customer route protection similar to cashier routes

#### Incomplete Admin Route Protection

**Current protected routes (lines 7-14):**

```typescript
const protectedAdminRoutes = [
  "/",
  "/inbox",
  "/welcome",
  "/bills",
  "/customers",
  "/referral-stats",
];
```

**Missing:** `/settings/*` routes are handled separately via `pathname.startsWith("/settings")` - this is correct but should be documented.

#### No Matcher Config

**Issue:** `proxy.ts` doesn't export a `config.matcher`, meaning it runs on EVERY request including static assets.

**Fix:** Add matcher to exclude static files:

```typescript
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

---

### 4. File Structure Issues

**Current auth folder:**

```
lib/auth/
├── auth.ts              # Better Auth config + misplaced cashier validation
├── auth-client.ts       # Client-side auth
├── cashier-session.ts   # Cashier session management
├── customer-session.ts  # Customer session management
├── middleware.ts        # Auth context types + wrapper functions (484 lines!)
└── send-magic-link-email.ts  # Email sending (should be in email folder)
```

**Proposed structure:**

```
lib/auth/
├── index.ts             # Re-exports
├── auth.ts              # Better Auth config ONLY
├── auth-client.ts       # Client-side auth
├── middleware/
│   ├── index.ts
│   ├── types.ts         # Context types
│   ├── admin.ts         # withAdminAuth, withAdminAuthOptionalBusiness
│   ├── cashier.ts       # withCashierAuth
│   └── customer.ts      # withCustomerAuth
├── cashier/
│   ├── index.ts
│   ├── session.ts       # getCashierSession, getCashierSessionFromHeaders
│   └── validate-login.ts # validateCashierLogin
└── customer/
    ├── index.ts
    └── session.ts       # getCustomerSession, getCustomerSessionFromHeaders
```

---

## DEV vs PROD Behavior

### Magic Link Email

**File:** `@apps/web/src/lib/auth/send-magic-link-email.ts`

**Current behavior:**

- If `RESEND_API_KEY` exists → Sends email (correct)
- If no API key + DEV → Logs URL (correct)
- If no API key + PROD → Logs warning (incorrect - should throw error or have fallback)

**Expected behavior:**

- PROD: ALWAYS send via Resend (throw error if not configured)
- DEV: Log URL to console (never send real email unless explicitly configured)

---

### Secure Cookies (`useSecureCookies`)

**File:** `@apps/web/src/lib/auth/auth.ts` (line 65)

```typescript
useSecureCookies: process.env.NODE_ENV === "production",
```

**What `useSecureCookies: true` does:**

- Adds `__Secure-` prefix to cookie names (e.g., `__Secure-dy.admin.session_token`)
- This prefix tells browsers to ONLY accept the cookie if set over HTTPS
- Adds extra validation that cookie was set by a secure origin

**Is it necessary?**

- **NO, not strictly necessary** if we properly set:
  - `httpOnly: true` - Prevents JavaScript access (XSS protection)
  - `secure: true` in production - Only sent over HTTPS
  - `sameSite: 'strict'` - CSRF protection

**Recommendation:** REMOVE `useSecureCookies` (set to `false`) to simplify cookie names. The `Secure` flag alone is sufficient. Having `__Secure-` prefix makes debugging harder and cookie names inconsistent between dev/prod.

---

### Session Creation

**Files:** Custom auth routes

**Current:** `isSecureContext()` checks protocol OR `NODE_ENV`:

```typescript
return url.protocol === "https:" || process.env.NODE_ENV === "production";
```

**Issue:** In production with a proxy, `url.protocol` might be `http:` but the actual connection is HTTPS.

**Fix:** Simplify to just use `NODE_ENV`:

```typescript
const isSecure = process.env.NODE_ENV === "production";
```

---

## API CONSOLIDATION PLAN

### Current API Structure (Scattered)

```
api/
├── auth/
│   ├── [...all]/route.ts      # Better Auth (admin)
│   └── revoke/route.ts        # Unified session revoke
├── cashier/
│   └── auth/
│       ├── login/route.ts     # Cashier login
│       └── logout/route.ts    # Cashier logout
└── customer/
    └── auth/
        ├── request-otp/route.ts  # Customer OTP request
        ├── verify-otp/route.ts   # Customer OTP verify
        └── logout/route.ts       # Customer logout
```

### Proposed API Structure (Consolidated)

```
api/auth/
├── admin/
│   └── [...all]/route.ts      # Better Auth (admin) - moved from /api/auth/[...all]
├── cashier/
│   ├── login/route.ts         # Cashier login
│   └── logout/route.ts        # Cashier logout
├── customer/
│   ├── request-otp/route.ts   # Customer OTP request
│   ├── verify-otp/route.ts    # Customer OTP verify
│   └── logout/route.ts        # Customer logout
└── revoke/route.ts            # Unified session revoke (keep as is)
```

### Frontend Changes Required

| Old Endpoint                     | New Endpoint                     | Files to Update                                                             |
| -------------------------------- | -------------------------------- | --------------------------------------------------------------------------- |
| `/api/auth/*` (Better Auth)      | `/api/auth/admin/*`              | `@apps/web/src/lib/auth/auth-client.ts` - add `basePath: "/api/auth/admin"` |
| `/api/cashier/auth/login`        | `/api/auth/cashier/login`        | `@apps/web/src/hooks/cashier/useCashierAuth.ts`                             |
| `/api/cashier/auth/logout`       | `/api/auth/cashier/logout`       | `@apps/web/src/app/(cashier)/cashier/.../CashierLogoutButton.tsx`           |
| `/api/customer/auth/request-otp` | `/api/auth/customer/request-otp` | `@apps/web/src/app/(customer)/loyalty/login/LoyaltyLoginPageClient.tsx`     |
| `/api/customer/auth/verify-otp`  | `/api/auth/customer/verify-otp`  | `@apps/web/src/app/(customer)/loyalty/login/LoyaltyLoginPageClient.tsx`     |
| `/api/customer/auth/logout`      | `/api/auth/customer/logout`      | (find usages)                                                               |

### Better Auth Client Config Change

```typescript
// @apps/web/src/lib/auth/auth-client.ts
export const authClient = createAuthClient({
  basePath: "/api/auth/admin",  // ADD THIS LINE
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || ...
  plugins: [magicLinkClient()],
});
```

### Better Auth Server Config Change

```typescript
// @apps/web/src/lib/auth/auth.ts
export const auth = betterAuth({
  basePath: "/api/auth/admin", // ADD THIS LINE
  // ... rest of config
});
```

---

## TODO LIST

### ✅ COMPLETED: API Consolidation (All auth under `/api/auth/`)

- [x] **Move Better Auth to `/api/auth/admin/`**
  - Created `@apps/web/src/app/api/auth/admin/[...all]/route.ts`
  - Deleted old `@apps/web/src/app/api/auth/[...all]/route.ts`
  - Updated `@apps/web/src/lib/auth/auth.ts` - added `basePath: "/api/auth/admin"`
  - Updated `@apps/web/src/lib/auth/auth-client.ts` - added `basePath: "/api/auth/admin"`

- [x] **Move cashier auth to `/api/auth/cashier/`**
  - Created `@apps/web/src/app/api/auth/cashier/login/route.ts`
  - Created `@apps/web/src/app/api/auth/cashier/logout/route.ts`
  - Updated `@apps/web/src/hooks/cashier/useCashierAuth.ts`
  - Updated `@apps/web/src/app/(cashier)/.../CashierLogoutButton.tsx`
  - Deleted old routes under `/api/cashier/auth/`

- [x] **Move customer auth to `/api/auth/customer/`**
  - Created `@apps/web/src/app/api/auth/customer/request-otp/route.ts`
  - Created `@apps/web/src/app/api/auth/customer/verify-otp/route.ts`
  - Created `@apps/web/src/app/api/auth/customer/logout/route.ts`
  - Updated `@apps/web/src/app/(customer)/loyalty/login/LoyaltyLoginPageClient.tsx`
  - Deleted old routes under `/api/customer/auth/`

- [x] **Updated `/api/auth/revoke`** - Now role-specific (pass `{ role: "admin" | "cashier" | "customer" }`)

### ✅ COMPLETED: Cookie & Session Fixes

- [x] **Removed `useSecureCookies`** - Set to `false` (Secure flag alone is sufficient)
  - File: `@apps/web/src/lib/auth/auth.ts`

- [x] **Simplified `isSecureContext()`** - Now uses only `NODE_ENV`
  - Files: All new auth route files

### ✅ COMPLETED: Proxy & Route Protection

- [x] **Added matcher config** to exclude static files and API routes
  - File: `@apps/web/src/proxy.ts`

- [x] **Added customer route protection** in proxy.ts
  - `/loyalty/login` is public
  - Other `/loyalty/*` routes require CUSTOMER session

### 🔴 REMAINING: Security Fixes (HIGH PRIORITY)

- [ ] **Hash cashier passwords** - Implement bcrypt/argon2 hashing
  - File: `@apps/web/src/lib/auth/auth.ts` (validateCashierLogin)

- [ ] **Add rate limiting to custom auth endpoints**
  - Files: All routes under `@apps/web/src/app/api/auth/cashier/` and `@apps/web/src/app/api/auth/customer/`

- [ ] **Sanitize auth error messages** to prevent information leakage
  - File: `@apps/web/src/lib/auth/auth.ts` (validateCashierLogin)

### 🟡 REMAINING: Code Organization

- [ ] **Move `validateCashierLogin`** to `lib/auth/cashier/validate-login.ts`

- [ ] **Refactor cashier-session.ts** - Eliminate duplicate code

- [ ] **Add `getCustomerSession()`** to customer-session.ts for consistency

- [ ] **Split middleware.ts** into smaller focused files

### 🟡 REMAINING: Email System

- [ ] **Create `packages/transactional`** package for React Email components

- [ ] **Create email folder structure** in `lib/email/`
  - `send-email.ts` - DAD function
  - `magic-link.ts` - Magic link specific

- [ ] **Fix DEV/PROD email behavior**

### 🟢 REMAINING: Utilities (Low Priority)

- [ ] **Centralize `getIpAddress`** helper function

- [ ] **Centralize session token creation** logic

- [ ] **Use proper cookie parsing** library

---

## Questions to Clarify

1. **Why do cashier and customer use custom auth instead of Better Auth?**
   - Is it intentional to avoid the complexity of multi-tenant Better Auth?
   - Should we migrate to Better Auth for all roles?

2. **Session expiry duration**
   - Admin: Configured in Better Auth (`freshAge: 1 day`)
   - Cashier/Customer: Hardcoded 24 hours
   - Should these be configurable via env vars?

3. **Customer route protection**
   - Currently no protection in proxy.ts for `/loyalty/*` routes
   - Is this intentional (some routes are public)?

---

## Summary

The authentication system has a solid foundation but needs cleanup:

1. **Security:** Password hashing and rate limiting are critical fixes
2. **Organization:** Too much code in single files, need better separation
3. **Email:** Needs proper React Email setup with monorepo structure
4. **Consistency:** Cashier and customer session handling should follow same patterns
5. **Proxy:** Missing route protection and performance optimizations

The session cookie naming convention (`dy.admin.*`, `dy.cashier.*`, `dy.customer.*`) is well-designed for multi-role browser co-existence.
