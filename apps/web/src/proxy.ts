import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const protectedAdminRoutes = [
  "/"
]

const AuthRoutes = [
  "/login",
  "/register",
]

// Change it when it's needed 
const userRoutes = [
  "/user"
]

const cashierRoutes = [
  "/cashier",
]

export function proxy(req: NextRequest) {
  const { nextUrl } = req;
  const hostname = req.headers.get("host") || "";
  const pathname = nextUrl.pathname;

  const sessionCookie = getSessionCookie(req, {
    cookiePrefix: "reelo",
  });

  if(!sessionCookie && protectedAdminRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if(sessionCookie && AuthRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}