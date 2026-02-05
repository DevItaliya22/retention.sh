import {
  ADMIN_COOKIE_PREFIX,
  ADMIN_SESSION_COOKIE_NAME,
  CASHIER_SESSION_COOKIE_NAME,
  CLEAR_SESSION_COOKIE_OPTIONS,
  CUSTOMER_SESSION_COOKIE_NAME,
} from "@/lib/utils/cookie";
import { db } from "@reelo/db";
import { getSessionCookie } from "better-auth/cookies";
import { NextRequest, NextResponse } from "next/server";

type Role = "admin" | "cashier" | "customer" | "all";

/**
 * Revokes the session for a specific role (or all roles if not specified).
 *
 * Body: { role?: "admin" | "cashier" | "customer" | "all" }
 * - If role is specified, only that role's session is revoked
 * - If role is "all" or not specified, all sessions are revoked (backward compatible)
 */
export async function POST(request: NextRequest) {
  let role: Role = "all";

  try {
    const body = await request.json();
    if (
      body.role &&
      ["admin", "cashier", "customer", "all"].includes(body.role)
    ) {
      role = body.role;
    }
  } catch {
    // No body or invalid JSON - default to "all" for backward compatibility
  }

  const response = NextResponse.json({ success: true });

  if (role === "admin" || role === "all") {
    const adminToken = getSessionCookie(request, {
      cookiePrefix: ADMIN_COOKIE_PREFIX,
    });
    if (adminToken) {
      await db.session.deleteMany({ where: { token: adminToken } });
    }
    response.cookies.set(
      ADMIN_SESSION_COOKIE_NAME,
      "",
      CLEAR_SESSION_COOKIE_OPTIONS,
    );
  }

  if (role === "cashier" || role === "all") {
    const cashierToken = request.cookies.get(
      CASHIER_SESSION_COOKIE_NAME,
    )?.value;
    if (cashierToken) {
      await db.session.deleteMany({ where: { token: cashierToken } });
    }
    response.cookies.set(
      CASHIER_SESSION_COOKIE_NAME,
      "",
      CLEAR_SESSION_COOKIE_OPTIONS,
    );
  }

  if (role === "customer" || role === "all") {
    const customerToken = request.cookies.get(
      CUSTOMER_SESSION_COOKIE_NAME,
    )?.value;
    if (customerToken) {
      await db.session.deleteMany({ where: { token: customerToken } });
    }
    response.cookies.set(
      CUSTOMER_SESSION_COOKIE_NAME,
      "",
      CLEAR_SESSION_COOKIE_OPTIONS,
    );
  }

  return response;
}

/**
 * GET also supported for redirect flows (e.g. link from email).
 * GET always revokes all sessions (no body to specify role).
 */
export async function GET(request: NextRequest) {
  const adminToken = getSessionCookie(request, {
    cookiePrefix: ADMIN_COOKIE_PREFIX,
  });
  const cashierToken = request.cookies.get(CASHIER_SESSION_COOKIE_NAME)?.value;
  const customerToken = request.cookies.get(
    CUSTOMER_SESSION_COOKIE_NAME,
  )?.value;

  const tokens = [adminToken, cashierToken, customerToken].filter(
    Boolean,
  ) as string[];

  if (tokens.length > 0) {
    await db.session.deleteMany({ where: { token: { in: tokens } } });
  }

  const response = NextResponse.json({ success: true });

  response.cookies.set(
    ADMIN_SESSION_COOKIE_NAME,
    "",
    CLEAR_SESSION_COOKIE_OPTIONS,
  );
  response.cookies.set(
    CASHIER_SESSION_COOKIE_NAME,
    "",
    CLEAR_SESSION_COOKIE_OPTIONS,
  );
  response.cookies.set(
    CUSTOMER_SESSION_COOKIE_NAME,
    "",
    CLEAR_SESSION_COOKIE_OPTIONS,
  );

  return response;
}
