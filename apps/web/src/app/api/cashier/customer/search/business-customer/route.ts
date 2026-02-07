import { withCashierAuth } from "@/lib/auth/middleware";
import { APP_CONSTANTS } from "@/lib/constants/app";
import { searchBusinessCustomerSchema } from "@/lib/schemas/cashier";
import {
  sanitizeErrorMessage,
  validateSchema,
} from "@/lib/utils/error-handler";
import { formatPhoneNumberForSearch } from "@/lib/utils/phone";
import { db } from "@reelo/db";
import { NextRequest, NextResponse } from "next/server";

export const GET = withCashierAuth(async (request: NextRequest, context) => {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get("phone");
    const businessId = context.business.id;

    const validation = validateSchema(searchBusinessCustomerSchema, {
      phone: phone || "",
      businessId,
    });
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error, customers: [] },
        { status: 400 },
      );
    }

    if (
      validation.data.phone.replace(/\D/g, "").length <
      APP_CONSTANTS.MIN_PHONE_LENGTH_FOR_SEARCH
    ) {
      return NextResponse.json(
        {
          error: `Enter at least ${APP_CONSTANTS.MIN_PHONE_LENGTH_FOR_SEARCH} digits to search`,
          customers: [],
        },
        { status: 400 },
      );
    }

    const formattedPhone = formatPhoneNumberForSearch(validation.data.phone);

    const businessCustomers = await db.businessCustomer.findMany({
      where: {
        businessId,
        customer: {
          user: {
            phoneNumber: {
              contains: formattedPhone,
              mode: "insensitive",
            },
          },
        },
      },
      take: 5,
      include: {
        customer: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                phoneNumber: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const businessCustomerResults = businessCustomers.map((bc) => ({
      id: bc.customer.id,
      userId: bc.customer.user.id,
      name: bc.customer.user.name,
      phoneNumber: bc.customer.user.phoneNumber,
      email: (bc.customer as any).email,
      addressLine1: bc.customer.addressLine1,
      addressLine2: bc.customer.addressLine2,
      city: bc.customer.city,
      state: bc.customer.state,
      country: bc.customer.country,
      postalCode: bc.customer.postalCode,
      isBusinessCustomer: true,
    }));

    return NextResponse.json({
      customers: businessCustomerResults,
    });
  } catch (error: any) {
    console.error("Failed to search business customers:", error);
    return NextResponse.json(
      {
        error:
          sanitizeErrorMessage(error) ||
          "Failed to search customers. Please try again.",
        customers: [],
      },
      { status: 500 },
    );
  }
});
