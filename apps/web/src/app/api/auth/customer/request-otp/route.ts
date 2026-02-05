import { requestOtpSchema } from "@/lib/schemas/customer-auth";
import {
  sanitizeErrorMessage,
  validateSchema,
} from "@/lib/utils/error-handler";
import { formatPhoneNumber } from "@/lib/utils/phone";
import { db } from "@reelo/db";
import { randomInt } from "crypto";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = validateSchema(requestOtpSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 },
      );
    }

    const formattedPhone = formatPhoneNumber(validation.data.phoneNumber);
    const otp = randomInt(100000, 999999).toString();

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5);

    const identifier = `customer-otp:${formattedPhone}`;

    await db.verification.deleteMany({
      where: { identifier },
    });

    await db.verification.create({
      data: {
        id: crypto.randomUUID(),
        identifier,
        value: otp,
        expiresAt,
      },
    });

    // In DEV, log OTP. In PROD, send via SMS (TODO: implement SMS sending)
    if (process.env.NODE_ENV !== "production") {
      console.log("[auth] Customer OTP (dev only):", {
        phoneNumber: formattedPhone,
        otp,
        expiresAt,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Failed to request OTP:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          sanitizeErrorMessage(error) ||
          "Failed to request OTP. Please try again.",
      },
      { status: 500 },
    );
  }
}
