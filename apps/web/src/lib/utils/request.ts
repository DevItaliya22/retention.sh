/**
 * Request utilities for extracting information from HTTP requests.
 */

// =============================================================================
// IP ADDRESS
// =============================================================================

const IP_HEADERS = ["x-forwarded-for", "x-real-ip", "cf-connecting-ip"];

/**
 * Extracts the client IP address from request headers.
 * Checks common proxy headers in order of preference.
 */
export function getIpAddress(request: Request): string | null {
  const headers = request.headers;

  for (const header of IP_HEADERS) {
    const value = headers.get(header);
    if (value) {
      // x-forwarded-for can contain multiple IPs, take the first one
      const ip = value.split(",")[0]?.trim();
      if (ip) return ip;
    }
  }

  return null;
}

// =============================================================================
// COOKIE PARSING
// =============================================================================

/**
 * Parses a session token from a cookie header string.
 *
 * @param cookieHeader - The raw cookie header string
 * @param cookieName - The name of the session cookie to find
 * @returns The session token or null if not found
 */
export function parseSessionToken(
  cookieHeader: string | null,
  cookieName: string,
): string | null {
  if (!cookieHeader) {
    return null;
  }

  const cookie = cookieHeader
    .split(";")
    .find((c) => c.trim().startsWith(`${cookieName}=`));

  if (!cookie) {
    return null;
  }

  const token = cookie.split("=")[1];
  return token || null;
}

// =============================================================================
// SECURE CONTEXT
// =============================================================================

/**
 * Determines if cookies should be set with the Secure flag.
 * In production, always returns true. In development, returns false.
 */
export function isSecureContext(): boolean {
  return process.env.NODE_ENV === "production";
}
