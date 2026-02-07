import { auth } from "@/lib/auth/auth";
import { getCashierSessionFromHeaders } from "@/lib/auth/cashier-session";
import { getCustomerSessionFromHeaders } from "@/lib/auth/customer-session";
import { parseCashierRoute } from "@/lib/utils/cashier-routes";
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

// =============================================================================
// ROUTE PROTECTION CONFIGURATION
// =============================================================================

/**
 * Admin routes - require ADMIN session
 * These are pages in the (business) route group
 */
const protectedAdminRoutes = [
  "/",
  "/inbox",
  "/welcome",
  "/bills",
  "/customers",
  "/referral-stats",
  "/loyalty-stats",
];

/**
 * Auth routes - only accessible when NOT logged in (admin)
 * Redirect to home if already logged in
 */
const adminAuthRoutes = ["/login", "/register"];

/**
 * Cashier sub-paths that require CASHIER session
 * These are relative paths after /cashier/[businessSlug]/[cashierSlug]/
 */
const protectedCashierSubPaths = ["/home"];

/**
 * Customer routes that require CUSTOMER session
 * - /loyalty is allowed (list when session, or "use business link" when not)
 * - /loyalty/[businessSlug]/login is public
 * - /loyalty/[businessSlug] (detail) requires session → redirect to .../login
 */

// =============================================================================
// PROXY FUNCTION
// =============================================================================

export async function proxy(req: NextRequest) {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;

  // Get admin session cookie (Better Auth)
  const adminSessionCookie = getSessionCookie(req, {
    cookiePrefix: ADMIN_COOKIE_PREFIX,
  });

  // ---------------------------------------------------------------------------
  // CASHIER ROUTE PROTECTION
  // ---------------------------------------------------------------------------
  const cashierRoute = parseCashierRoute(pathname);

  if (cashierRoute) {
    const { businessSlug, cashierSlug, subPath } = cashierRoute;
    const cookieHeader = req.headers.get("cookie");
    const cashierSession = await getCashierSessionFromHeaders(cookieHeader);

    // Check if this sub-path requires protection
    const isProtectedSubPath = protectedCashierSubPaths.some(
      (route) => subPath === route || subPath.startsWith(`${route}/`),
    );

    if (isProtectedSubPath) {
      if (!cashierSession || cashierSession.user.role !== "CASHIER") {
        const cashierToken = req.cookies.get(
          CASHIER_SESSION_COOKIE_NAME,
        )?.value;
        if (cashierToken) {
          await db.session.deleteMany({ where: { token: cashierToken } });
        }
        const redirect = NextResponse.redirect(
          new URL(`/cashier/${businessSlug}/${cashierSlug}/`, req.url),
        );
        redirect.cookies.set(
          CASHIER_SESSION_COOKIE_NAME,
          "",
          CLEAR_SESSION_COOKIE_OPTIONS,
        );
        return redirect;
      }
    }

    return NextResponse.next();
  }

  // ---------------------------------------------------------------------------
  // CUSTOMER ROUTE PROTECTION
  // ---------------------------------------------------------------------------
  if (pathname.startsWith("/loyalty")) {
    // Legacy: /loyalty/login → redirect to /loyalty or /loyalty/[business]/login
    if (pathname === "/loyalty/login") {
      const business = nextUrl.searchParams.get("business");
      const target = business
        ? `/loyalty/${encodeURIComponent(business)}/login`
        : "/loyalty";
      const redirectUrl = new URL(target, req.url);
      if (business) {
        nextUrl.searchParams.forEach((v, k) => {
          if (k !== "business") redirectUrl.searchParams.set(k, v);
        });
      }
      return NextResponse.redirect(redirectUrl);
    }

    // /loyalty/[businessSlug]/login: if already logged in, redirect to dashboard
    const loginMatch = pathname.match(/^\/loyalty\/([^/]+)\/login$/);
    if (loginMatch) {
      const cookieHeader = req.headers.get("cookie");
      const customerSession = await getCustomerSessionFromHeaders(cookieHeader);
      if (customerSession && customerSession.user.role === "CUSTOMER") {
        return NextResponse.redirect(
          new URL(`/loyalty/${loginMatch[1]}`, req.url),
        );
      }
      return NextResponse.next();
    }

    // /loyalty/[businessSlug] (detail) requires customer session
    const detailMatch = pathname.match(/^\/loyalty\/([^/]+)$/);
    if (detailMatch) {
      const cookieHeader = req.headers.get("cookie");
      const customerSession = await getCustomerSessionFromHeaders(cookieHeader);

      if (!customerSession || customerSession.user.role !== "CUSTOMER") {
        const customerToken = req.cookies.get(
          CUSTOMER_SESSION_COOKIE_NAME,
        )?.value;
        if (customerToken) {
          await db.session.deleteMany({ where: { token: customerToken } });
        }
        const redirect = NextResponse.redirect(
          new URL(`/loyalty/${detailMatch[1]}/login`, req.url),
        );
        redirect.cookies.set(
          CUSTOMER_SESSION_COOKIE_NAME,
          "",
          CLEAR_SESSION_COOKIE_OPTIONS,
        );
        return redirect;
      }
    }

    return NextResponse.next();
  }

  // ---------------------------------------------------------------------------
  // ADMIN ROUTE PROTECTION
  // ---------------------------------------------------------------------------
  const isProtectedAdminRoute =
    protectedAdminRoutes.includes(pathname) ||
    pathname.startsWith("/bills/") ||
    pathname.startsWith("/customers/") ||
    pathname.startsWith("/settings");

  // Protected admin routes - require valid session
  if (isProtectedAdminRoute) {
    if (!adminSessionCookie) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    // Cookie present but may be tampered/revoked - validate session
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      await db.session.deleteMany({ where: { token: adminSessionCookie } });
      const redirect = NextResponse.redirect(new URL("/login", req.url));
      redirect.cookies.set(
        ADMIN_SESSION_COOKIE_NAME,
        "",
        CLEAR_SESSION_COOKIE_OPTIONS,
      );
      return redirect;
    }
  }

  // Auth routes - redirect to home if already authenticated
  if (adminSessionCookie && adminAuthRoutes.includes(pathname)) {
    const session = await auth.api.getSession({ headers: req.headers });
    if (session?.user) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    // Invalid/tampered cookie - revoke session and clear cookie
    await db.session.deleteMany({ where: { token: adminSessionCookie } });
    const res = NextResponse.next();
    res.cookies.set(
      ADMIN_SESSION_COOKIE_NAME,
      "",
      CLEAR_SESSION_COOKIE_OPTIONS,
    );
    return res;
  }

  return NextResponse.next();
}

// =============================================================================
// MATCHER CONFIG
// =============================================================================

/**
 * Matcher excludes static files and API routes from proxy processing
 * for better performance. API routes handle their own authentication
 * via middleware wrappers (withAdminAuth, withCashierAuth, withCustomerAuth).
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon)
     * - public folder assets (images, etc.)
     * - API routes (they handle their own auth)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$|api/).*)",
  ],
};
