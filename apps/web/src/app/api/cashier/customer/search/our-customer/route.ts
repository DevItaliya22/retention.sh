import { withCashierAuth } from "@/lib/auth/middleware";
import { APP_CONSTANTS } from "@/lib/constants/app";
import { searchUserCustomerSchema } from "@/lib/schemas/bill";
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

    const validation = validateSchema(searchUserCustomerSchema, {
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

    const customers = await db.customer.findMany({
      where: {
        user: {
          phoneNumber: {
            contains: formattedPhone,
            mode: "insensitive",
          },
        },
        businesses: {
          none: {
            businessId,
          },
        },
      },
      take: 5,
      include: {
        user: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const otherUserResults = customers.map((customer) => {
      const user = customer.user;
      return {
        id: customer.id,
        userId: user.id,
        name: user.name,
        phoneNumber: user.phoneNumber,
        email: customer.email,
        addressLine1: customer.addressLine1,
        addressLine2: customer.addressLine2,
        city: customer.city,
        state: customer.state,
        country: customer.country,
        postalCode: customer.postalCode,
        isBusinessCustomer: false,
      };
    });

    return NextResponse.json({
      customers: otherUserResults,
    });
  } catch (error: any) {
    console.error("Failed to search user customers:", error);
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
