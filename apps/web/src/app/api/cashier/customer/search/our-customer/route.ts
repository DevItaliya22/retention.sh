import { getCashierSessionFromHeaders } from "@/lib/auth/cashier-session";
import { searchUserCustomerSchema } from "@/lib/schemas/bill";
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
      validatedData = searchUserCustomerSchema.parse({
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

    if (validatedData.phone.length < 6) {
      return NextResponse.json(
        { error: "Phone number must be at least 6 digits", customers: [] },
        { status: 400 },
      );
    }

    const formattedPhone = formatPhoneNumberForSearch(validatedData.phone);

    const customers = await prisma.customer.findMany({
      where: {
        user: {
          phoneNumber: {
            contains: formattedPhone,
            mode: "insensitive",
          },
        },
        businesses: {
          none: {
            businessId: validatedData.businessId,
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
}
