import { applyLoyaltyForBill } from "@/lib/actions/loyalty";
import { withCashierAuth } from "@/lib/auth/middleware";
import { APP_CONSTANTS } from "@/lib/constants/app";
import { createBillApiSchema } from "@/lib/schemas/bill";
import {
  sanitizeErrorMessage,
  validateSchema,
} from "@/lib/utils/error-handler";
import { formatPhoneNumber } from "@/lib/utils/phone";
import { db } from "@reelo/db";
import { NextRequest, NextResponse } from "next/server";

async function findOrCreateCustomer(data: {
  phoneNumber: string;
  name?: string | null;
}) {
  const formattedPhone = formatPhoneNumber(data.phoneNumber);
  const tempEmail = `${formattedPhone}@${APP_CONSTANTS.CUSTOMER_EMAIL_DOMAIN}`;

  let user = await db.user.findUnique({
    where: { phoneNumber: formattedPhone },
    include: { customer: true },
  });

  if (!user) {
    user = await db.user.create({
      data: {
        name: data.name || "Customer",
        phoneNumber: formattedPhone,
        email: tempEmail,
        role: "CUSTOMER",
        phoneNumberVerified: false,
        emailVerified: false,
      },
      include: { customer: true },
    });
  }

  let customer = user.customer;

  if (!customer) {
    customer = await db.customer.create({
      data: {
        userId: user.id,
        email: tempEmail,
      },
    });
  }

  return { user, customer };
}

async function linkCustomerToBusiness(
  customerId: string,
  businessId: string,
): Promise<void> {
  const existing = await db.businessCustomer.findUnique({
    where: {
      businessId_customerId: {
        businessId,
        customerId,
      },
    },
  });

  if (!existing) {
    await db.businessCustomer.create({
      data: {
        businessId,
        customerId,
      },
    });
  }
}

async function updateCustomerName(
  customerId: string,
  name: string,
): Promise<void> {
  const customer = await db.customer.findUnique({
    where: { id: customerId },
    include: { user: true },
  });

  if (customer) {
    await db.user.update({
      where: { id: customer.userId },
      data: { name },
    });
  }
}

