import { SESSION_COOKIE_NAME } from "@/lib/utils/cookie";
import { db } from "@reelo/db";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const cookieHeader = request.headers.get("cookie") || "";
    const sessionToken = cookieHeader
      .split(";")
      .find((c) => c.trim().startsWith(`${SESSION_COOKIE_NAME}=`))
      ?.split("=")[1];

    if (sessionToken) {
      await db.session.deleteMany({ where: { token: sessionToken } });
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set(SESSION_COOKIE_NAME, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 0,
      expires: new Date(0),
    });

    return response;
  } catch (error) {
    console.error("Failed to logout customer:", error);
    return NextResponse.json(
      { success: false, error: "Failed to logout" },
      { status: 500 },
    );
  }
}
