import { CUSTOMER_SESSION_COOKIE_NAME } from "@/lib/utils/cookie";
import { parseSessionToken } from "@/lib/utils/request";
import { db } from "@reelo/db";
import { headers } from "next/headers";

// =============================================================================
// TYPES
// =============================================================================

export type CustomerSessionData = {
  user: { id: string; name: string; email: string | null; role: string };
  session: { id: string; token: string; expiresAt: Date; role: string };
};

// =============================================================================
// INTERNAL IMPLEMENTATION
// =============================================================================

/**
 * Internal function that retrieves customer session from a cookie header.
 * This is the core implementation used by both public functions.
 */
async function _getCustomerSessionFromCookie(
  cookieHeader: string | null,
): Promise<CustomerSessionData | null> {
  const sessionToken = parseSessionToken(
    cookieHeader,
    CUSTOMER_SESSION_COOKIE_NAME,
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

  if (role !== "CUSTOMER") {
    return null;
  }

  return {
    user: {
      id: sessionRecord.user.id,
      name: sessionRecord.user.name,
      email: sessionRecord.user.email,
      role,
    },
    session: {
      id: sessionRecord.id,
      token: sessionRecord.token,
      expiresAt: sessionRecord.expiresAt,
      role,
    },
  };
}

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Gets the customer session for Server Components.
 * Uses Next.js `headers()` to get the cookie header.
 *
 * @example
 * ```tsx
 * // In a Server Component
 * const session = await getCustomerSession();
 * if (!session) redirect('/loyalty/login');
 * ```
 */
export async function getCustomerSession(): Promise<CustomerSessionData | null> {
  const headersList = await headers();
  const cookieHeader = headersList.get("cookie");
  return _getCustomerSessionFromCookie(cookieHeader);
}

/**
 * Gets the customer session from a cookie header string.
 * Use this in API routes, middleware, or proxy where you have access to request headers.
 *
 * @example
 * ```ts
 * // In an API route or middleware
 * const cookieHeader = request.headers.get("cookie");
 * const session = await getCustomerSessionFromHeaders(cookieHeader);
 * ```
 */
export async function getCustomerSessionFromHeaders(
  cookieHeader: string | null,
): Promise<CustomerSessionData | null> {
  return _getCustomerSessionFromCookie(cookieHeader);
}
