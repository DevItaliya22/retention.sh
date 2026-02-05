import { validateCashierLogin } from "@/lib/auth/cashier";
import { cashierLoginSchema } from "@/lib/schemas/auth";
import { CASHIER_SESSION_COOKIE_NAME } from "@/lib/utils/cookie";
import {
  sanitizeErrorMessage,
  validateSchema,
} from "@/lib/utils/error-handler";
import { getIpAddress, isSecureContext } from "@/lib/utils/request";
import { db } from "@reelo/db";
import { randomBytes } from "crypto";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const schemaValidation = validateSchema(cashierLoginSchema, body);
    if (!schemaValidation.success) {
      return NextResponse.json(
        { error: schemaValidation.error, session: null },
        { status: 400 },
      );
    }

    const { businessSlug, cashierSlug, email, password } =
      schemaValidation.data;

    const loginValidation = await validateCashierLogin({
      businessSlug,
      cashierSlug,
      email,
      password,
    });

    if (!loginValidation.success || !loginValidation.cashier) {
      return NextResponse.json(
        {
          error: loginValidation.error || "Invalid credentials",
          session: null,
        },
        { status: 401 },
      );
    }

    const { cashier } = loginValidation;

    const user = await db.user.findUnique({
      where: { id: cashier.userId },
      select: { id: true, name: true, role: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials", session: null },
        { status: 401 },
      );
    }

    const ipAddress = getIpAddress(request);
    const userAgent = request.headers.get("user-agent") || null;

    const expiresAt = new Date();
    expiresAt.setTime(expiresAt.getTime() + 60 * 60 * 24 * 1000); // 24 hours

    const token = randomBytes(32).toString("hex");
    const sessionId = crypto.randomUUID();

    const session = await db.session.create({
      data: {
        id: sessionId,
        userId: user.id,
        token,
        expiresAt,
        ipAddress,
        userAgent,
        role: "CASHIER",
      },
    });

    const response = NextResponse.json({
      session: {
        user: {
          id: user.id,
          name: user.name,
          email: cashier.user.email,
          role: "CASHIER",
        },
        session: {
          id: session.id,
          token: session.token,
          expiresAt: session.expiresAt,
        },
      },
    });

    response.cookies.set(CASHIER_SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: isSecureContext(),
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24,
      expires: expiresAt,
    });

    return response;
  } catch (error: unknown) {
    console.error("Failed to login cashier:", error);
    return NextResponse.json(
      {
        error:
          sanitizeErrorMessage(error) || "Failed to sign in. Please try again.",
        session: null,
      },
      { status: 500 },
    );
  }
}
