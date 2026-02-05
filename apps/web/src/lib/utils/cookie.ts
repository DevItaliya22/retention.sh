/**
 * Centralized cookie naming for the app.
 * Admin, cashier, and customer use separate session cookies so the same browser
 * can hold all three sessions without conflict.
 */
export const COOKIE_PREFIX = "dy";

/** Admin (Better Auth) session cookie prefix. Final cookie: dy.admin.session_token */
export const ADMIN_COOKIE_PREFIX = "dy.admin";

/** Full name of admin session cookie (Better Auth uses .session_token suffix). */
export const ADMIN_SESSION_COOKIE_NAME = `${ADMIN_COOKIE_PREFIX}.session_token`;

/** Cashier session cookie (custom auth). */
export const CASHIER_SESSION_COOKIE_NAME = "dy.cashier.session.token";

/** Customer session cookie (custom auth). */
export const CUSTOMER_SESSION_COOKIE_NAME = "dy.customer.session.token";

/**
 * @deprecated Use ADMIN_SESSION_COOKIE_NAME, CASHIER_SESSION_COOKIE_NAME, or CUSTOMER_SESSION_COOKIE_NAME.
 * Kept for backwards compatibility during migration.
 */
export const SESSION_COOKIE_NAME = `${COOKIE_PREFIX}.session.token`;

/** Options to clear a session cookie (maxAge 0, expires past). */
export const CLEAR_SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
  maxAge: 0,
  expires: new Date(0),
};
