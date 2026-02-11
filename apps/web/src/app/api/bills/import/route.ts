import { applyLoyaltyForBill } from "@/lib/actions/loyalty";
import { withAdminAuth } from "@/lib/auth/middleware";
import { APP_CONSTANTS } from "@/lib/constants/app";
import { billImportSchema } from "@/lib/schemas/bill";
import {
  sanitizeErrorMessage,
  validateSchema,
} from "@/lib/utils/error-handler";
import { formatPhoneNumber } from "@/lib/utils/phone";
import { db } from "@reelo/db";
import { NextRequest, NextResponse } from "next/server";

interface CustomerData {
  phoneNumber: string;
  name?: string | null;
  email?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
}

async function findOrCreateCustomer(data: CustomerData) {
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
    const customerEmail =
      data.email && data.email.trim() ? data.email : tempEmail;
    customer = await db.customer.create({
      data: {
        userId: user.id,
        email: customerEmail,
        addressLine1: data.addressLine1 || null,
        addressLine2: data.addressLine2 || null,
        city: data.city || null,
        state: data.state || null,
        country: data.country || null,
        postalCode: data.postalCode || null,
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

async function updateCustomerInfo(
  customerId: string,
  data: Partial<CustomerData>,
): Promise<void> {
  const updateData: any = {};

  if (data.name !== undefined) {
    const customer = await db.customer.findUnique({
      where: { id: customerId },
      include: { user: true },
    });

    if (customer && data.name) {
      await db.user.update({
        where: { id: customer.userId },
        data: { name: data.name },
      });
    }
  }

  if (data.email !== undefined && data.email) {
    updateData.email = data.email;
  }

  if (data.addressLine1 !== undefined) {
    updateData.addressLine1 = data.addressLine1 || null;
  }
  if (data.addressLine2 !== undefined) {
    updateData.addressLine2 = data.addressLine2 || null;
  }
  if (data.city !== undefined) {
    updateData.city = data.city || null;
  }
  if (data.state !== undefined) {
    updateData.state = data.state || null;
  }
  if (data.country !== undefined) {
    updateData.country = data.country || null;
  }
  if (data.postalCode !== undefined) {
    updateData.postalCode = data.postalCode || null;
  }

  if (Object.keys(updateData).length > 0) {
    await db.customer.update({
      where: { id: customerId },
      data: updateData,
    });
  }
}

export const POST = withAdminAuth(async (request: NextRequest, context) => {
  try {
    const body = await request.json();

    const validation = validateSchema(billImportSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error, created: 0, failed: 0, errors: [] },
        { status: 400 },
      );
    }

    const { items } = validation.data;
    const businessId = context.business.id;

    let created = 0;
    const errors: { row: number; billNumber: string; message: string }[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item) continue;
      const rowNum = i + 1;

      try {
        const formattedPhone = formatPhoneNumber(item.phoneNumber.trim());

        const { customer } = await findOrCreateCustomer({
          phoneNumber: formattedPhone,
          name: item.name ?? undefined,
          email: item.email ?? undefined,
          addressLine1: item.addressLine1 ?? undefined,
          addressLine2: item.addressLine2 ?? undefined,
          city: item.city ?? undefined,
          state: item.state ?? undefined,
          country: item.country ?? undefined,
          postalCode: item.postalCode ?? undefined,
        });

        await linkCustomerToBusiness(customer.id, businessId);

        if (
          item.name ||
          item.email ||
          item.addressLine1 ||
          item.addressLine2 ||
          item.city ||
          item.state ||
          item.country ||
          item.postalCode
        ) {
          await updateCustomerInfo(customer.id, {
            name: item.name ?? undefined,
            email: item.email ?? undefined,
            addressLine1: item.addressLine1 ?? undefined,
            addressLine2: item.addressLine2 ?? undefined,
            city: item.city ?? undefined,
            state: item.state ?? undefined,
            country: item.country ?? undefined,
            postalCode: item.postalCode ?? undefined,
          });
        }

        const billSubtotal = item.subtotal ?? item.amount ?? null;
        const storeDiscount = Math.max(0, Number(item.storeDiscount) ?? 0);
        const taxArr = item.tax ?? [];
        const taxSum = taxArr.reduce((a: number, b: number) => a + b, 0);
        const finalAmountBeforeLoyalty =
          billSubtotal != null
            ? Math.max(0, billSubtotal - storeDiscount + taxSum)
            : null;
        const redeemPoints = Math.max(
          0,
          Math.floor(Number(item.redeemPoints) ?? 0),
        );

        if (billSubtotal == null || finalAmountBeforeLoyalty == null) {
          errors.push({
            row: rowNum,
            billNumber: item.billNumber,
            message: "Subtotal or amount is required",
          });
          continue;
        }

        await db.$transaction(async (tx) => {
          const bill = await tx.bill.create({
            data: {
              billNumber: item.billNumber,
              subtotal: billSubtotal,
              storeDiscount,
              tax: taxArr,
              finalAmount: finalAmountBeforeLoyalty,
              notes: item.notes ?? null,
              businessId,
              customerId: customer.id,
              cashierId: null,
            },
          });

          const loyalty = await applyLoyaltyForBill(tx, {
            businessId,
            customerId: customer.id,
            billId: bill.id,
            billAmount: finalAmountBeforeLoyalty,
            billSubtotal,
            redeemPointsRequested: redeemPoints > 0 ? redeemPoints : null,
          });

          await tx.bill.update({
            where: { id: bill.id },
            data: {
              cashbackAmount:
                loyalty.cashbackAmount != null
                  ? loyalty.cashbackAmount
                  : undefined,
              cashbackRedeemedAmount:
                loyalty.cashbackRedeemedAmount != null
                  ? loyalty.cashbackRedeemedAmount
                  : undefined,
              userPaidAmount: loyalty.finalAmount,
            },
          });

          return bill;
        });

        created++;
      } catch (err: any) {
        const message =
          err?.code === "P2002"
            ? "Bill number already exists for this business"
            : (sanitizeErrorMessage(err) ?? "Failed to import bill");

        errors.push({
          row: rowNum,
          billNumber: item.billNumber,
          message,
        });
      }
    }

    return NextResponse.json({
      created,
      failed: errors.length,
      errors: errors.slice(0, 20),
    });
  } catch (error: unknown) {
    console.error("Failed to import bills:", error);
    return NextResponse.json(
      {
        error:
          sanitizeErrorMessage(error) ??
          "Failed to import bills. Please try again.",
        created: 0,
        failed: 0,
        errors: [],
      },
      { status: 500 },
    );
  }
});
