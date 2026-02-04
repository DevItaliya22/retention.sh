import { APP_CONSTANTS } from "@/lib/constants/app";
import { verifyOtpSchema } from "@/lib/schemas/customer-auth";
import { SESSION_COOKIE_NAME } from "@/lib/utils/cookie";
import {
  sanitizeErrorMessage,
  validateSchema,
} from "@/lib/utils/error-handler";
import { formatPhoneNumber } from "@/lib/utils/phone";
import { db } from "@reelo/db";
import { randomBytes } from "crypto";
import { NextResponse } from "next/server";

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
    const validation = validateSchema(verifyOtpSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error, session: null },
        { status: 400 },
      );
    }

    const formattedPhone = formatPhoneNumber(validation.data.phoneNumber);
    const otp = validation.data.otp.trim();

    const identifier = `customer-otp:${formattedPhone}`;
    const verification = await db.verification.findFirst({
      where: {
        identifier,
        value: otp,
      },
    });

    if (!verification || verification.expiresAt <= new Date()) {
      return NextResponse.json(
        { error: "Invalid or expired OTP", session: null },
        { status: 401 },
      );
    }

    await db.verification.deleteMany({ where: { identifier } });

    let user = await db.user.findUnique({
      where: { phoneNumber: formattedPhone },
      include: { customer: true },
    });

    if (!user) {
      const tempEmail = `${formattedPhone}@${APP_CONSTANTS.CUSTOMER_EMAIL_DOMAIN}`;
      user = await db.user.create({
        data: {
          name: "Customer",
          phoneNumber: formattedPhone,
          email: tempEmail,
          role: "CUSTOMER",
          phoneNumberVerified: true,
          emailVerified: false,
        },
        include: { customer: true },
      });
    }

    if (user && !user.phoneNumberVerified) {
      await db.user.update({
        where: { id: user.id },
        data: { phoneNumberVerified: true },
      });
    }

    if (!user.customer) {
      const tempEmail = `${formattedPhone}@${APP_CONSTANTS.CUSTOMER_EMAIL_DOMAIN}`;
      await db.customer.create({
        data: {
          userId: user.id,
          email: tempEmail,
        },
      });
    }

    const ipAddress = getIpAddress(request);
    const userAgent = request.headers.get("user-agent") || null;

    const expiresAt = new Date();
    expiresAt.setTime(expiresAt.getTime() + 60 * 60 * 24 * 1000);

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
        role: "CUSTOMER",
      },
    });

    const response = NextResponse.json({
      session: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: "CUSTOMER",
        },
        session: {
          id: session.id,
          token: session.token,
          expiresAt: session.expiresAt,
        },
      },
    });

    const isSecure = isSecureContext(request);

    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: isSecure,
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24,
      expires: expiresAt,
    });

    return response;
  } catch (error: any) {
    console.error("Failed to verify OTP:", error);
    return NextResponse.json(
      {
        error:
          sanitizeErrorMessage(error) ||
          "Failed to verify OTP. Please try again.",
        session: null,
      },
      { status: 500 },
    );
  }
}
