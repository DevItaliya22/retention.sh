import { APP_CONSTANTS } from "@/lib/constants/app";
import { runTransaction } from "@/lib/db/transaction";
import { logOtpEmail, logOtpSms, logOtpWhatsApp } from "@/lib/messaging";
import { registerRequestOtpSchema } from "@/lib/schemas/customer-auth";
import {
  sanitizeErrorMessage,
  validateSchema,
} from "@/lib/utils/error-handler";
import { formatPhoneNumber } from "@/lib/utils/phone";
import {
  type IsServiceEnabled,
  isServiceEnabled,
} from "@/lib/utils/service-enabled";
import { db, TransactionSource, TransactionType } from "@reelo/db";
import { randomInt } from "crypto";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = validateSchema(registerRequestOtpSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 },
      );
    }

    const formattedPhone = formatPhoneNumber(validation.data.phoneNumber);
    const businessSlug = validation.data.businessSlug;
    const name = validation.data.name.trim();

    const business = await db.business.findUnique({
      where: { slug: businessSlug },
      select: {
        id: true,
        registrationBonusPoints: true,
        isServiceEnabled: true,
        loyalty: {
          select: {
            id: true,
            loyaltyType: true,
            whatsappEnabled: true,
            emailEnabled: true,
            smsEnabled: true,
          },
        },
      },
    });
    if (!business) {
      return NextResponse.json(
        { success: false, error: "Business not found" },
        { status: 404 },
      );
    }

    let user = await db.user.findUnique({
      where: { phoneNumber: formattedPhone },
      include: { customer: true },
    });

    if (!user) {
      const tempEmail = `${formattedPhone}@${APP_CONSTANTS.CUSTOMER_EMAIL_DOMAIN}`;
      user = await db.user.create({
        data: {
          name,
          phoneNumber: formattedPhone,
          email: tempEmail,
          role: "CUSTOMER",
          phoneNumberVerified: false,
          emailVerified: false,
        },
        include: { customer: true },
      });
    }

    await db.user.update({
      where: { id: user.id },
      data: { name },
    });

    let customer = user.customer;
    if (!customer) {
      const tempEmail = `${formattedPhone}@${APP_CONSTANTS.CUSTOMER_EMAIL_DOMAIN}`;
      customer = await db.customer.create({
        data: {
          userId: user.id,
          email: tempEmail,
        },
      });
    }

    const existingBc = await db.businessCustomer.findUnique({
      where: {
        businessId_customerId: {
          businessId: business.id,
          customerId: customer.id,
        },
      },
    });

    const isNewRegistration = !existingBc;

    if (!existingBc) {
      await db.businessCustomer.create({
        data: {
          businessId: business.id,
          customerId: customer.id,
        },
      });
      await db.wallet.create({
        data: {
          businessId: business.id,
          customerId: customer.id,
        },
      });
    }

    const loyaltyEnabled = isServiceEnabled(
      business.isServiceEnabled as IsServiceEnabled | null | undefined,
      "loyalty",
    );
    const bonusPoints =
      loyaltyEnabled && isNewRegistration
        ? Math.max(0, Number(business.registrationBonusPoints) || 0)
        : 0;
    if (isNewRegistration && bonusPoints > 0) {
      const loyaltyType = business.loyalty?.loyaltyType ?? "AMOUNT_SPENT";
      await db.wallet.update({
        where: {
          businessId_customerId: {
            businessId: business.id,
            customerId: customer.id,
          },
        },
        data:
          loyaltyType === "CASHBACK" || loyaltyType === "TIER"
            ? { cashbackBalance: { increment: bonusPoints } }
            : loyaltyType === "AMOUNT_SPENT"
              ? { amountSpentBalance: { increment: bonusPoints } }
              : { visitPointsBalance: { increment: bonusPoints } },
      });
      await db.transaction.create({
        data: {
          businessId: business.id,
          customerId: customer.id,
          valueKind:
            loyaltyType === "CASHBACK" || loyaltyType === "TIER"
              ? "CASHBACK"
              : loyaltyType === "AMOUNT_SPENT"
                ? "AMOUNT_SPENT_POINTS"
                : "VISIT_POINTS",
          amount: bonusPoints,
          type: TransactionType.EARNED,
          source: TransactionSource.REGISTRATION,
          loyaltyId: business.loyalty?.id ?? null,
          description: "Registration bonus",
        },
      });
    }

    const otp = randomInt(100000, 999999).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5);
    const identifier = `customer-otp:${formattedPhone}`;

    await db.verification.deleteMany({ where: { identifier } });
    await db.verification.create({
      data: {
        id: crypto.randomUUID(),
        identifier,
        value: otp,
        expiresAt,
      },
    });

    if (process.env.NODE_ENV !== "production") {
      console.log("[auth] Customer OTP (register, dev only):", {
        phoneNumber: formattedPhone,
        otp,
        expiresAt,
      });
    }

    const loyalty = business.loyalty;
    if (loyaltyEnabled && loyalty) {
      const customerEmail =
        user.email ??
        `${formattedPhone}@${APP_CONSTANTS.CUSTOMER_EMAIL_DOMAIN}`;
      await runTransaction(async (tx) => {
        if (loyalty.whatsappEnabled) {
          await logOtpWhatsApp(tx, {
            businessId: business.id,
            recipient: formattedPhone,
            otp,
          });
        }
        if (loyalty.emailEnabled) {
          await logOtpEmail(tx, {
            businessId: business.id,
            recipient: customerEmail,
            otp,
          });
        }
        if (loyalty.smsEnabled) {
          await logOtpSms(tx, {
            businessId: business.id,
            recipient: formattedPhone,
            otp,
          });
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Failed to register and request OTP:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          sanitizeErrorMessage(error) ||
          "Failed to register. Please try again.",
      },
      { status: 500 },
    );
  }
}