export const POST = withCashierAuth(async (request: NextRequest, context) => {
  try {
    const businessId = context.business.id;

    const body = await request.json();

    const validation = validateSchema(createBillApiSchema, {
      ...body,
      businessId,
    });
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error, bill: null },
        { status: 400 },
      );
    }

    const {
      billNumber,
      phoneNumber,
      name,
      amount,
      subtotal: subtotalFromRequest,
      redeemPoints,
      notes,
      paymentMethod,
      lineItems = [],
    } = validation.data;

    if (!phoneNumber || phoneNumber.trim() === "") {
      return NextResponse.json(
        { error: "Phone number is required", bill: null },
        { status: 400 },
      );
    }

    const formattedPhone = formatPhoneNumber(phoneNumber.trim());

    const { customer } = await findOrCreateCustomer({
      phoneNumber: formattedPhone,
      name,
    });

    await linkCustomerToBusiness(customer.id, businessId);

    if (name) {
      await updateCustomerName(customer.id, name);
    }

    // Only active SKUs are allowed in billing
    if (lineItems.length > 0) {
      const skuIds = [
        ...new Set(lineItems.map((li: { skuId: string }) => li.skuId)),
      ];
      const validSkus = await db.sku.findMany({
        where: {
          id: { in: skuIds },
          businessId,
          isActive: true,
        },
        select: { id: true },
      });
      const validIds = new Set(validSkus.map((s) => s.id));
      const invalidId = skuIds.find((id) => !validIds.has(id));
      if (invalidId) {
        return NextResponse.json(
          {
            error:
              "One or more line items use an inactive or invalid SKU. Only active SKUs can be added to a bill.",
            bill: null,
          },
          { status: 400 },
        );
      }
    }

    const billAmount = amount ?? 0;

    const result = await db.$transaction(async (tx) => {
      let computedSubtotal: number | null = null;
      if (
        lineItems.length > 0 &&
        (subtotalFromRequest == null || subtotalFromRequest === 0)
      ) {
        const skuIds = [
          ...new Set(lineItems.map((li: { skuId: string }) => li.skuId)),
        ];
        const skus = await tx.sku.findMany({
          where: { id: { in: skuIds }, businessId },
          select: { id: true, price: true },
        });
        const priceMap = new Map(skus.map((s) => [s.id, s.price]));
        computedSubtotal = lineItems.reduce(
          (
            sum: number,
            li: { skuId: string; qty: number; unitPrice?: number },
          ) => sum + li.qty * (li.unitPrice ?? priceMap.get(li.skuId) ?? 0),
          0,
        );
      }
      const billSubtotal = subtotalFromRequest ?? computedSubtotal ?? null;

      const bill = await tx.bill.create({
        data: {
          billNumber,
          amount: amount ?? null,
          subtotal: billSubtotal,
          notes: notes ?? null,
          paymentMethod: paymentMethod ?? null,
          businessId,
          customerId: customer.id,
          cashierId: context.cashier.id,
          lineItems:
            lineItems.length > 0
              ? {
                  create: lineItems.map(
                    (li: {
                      skuId: string;
                      qty: number;
                      unitPrice?: number;
                    }) => ({
                      skuId: li.skuId,
                      qty: li.qty,
                      unitPrice: li.unitPrice ?? undefined,
                    }),
                  ),
                }
              : undefined,
        },
      });

      const loyalty = await applyLoyaltyForBill(tx, {
        businessId,
        customerId: customer.id,
        billId: bill.id,
        billAmount,
        billSubtotal,
        redeemPointsRequested: redeemPoints ?? null,
      });

      const updatedBill = await tx.bill.update({
        where: { id: bill.id },
        data: {
          finalAmount: amount == null ? null : loyalty.finalAmount,
          cashbackAmount:
            loyalty.cashbackAmount != null ? loyalty.cashbackAmount : undefined,
        },
      });

      // Fetch reward stages for AMOUNT_SPENT / VISIT_MADE types
      let rewardStages: Array<{
        id: string;
        rewardName: string;
        rewardType: string;
        pointsRequired: number;
        canRedeem: boolean;
        freeItemName: string | null;
        percentageValue: number | null;
        cashAmount: number | null;
      }> = [];

      if (
        loyalty.loyaltyType === "AMOUNT_SPENT" ||
        loyalty.loyaltyType === "VISIT_MADE"
      ) {
        const loyaltyRecord = await tx.loyalty.findUnique({
          where: { businessId },
          include: {
            amountSpentConfig: {
              include: {
                rewardStages: { orderBy: { pointsRequired: "asc" } },
              },
            },
            visitMadeConfig: {
              include: {
                rewardStages: { orderBy: { pointsRequired: "asc" } },
              },
            },
          },
        });

        const stages =
          loyalty.loyaltyType === "AMOUNT_SPENT"
            ? (loyaltyRecord?.amountSpentConfig?.rewardStages ?? [])
            : (loyaltyRecord?.visitMadeConfig?.rewardStages ?? []);

        rewardStages = stages.map((s) => ({
          id: s.id,
          rewardName: s.rewardName,
          rewardType: s.rewardType,
          pointsRequired: s.pointsRequired,
          canRedeem: s.pointsRequired <= loyalty.pointsBalance,
          freeItemName: s.freeItemName,
          percentageValue: s.percentageValue,
          cashAmount: s.cashAmount,
        }));
      }

      return { bill: updatedBill, loyalty, rewardStages };
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Failed to create bill:", error);

    if (error?.message === "Insufficient points for redemption") {
      return NextResponse.json(
        { error: "Insufficient points for redemption", bill: null },
        { status: 400 },
      );
    }

    if (error.code === "P2002") {
      return NextResponse.json(
        {
          error: "Bill number already exists for this business",
          bill: null,
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      {
        error:
          sanitizeErrorMessage(error) ||
          "Failed to create bill. Please try again.",
        bill: null,
      },
      { status: 500 },
    );
  }
});
