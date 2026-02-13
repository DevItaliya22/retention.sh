import { applyLoyaltyForBill } from "@/lib/actions/loyalty";
import { withCashierAuth } from "@/lib/auth/middleware";
import { APP_CONSTANTS } from "@/lib/constants/app";
import { runTransaction } from "@/lib/db/transaction";
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
    await db.wallet.create({
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
      subtotal: subtotalFromRequest,
      storeDiscount = 0,
      tax = [],
      redeemPoints: redeemPointsRaw,
      redeemCashback: redeemCashbackRaw,
      notes,
      paymentMethod,
      lineItems = [],
    } = validation.data;

    // Defense: never allow negative redemption (prevents minus-minus = plus hack)
    const redeemPoints = Math.max(0, Math.floor(Number(redeemPointsRaw) || 0));
    const redeemCashback = Math.max(0, Number(redeemCashbackRaw) || 0);

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

    const discount = storeDiscount ?? 0;
    const taxSum = (tax ?? []).reduce((a: number, b: number) => a + b, 0);

    const result = await runTransaction(async (tx) => {
      let computedSubtotal: number | null = null;
      if (lineItems.length > 0) {
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
      const finalAmountBeforeLoyalty =
        billSubtotal != null
          ? Math.max(0, billSubtotal - discount + taxSum)
          : null;

      if (billSubtotal == null || finalAmountBeforeLoyalty == null) {
        throw new Error(
          "Subtotal is required (provide subtotal or line items to compute it).",
        );
      }

      const bill = await tx.bill.create({
        data: {
          billNumber,
          subtotal: billSubtotal,
          storeDiscount: discount,
          tax: tax ?? [],
          finalAmount: finalAmountBeforeLoyalty,
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

      // One feedback link per bill; attach business's feedback config if set
      const feedbackConfig = await tx.feedbackConfig.findUnique({
        where: { businessId },
        select: { id: true },
      });
      await tx.feedbackLink.create({
        data: {
          billId: bill.id,
          configId: feedbackConfig?.id ?? undefined,
        },
      });

      const loyalty = await applyLoyaltyForBill(tx, {
        businessId,
        customerId: customer.id,
        billId: bill.id,
        billAmount: finalAmountBeforeLoyalty,
        billSubtotal,
        redeemPointsRequested: redeemPoints ?? null,
        redeemCashbackRequested: redeemCashback ?? null,
        rewardStageId: validation.data.rewardStageId ?? null,
      });

      const updatedBill = await tx.bill.update({
        where: { id: bill.id },
        data: {
          cashbackAmount:
            loyalty.cashbackAmount != null ? loyalty.cashbackAmount : undefined,
          cashbackRedeemedAmount:
            loyalty.cashbackRedeemedAmount != null
              ? loyalty.cashbackRedeemedAmount
              : undefined,
          userPaidAmount: loyalty.finalAmount,
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

    if (
      error?.message ===
      "Subtotal is required (provide subtotal or line items to compute it)."
    ) {
      return NextResponse.json(
        { error: error.message, bill: null },
        { status: 400 },
      );
    }
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
