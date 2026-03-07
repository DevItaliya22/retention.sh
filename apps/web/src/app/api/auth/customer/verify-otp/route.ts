import { APP_CONSTANTS } from "@/lib/constants/app";
import { checkRateLimit } from "@/lib/ratelimit";
import { verifyOtpSchema } from "@/lib/schemas/customer-auth";
import { CUSTOMER_SESSION_COOKIE_NAME } from "@/lib/utils/cookie";
import {
  sanitizeErrorMessage,
  validateSchema,
} from "@/lib/utils/error-handler";
import { formatPhoneNumber } from "@/lib/utils/phone";
import { getIpAddress, isSecureContext } from "@/lib/utils/request";
import { db } from "@reelo/db";
import { randomBytes } from "crypto";
import { NextResponse } from "next/server";

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
    const ip = getIpAddress(request) ?? "unknown";

    const { allowed: ipAllowed, retryAfterSeconds: ipRetrySec } =
      await checkRateLimit(`auth:otp-verify:ip:${ip}`);
    if (!ipAllowed) {
      const sec = ipRetrySec ?? 60;
      return NextResponse.json(
        {
          error: `Too many OTP verification attempts. Please try again in ${sec} seconds.`,
          retryAfterSeconds: sec,
          session: null,
        },
        { status: 429 },
      );
    }

    const { allowed: phoneAllowed, retryAfterSeconds: phoneRetrySec } =
      await checkRateLimit(`auth:otp-verify:phone:${formattedPhone}`, {
        windowSeconds: 60,
      });
    if (!phoneAllowed) {
      const sec = phoneRetrySec ?? 60;
      return NextResponse.json(
        {
          error: `Too many OTP verification attempts for this number. Please try again in ${sec} seconds.`,
          retryAfterSeconds: sec,
          session: null,
        },
        { status: 429 },
      );
    }
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

    response.cookies.set(CUSTOMER_SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: isSecureContext(),
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24,
      expires: expiresAt,
    });

    return response;
  } catch (error: unknown) {
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
