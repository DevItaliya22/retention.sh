import { APP_CONSTANTS } from "@/lib/constants/app";
import { claimReferralSchema } from "@/lib/schemas/referral";
import {
  sanitizeErrorMessage,
  validateSchema,
} from "@/lib/utils/error-handler";
import { formatPhoneNumber } from "@/lib/utils/phone";
import {
  type IsServiceEnabled,
  isServiceEnabled,
} from "@/lib/utils/service-enabled";
import { db } from "@reelo/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = validateSchema(claimReferralSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 },
      );
    }
    const { referralSlug, phoneNumber, name } = validation.data;

    const formattedPhone = formatPhoneNumber(phoneNumber);

    // Find referrer by BusinessCustomer.referralSlug (unique) – this is the share link slug
    const referrer = await db.businessCustomer.findUnique({
      where: { referralSlug },
      include: {
        business: {
          include: {
            referralProgram: true,
            loyalty: true,
          },
        },
      },
    });

    if (!referrer) {
      return NextResponse.json(
        { success: false, error: "Invalid referral link" },
        { status: 404 },
      );
    }

    const businessId = referrer.businessId;
    const business = referrer.business;

    // Check if referral is enabled on business and program (reject immediately when off)
    if (
      !isServiceEnabled(
        business.isServiceEnabled as IsServiceEnabled | null,
        "referral",
      )
    ) {
      return NextResponse.json(
        { success: false, error: "Referral is not enabled for this business" },
        { status: 403 },
      );
    }
    if (!business.referralProgram || !business.referralProgram.isEnabled) {
      return NextResponse.json(
        { success: false, error: "Referral program is not enabled" },
        { status: 403 },
      );
    }

    // Check if customer already exists in this business
    const existingBusinessCustomer = await db.businessCustomer.findFirst({
      where: {
        businessId,
        customer: {
          user: {
            phoneNumber: formattedPhone,
          },
        },
      },
    });

    if (existingBusinessCustomer) {
      return NextResponse.json(
        {
          success: false,
          error: "You are already a customer of this business",
          alreadyExists: true,
        },
        { status: 400 },
      );
    }

    // Use transaction to ensure atomicity
    const result = await db.$transaction(async (tx) => {
      // Find or create user
      let user = await tx.user.findUnique({
        where: { phoneNumber: formattedPhone },
        include: { customer: true },
      });

      if (!user) {
        const tempEmail = `${formattedPhone}@${APP_CONSTANTS.CUSTOMER_EMAIL_DOMAIN}`;
        user = await tx.user.create({
          data: {
            name: name || "Customer",
            phoneNumber: formattedPhone,
            email: tempEmail,
            role: "CUSTOMER",
            phoneNumberVerified: false,
            emailVerified: false,
          },
          include: { customer: true },
        });
      }

      // Find or create customer
      let customer = user.customer;
      if (!customer) {
        const tempEmail = `${formattedPhone}@${APP_CONSTANTS.CUSTOMER_EMAIL_DOMAIN}`;
        customer = await tx.customer.create({
          data: {
            userId: user.id,
            email: tempEmail,
          },
        });
      }

      // Update customer name if provided
      if (
        name &&
        name.trim() &&
        customer.email ===
          `${formattedPhone}@${APP_CONSTANTS.CUSTOMER_EMAIL_DOMAIN}`
      ) {
        await tx.user.update({
          where: { id: user.id },
          data: { name: name.trim() },
        });
      }

      // Link customer to business
      const businessCustomer = await tx.businessCustomer.create({
        data: {
          businessId,
          customerId: customer.id,
          referredByBusinessId: referrer.businessId,
          referredByCustomerId: referrer.customerId,
        },
      });

      // Create referral log for tracking (claim was via BusinessCustomer.referralSlug)
      await tx.referralLog.create({
        data: {
          slug: crypto.randomUUID(),
          referrerBusinessId: referrer.businessId,
          referrerCustomerId: referrer.customerId,
          newCustomerPhone: formattedPhone,
          newCustomerName: name?.trim() || null,
          becameCustomer: true,
        },
      });

      // Award points when benefit type is LOYALTY_BONUS (only when loyalty is enabled)
      const referralProgram = business.referralProgram!;
      const loyaltyEnabled = isServiceEnabled(
        business.isServiceEnabled as IsServiceEnabled | null,
        "loyalty",
      );
      const referrerPoints =
        loyaltyEnabled &&
        referralProgram.existingCustomerBenefitType === "LOYALTY_BONUS"
          ? referralProgram.existingCustomerBenefitValue
          : 0;
      const referredPoints =
        loyaltyEnabled &&
        referralProgram.newCustomerBenefitType === "LOYALTY_BONUS"
          ? referralProgram.newCustomerBenefitValue
          : 0;

      if (referrerPoints > 0) {
        await tx.businessCustomer.update({
          where: {
            businessId_customerId: {
              businessId: referrer.businessId,
              customerId: referrer.customerId,
            },
          },
          data: {
            pointsBalance: { increment: referrerPoints },
          },
        });
        await tx.pointsTransaction.create({
          data: {
            businessId: referrer.businessId,
            customerId: referrer.customerId,
            amount: referrerPoints,
            type: "EARNED",
            source: "REFERRAL",
          },
        });
      }

      if (referredPoints > 0) {
        await tx.businessCustomer.update({
          where: {
            businessId_customerId: {
              businessId,
              customerId: customer.id,
            },
          },
          data: {
            pointsBalance: { increment: referredPoints },
          },
        });
        await tx.pointsTransaction.create({
          data: {
            businessId,
            customerId: customer.id,
            amount: referredPoints,
            type: "EARNED",
            source: "REFERRAL",
          },
        });
      }

      return {
        businessCustomer,
        referrerPoints,
        referredPoints,
        businessName: business.name,
      };
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error("Failed to claim referral:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          sanitizeErrorMessage(error) ||
          "Failed to process referral claim. Please try again.",
      },
      { status: 500 },
    );
  }
}
