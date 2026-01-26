import { getCashierSessionFromHeaders } from "@/lib/auth/cashier-session";
import { parseCashierRoute } from "@/lib/utils/cashier-routes";
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

const publicCashierRoutes = ["/", "/no-session"];

export async function proxy(req: NextRequest) {
  const { nextUrl } = req;
  const hostname = req.headers.get("host") || "";
  const pathname = nextUrl.pathname;

  const sessionCookie = getSessionCookie(req, {
    cookiePrefix: "reelo",
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
          new URL(
            `/cashier/${businessSlug}/${cashierSlug}/no-session`,
            req.url,
          ),
        );
      }
    }

    return NextResponse.next();
  }

  if (!sessionCookie && protectedAdminRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (sessionCookie && AuthRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}
