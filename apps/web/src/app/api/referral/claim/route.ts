import { APP_CONSTANTS } from "@/lib/constants/app";
import { runTransaction } from "@/lib/db/transaction";
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
            referralProgram: {
              include: {
                newCustomerFreeItemSku: { select: { id: true, name: true } },
                existingCustomerFreeItemSku: {
                  select: { id: true, name: true },
                },
              },
            },
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

    const result = await runTransaction(async (tx) => {
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

      const referralProgram = business.referralProgram!;
      const existingType = referralProgram.existingCustomerBenefitType;
      const newType = referralProgram.newCustomerBenefitType;

      // Referrer benefit (existing customer who referred)
      if (existingType === "AMOUNT_CASHBACK") {
        const amount = Math.max(
          0,
          Number(referralProgram.existingCustomerBenefitValue) || 0,
        );
        if (amount > 0) {
          await tx.wallet.upsert({
            where: {
              businessId_customerId: {
                businessId: referrer.businessId,
                customerId: referrer.customerId,
              },
            },
            create: {
              businessId: referrer.businessId,
              customerId: referrer.customerId,
              cashbackBalance: amount,
            },
            update: { cashbackBalance: { increment: amount } },
          });
          await tx.transaction.create({
            data: {
              businessId: referrer.businessId,
              customerId: referrer.customerId,
              valueKind: "CASHBACK",
              amount,
              type: "EARNED",
              source: "REFERRAL",
              loyaltyId: business.loyalty?.id ?? null,
              description: "Referral cashback",
            },
          });
        }
      } else if (
        existingType === "FREE_ITEM_ON_NEXT_PURCHASE" &&
        referralProgram.existingCustomerFreeItemSkuId
      ) {
        const sku =
          referralProgram.existingCustomerFreeItemSku ??
          (await tx.sku.findUnique({
            where: { id: referralProgram.existingCustomerFreeItemSkuId },
            select: { id: true, name: true },
          }));
        if (sku) {
          const freeItemEntry = {
            id: crypto.randomUUID(),
            skuId: sku.id,
            skuName: sku.name,
            source: "REFERRAL",
            createdAt: new Date().toISOString(),
          };
          const wallet = await tx.wallet.findUnique({
            where: {
              businessId_customerId: {
                businessId: referrer.businessId,
                customerId: referrer.customerId,
              },
            },
          });
          const existingItems =
            (wallet?.freeItems as Array<unknown> | null) ?? [];
          const updatedItems = [...existingItems, freeItemEntry];
          await tx.wallet.upsert({
            where: {
              businessId_customerId: {
                businessId: referrer.businessId,
                customerId: referrer.customerId,
              },
            },
            create: {
              businessId: referrer.businessId,
              customerId: referrer.customerId,
              freeItems: updatedItems as any,
            },
            update: { freeItems: updatedItems as any },
          });
          await tx.transaction.create({
            data: {
              businessId: referrer.businessId,
              customerId: referrer.customerId,
              valueKind: "FREE_ITEM",
              amount: 1,
              type: "EARNED",
              source: "REFERRAL",
              metadata: { skuId: sku.id, skuName: sku.name } as any,
              description: `Free ${sku.name} on next visit`,
            },
          });
        }
      }

      // Referred customer benefit (new customer who joined via referral)
      if (newType === "AMOUNT_CASHBACK") {
        const amount = Math.max(
          0,
          Number(referralProgram.newCustomerBenefitValue) || 0,
        );
        if (amount > 0) {
          await tx.wallet.upsert({
            where: {
              businessId_customerId: { businessId, customerId: customer.id },
            },
            create: {
              businessId,
              customerId: customer.id,
              cashbackBalance: amount,
            },
            update: { cashbackBalance: { increment: amount } },
          });
          await tx.transaction.create({
            data: {
              businessId,
              customerId: customer.id,
              valueKind: "CASHBACK",
              amount,
              type: "EARNED",
              source: "REFERRAL",
              loyaltyId: business.loyalty?.id ?? null,
              description: "Referral cashback",
            },
          });
        }
      } else if (
        newType === "FREE_ITEM_ON_NEXT_PURCHASE" &&
        referralProgram.newCustomerFreeItemSkuId
      ) {
        const sku =
          referralProgram.newCustomerFreeItemSku ??
          (await tx.sku.findUnique({
            where: { id: referralProgram.newCustomerFreeItemSkuId },
            select: { id: true, name: true },
          }));
        if (sku) {
          const freeItemEntry = {
            id: crypto.randomUUID(),
            skuId: sku.id,
            skuName: sku.name,
            source: "REFERRAL",
            createdAt: new Date().toISOString(),
          };
          const wallet = await tx.wallet.findUnique({
            where: {
              businessId_customerId: { businessId, customerId: customer.id },
            },
          });
          const existingItems =
            (wallet?.freeItems as Array<unknown> | null) ?? [];
          const updatedItems = [...existingItems, freeItemEntry];
          await tx.wallet.upsert({
            where: {
              businessId_customerId: { businessId, customerId: customer.id },
            },
            create: {
              businessId,
              customerId: customer.id,
              freeItems: updatedItems as any,
            },
            update: { freeItems: updatedItems as any },
          });
          await tx.transaction.create({
            data: {
              businessId,
              customerId: customer.id,
              valueKind: "FREE_ITEM",
              amount: 1,
              type: "EARNED",
              source: "REFERRAL",
              metadata: { skuId: sku.id, skuName: sku.name } as any,
              description: `Free ${sku.name} on next visit`,
            },
          });
        }
      }

      return {
        businessCustomer,
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
