import { validateCashierLogin, auth } from "@/lib/auth/auth";
import { cashierLoginSchema } from "@/lib/schemas/auth";
import { sanitizeErrorMessage } from "@/lib/utils/error-handler";
import { prisma } from "@reelo/db";
import { NextResponse } from "next/server";
import { randomBytes } from "crypto";

function getIpAddress(request: Request): string | null {
  const headers = request.headers;
  const ipHeaders = ["x-forwarded-for", "x-real-ip", "cf-connecting-ip"];
  
  for (const header of ipHeaders) {
    const value = headers.get(header);
    if (value) {
      const ip = value.split(",")[0]?.trim();
      if (ip) return ip;
    }
  }
  
  return null;
}

function isSecureContext(request: Request): boolean {
  const url = new URL(request.url);
  return url.protocol === "https:" || process.env.NODE_ENV === "production";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    let validatedData;
    try {
      validatedData = cashierLoginSchema.parse(body);
    } catch (error: any) {
      if (error.name === "ZodError") {
        const firstError = error.errors?.[0];
        const errorMessage = firstError
          ? `${firstError.path.join(".")}: ${firstError.message}`
          : "Invalid input data";
        return NextResponse.json(
          { error: errorMessage, session: null },
          { status: 400 },
        );
      }
      return NextResponse.json(
        { error: "Invalid input data", session: null },
        { status: 400 },
      );
    }

    const { businessSlug, cashierSlug, email, password } = validatedData;

    const validation = await validateCashierLogin({
      businessSlug,
      cashierSlug,
      email,
      password,
    });

    if (!validation.success || !validation.cashier) {
      return NextResponse.json(
        { error: "Invalid credentials", session: null },
        { status: 401 },
      );
    }

    const { cashier } = validation;

    const user = await prisma.user.findUnique({
      where: { id: cashier.userId },
      select: { id: true, name: true, email: true, role: true },
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
    expiresAt.setTime(expiresAt.getTime() + 60 * 60 * 24 * 1000);

    const token = randomBytes(32).toString("hex");
    const sessionId = crypto.randomUUID();

    const session = await prisma.session.create({
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
          email: user.email,
          role: "CASHIER",
        },
        session: {
          id: session.id,
          token: session.token,
          expiresAt: session.expiresAt,
        },
      },
    });

    const cookieName = "reelo.session.token";
    const isSecure = isSecureContext(request);
    
    response.cookies.set(cookieName, token, {
      httpOnly: true,
      secure: isSecure,
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24,
      expires: expiresAt,
    });

    return response;
  } catch (error: any) {
    console.error("Failed to login cashier:", error);
    return NextResponse.json(
      {
        error: sanitizeErrorMessage(error) || "Failed to sign in. Please try again.",
        session: null,
      },
      { status: 500 },
    );
  }
}
