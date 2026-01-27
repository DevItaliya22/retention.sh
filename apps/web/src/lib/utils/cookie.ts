/**
 * Centralized cookie naming for the app.
 * Change COOKIE_PREFIX (or SESSION_COOKIE_NAME) here to update cookie names globally.
 */
export const COOKIE_PREFIX = "dy";

/** Full name of the session cookie (used for set/delete and when parsing Cookie header). */
export const SESSION_COOKIE_NAME = `${COOKIE_PREFIX}.session.token`;
