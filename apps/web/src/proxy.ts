import { getCashierSessionFromHeaders } from "@/lib/auth/cashier-session";
import { parseCashierRoute } from "@/lib/utils/cashier-routes";
import { COOKIE_PREFIX } from "@/lib/utils/cookie";
import { getSessionCookie } from "better-auth/cookies";
import { NextRequest, NextResponse } from "next/server";

const protectedAdminRoutes = [
  "/",
  "/inbox",
  "/welcome",
  "/bills",
  "/customers",
];

const AuthRoutes = ["/login"];

const protectedCashierRoutes = ["/home"];

const publicCashierRoutes = ["/"];

export async function proxy(req: NextRequest) {
  const { nextUrl } = req;
  const hostname = req.headers.get("host") || "";
  const pathname = nextUrl.pathname;

  const sessionCookie = getSessionCookie(req, {
    cookiePrefix: COOKIE_PREFIX,
  });

  const cashierRoute = parseCashierRoute(pathname);

  if (cashierRoute) {
    const { businessSlug, cashierSlug, subPath } = cashierRoute;
    const cookieHeader = req.headers.get("cookie");
    const cashierSession = await getCashierSessionFromHeaders(cookieHeader);

    const isProtectedRoute = protectedCashierRoutes.includes(subPath);

    if (isProtectedRoute) {
      if (!cashierSession || cashierSession.user.role !== "CASHIER") {
        return NextResponse.redirect(
          new URL(`/cashier/${businessSlug}/${cashierSlug}/`, req.url),
        );
      }
    }

    return NextResponse.next();
  }

  const isProtected =
    protectedAdminRoutes.includes(pathname) ||
    pathname.startsWith("/bills/") ||
    pathname.startsWith("/customers/") ||
    pathname.startsWith("/settings");

  if (!sessionCookie && isProtected) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (sessionCookie && AuthRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}
