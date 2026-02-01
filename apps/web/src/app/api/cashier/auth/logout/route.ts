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
      await db.session.deleteMany({
        where: { token: sessionToken },
      });
    }

    const response = NextResponse.json({ success: true });

    response.cookies.delete(SESSION_COOKIE_NAME);

    return response;
  } catch (error: any) {
    console.error("Failed to logout cashier:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to logout",
      },
      { status: 500 },
    );
  }
}
