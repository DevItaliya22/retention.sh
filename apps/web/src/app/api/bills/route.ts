import { auth } from "@/lib/auth/auth";
import { billsQuerySchema } from "@/lib/schemas/bill";
import { sanitizeErrorMessage } from "@/lib/utils/error-handler";
import { prisma } from "@reelo/db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized", bills: [], total: 0, perPage: 10 },
        { status: 401 },
      );
    }

    const admin = await prisma.admin.findFirst({
      where: { userId: session.user.id },
      include: { business: true },
    });

    if (!admin || !admin.business) {
      return NextResponse.json(
        { error: "Business not found", bills: [], total: 0, perPage: 10 },
        { status: 404 },
      );
    }

    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    let validatedData;
    try {
      validatedData = billsQuerySchema.parse(queryParams);
    } catch (error: any) {
      if (error.name === "ZodError") {
        const firstError = error.errors?.[0];
        const errorMessage = firstError
          ? `${firstError.path.join(".")}: ${firstError.message}`
          : "Invalid query parameters";
        return NextResponse.json(
          { error: errorMessage, bills: [], total: 0, perPage: 10 },
          { status: 400 },
        );
      }
      return NextResponse.json(
        { error: "Invalid query parameters", bills: [], total: 0, perPage: 10 },
        { status: 400 },
      );
    }

    const {
      page = 1,
      perPage = 10,
      sort,
      billNumber,
      email,
      customerName,
      dateFrom,
      dateTo,
      amountMin,
      amountMax,
    } = validatedData;

    const skip = (page - 1) * perPage;
    const take = perPage;

    const where: any = {
      businessId: admin.business.id,
    };

    if (billNumber) {
      where.billNumber = {
        contains: billNumber,
        mode: "insensitive",
      };
    }

    if (email || customerName) {
      const customerFilters: any = {};

      if (email) {
        customerFilters.email = {
          contains: email,
          mode: "insensitive",
        };
      }

      if (customerName) {
        customerFilters.user = {
          name: {
            contains: customerName,
            mode: "insensitive",
          },
        };
      }

      where.businessCustomer = {
        customer: customerFilters,
      };
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo);
      }
    }

    if (amountMin !== undefined || amountMax !== undefined) {
      where.amount = {};
      if (amountMin !== undefined) {
        where.amount.gte = amountMin;
      }
      if (amountMax !== undefined) {
        where.amount.lte = amountMax;
      }
    }

    const orderBy: any = {};
    if (sort) {
      const [field, direction] = sort.split(":");
      if (
        field === "billNumber" ||
        field === "amount" ||
        field === "createdAt"
      ) {
        orderBy[field] = direction === "desc" ? "desc" : "asc";
      } else {
        orderBy.createdAt = "desc";
      }
    } else {
      orderBy.createdAt = "desc";
    }

    const [bills, total] = await Promise.all([
      prisma.bill.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          businessCustomer: {
            include: {
              customer: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      phoneNumber: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
      prisma.bill.count({ where }),
    ]);

    const formattedBills = bills.map((bill) => ({
      id: bill.id,
      billNumber: bill.billNumber,
      amount: bill.amount,
      customerName: bill.businessCustomer.customer.user.name,
      customerPhone: bill.businessCustomer.customer.user.phoneNumber,
      customerEmail: bill.businessCustomer.customer.email,
      createdAt: bill.createdAt.toISOString(),
      updatedAt: bill.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      bills: formattedBills,
      total,
      page,
      perPage,
    });
  } catch (error: any) {
    console.error("Failed to fetch bills:", error);
    return NextResponse.json(
      {
        error:
          sanitizeErrorMessage(error) ||
          "Failed to fetch bills. Please try again.",
        bills: [],
        total: 0,
        perPage: 10,
      },
      { status: 500 },
    );
  }
}
