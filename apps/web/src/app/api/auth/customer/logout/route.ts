import { CUSTOMER_SESSION_COOKIE_NAME } from "@/lib/utils/cookie";
import { isSecureContext, parseSessionToken } from "@/lib/utils/request";
import { db } from "@reelo/db";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const cookieHeader = request.headers.get("cookie");
    const sessionToken = parseSessionToken(
      cookieHeader,
      CUSTOMER_SESSION_COOKIE_NAME,
    );

    if (sessionToken) {
      await db.session.deleteMany({ where: { token: sessionToken } });
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set(CUSTOMER_SESSION_COOKIE_NAME, "", {
      httpOnly: true,
      secure: isSecureContext(),
      sameSite: "strict",
      path: "/",
      maxAge: 0,
      expires: new Date(0),
    });

    return response;
  } catch (error: unknown) {
    console.error("Failed to logout customer:", error);
    return NextResponse.json(
      { success: false, error: "Failed to logout" },
      { status: 500 },
    );
  }
}
