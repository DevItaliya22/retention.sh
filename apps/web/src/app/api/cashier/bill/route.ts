import { getCashierSessionFromHeaders } from "@/lib/auth/cashier-session";
import { APP_CONSTANTS } from "@/lib/constants/app";
import { createBillApiSchema } from "@/lib/schemas/bill";
import { sanitizeErrorMessage } from "@/lib/utils/error-handler";
import { formatPhoneNumber } from "@/lib/utils/phone";
import { prisma } from "@reelo/db";
import { NextResponse } from "next/server";

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

async function validateCashierAndGetBusiness(
  request: Request,
): Promise<
  | { success: true; businessId: string; error: null; status: null }
  | { success: false; error: string; status: number; businessId: null }
> {
  const cookieHeader = request.headers.get("cookie");
  const session = await getCashierSessionFromHeaders(cookieHeader);

  if (!session || !session.user) {
    return {
      success: false,
      error: "Unauthorized",
      status: 401,
      businessId: null,
    };
  }

  const cashier = await prisma.cashier.findFirst({
    where: { userId: session.user.id },
    select: { businessId: true },
  });

  if (!cashier || !cashier.businessId) {
    return {
      success: false,
      error: "Cashier not found",
      status: 404,
      businessId: null,
    };
  }

  return {
    success: true,
    businessId: cashier.businessId,
    error: null,
    status: null,
  };
}

async function findOrCreateCustomer(data: CustomerData) {
  const formattedPhone = formatPhoneNumber(data.phoneNumber);
  const tempEmail = `${formattedPhone}@${APP_CONSTANTS.CUSTOMER_EMAIL_DOMAIN}`;

  let user = await prisma.user.findUnique({
    where: { phoneNumber: formattedPhone },
    include: { customer: true },
  });

  if (!user) {
    user = await prisma.user.create({
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
    customer = await prisma.customer.create({
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
  const existing = await prisma.businessCustomer.findUnique({
    where: {
      businessId_customerId: {
        businessId,
        customerId,
      },
    },
  });

  if (!existing) {
    await prisma.businessCustomer.create({
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
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: { user: true },
    });

    if (customer && data.name) {
      await prisma.user.update({
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
    await prisma.customer.update({
      where: { id: customerId },
      data: updateData,
    });
  }
}

export async function POST(request: Request) {
  try {
    const validation = await validateCashierAndGetBusiness(request);

    if (!validation.success || !validation.businessId) {
      return NextResponse.json(
        { error: validation.error || "Business not found", bill: null },
        { status: validation.status || 401 },
      );
    }

    const businessId = validation.businessId;

    const body = await request.json();

    let validatedData;
    try {
      validatedData = createBillApiSchema.parse({
        ...body,
        businessId,
      });
    } catch (error: any) {
      if (error.name === "ZodError") {
        const firstError = error.errors?.[0];
        const errorMessage = firstError
          ? `${firstError.path.join(".")}: ${firstError.message}`
          : "Invalid input data";
        return NextResponse.json(
          { error: errorMessage, bill: null },
          { status: 400 },
        );
      }
      return NextResponse.json(
        { error: "Invalid input data", bill: null },
        { status: 400 },
      );
    }

    const { billNumber, phoneNumber, amount, ...customerData } = validatedData;

    if (!phoneNumber || phoneNumber.trim() === "") {
      return NextResponse.json(
        { error: "Phone number is required", bill: null },
        { status: 400 },
      );
    }

    const formattedPhone = formatPhoneNumber(phoneNumber.trim());

    const { customer } = await findOrCreateCustomer({
      phoneNumber: formattedPhone,
      ...customerData,
    });

    await linkCustomerToBusiness(customer.id, businessId);

    if (
      customerData.name ||
      customerData.email ||
      customerData.addressLine1 ||
      customerData.addressLine2 ||
      customerData.city ||
      customerData.state ||
      customerData.country ||
      customerData.postalCode
    ) {
      await updateCustomerInfo(customer.id, customerData);
    }

    const bill = await prisma.bill.create({
      data: {
        billNumber,
        amount: amount ?? null,
        businessId,
        customerId: customer.id,
      } as any,
    });

    return NextResponse.json({ bill });
  } catch (error: any) {
    console.error("Failed to create bill:", error);

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
}
