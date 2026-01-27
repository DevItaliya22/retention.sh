import { withCashierAuth } from "@/lib/auth/middleware";
import { searchBusinessCustomerSchema } from "@/lib/schemas/bill";
import {
  sanitizeErrorMessage,
  validateSchema,
} from "@/lib/utils/error-handler";
import { formatPhoneNumberForSearch } from "@/lib/utils/phone";
import { prisma } from "@reelo/db";
import { NextRequest, NextResponse } from "next/server";

export const GET = withCashierAuth(async (request: NextRequest, context) => {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get("phone");
    const businessId = searchParams.get("businessId") || context.business.id;

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

    if (validation.data.phone.length < 4) {
      return NextResponse.json(
        { error: "Phone number must be at least 4 digits", customers: [] },
        { status: 400 },
      );
    }

    const formattedPhone = formatPhoneNumberForSearch(validation.data.phone);

    const businessCustomers = await prisma.businessCustomer.findMany({
      where: {
        businessId: validation.data.businessId,
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
