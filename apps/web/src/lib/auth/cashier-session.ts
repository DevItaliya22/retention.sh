import { CASHIER_SESSION_COOKIE_NAME } from "@/lib/utils/cookie";
import { parseSessionToken } from "@/lib/utils/request";
import { db } from "@reelo/db";
import { headers } from "next/headers";

// =============================================================================
// TYPES
// =============================================================================

export type CashierSessionData = {
  user: { id: string; name: string; email: string | null; role: string };
  session: { id: string; token: string; expiresAt: Date; role: string };
};

// =============================================================================
// INTERNAL IMPLEMENTATION
// =============================================================================

/**
 * Internal function that retrieves cashier session from a cookie header.
 * This is the core implementation used by both public functions.
 */
async function _getCashierSessionFromCookie(
  cookieHeader: string | null,
): Promise<CashierSessionData | null> {
  const sessionToken = parseSessionToken(
    cookieHeader,
    CASHIER_SESSION_COOKIE_NAME,
  );

  if (!sessionToken) {
    return null;
  }

  const sessionRecord = await db.session.findUnique({
    where: { token: sessionToken },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });

  if (!sessionRecord || sessionRecord.expiresAt <= new Date()) {
    return null;
  }

  const role = sessionRecord.role || sessionRecord.user.role;

  if (role !== "CASHIER") {
    return null;
  }

  // Cashiers store login email on Cashier record, not User
  const cashier = await db.cashier.findUnique({
    where: { userId: sessionRecord.userId },
    select: { email: true },
  });
  const displayEmail = cashier?.email ?? sessionRecord.user.email;

  return {
    user: {
      id: sessionRecord.user.id,
      name: sessionRecord.user.name,
      email: displayEmail,
      role: role,
    },
    session: {
      id: sessionRecord.id,
      token: sessionRecord.token,
      expiresAt: sessionRecord.expiresAt,
      role: role,
    },
  };
}

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Gets the cashier session for Server Components.
 * Uses Next.js `headers()` to get the cookie header.
 *
 * @example
 * ```tsx
 * // In a Server Component
 * const session = await getCashierSession();
 * if (!session) redirect('/login');
 * ```
 */
export async function getCashierSession(): Promise<CashierSessionData | null> {
  const headersList = await headers();
  const cookieHeader = headersList.get("cookie");
  return _getCashierSessionFromCookie(cookieHeader);
}

/**
 * Gets the cashier session from a cookie header string.
 * Use this in API routes, middleware, or proxy where you have access to request headers.
 *
 * @example
 * ```ts
 * // In an API route or middleware
 * const cookieHeader = request.headers.get("cookie");
 * const session = await getCashierSessionFromHeaders(cookieHeader);
 * ```
 */
export async function getCashierSessionFromHeaders(
  cookieHeader: string | null,
): Promise<CashierSessionData | null> {
  return _getCashierSessionFromCookie(cookieHeader);
}
