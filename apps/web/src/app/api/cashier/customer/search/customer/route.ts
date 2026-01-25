import { getCashierSessionFromHeaders } from "@/lib/auth/cashier-session";
import { searchBusinessCustomerSchema } from "@/lib/schemas/bill";
import { formatPhoneNumberForSearch } from "@/lib/utils/phone";
import { sanitizeErrorMessage } from "@/lib/utils/error-handler";
import { prisma } from "@reelo/db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const cookieHeader = request.headers.get("cookie");
    const session = await getCashierSessionFromHeaders(cookieHeader);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized", customers: [] },
        { status: 401 },
      );
    }

    const cashier = await prisma.cashier.findFirst({
      where: { userId: session.user.id },
      select: { businessId: true },
    });

    if (!cashier) {
      return NextResponse.json(
        { error: "Cashier not found", customers: [] },
        { status: 404 },
      );
    }

    const { searchParams } = new URL(request.url);
    const phone = searchParams.get("phone");
    const businessId = searchParams.get("businessId") || cashier.businessId;

    let validatedData;
    try {
      validatedData = searchBusinessCustomerSchema.parse({
        phone: phone || "",
        businessId,
      });
    } catch (error: any) {
      if (error.name === "ZodError") {
        const firstError = error.errors?.[0];
        const errorMessage = firstError
          ? `${firstError.path.join(".")}: ${firstError.message}`
          : "Invalid input data";
        return NextResponse.json(
          { error: errorMessage, customers: [] },
          { status: 400 },
        );
      }
      return NextResponse.json(
        { error: "Invalid input data", customers: [] },
        { status: 400 },
      );
    }

    if (validatedData.phone.length < 4) {
      return NextResponse.json(
        { error: "Phone number must be at least 4 digits", customers: [] },
        { status: 400 },
      );
    }

    const formattedPhone = formatPhoneNumberForSearch(validatedData.phone);

    const businessCustomers = await prisma.businessCustomer.findMany({
      where: {
        businessId: validatedData.businessId,
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
}
