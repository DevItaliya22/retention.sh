import { auth } from "@/lib/auth/auth";
import {
  cashiersQuerySchema,
  createCashierSchema,
} from "@/lib/schemas/cashier";
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
        { error: "Unauthorized", cashiers: [], total: 0, perPage: 10 },
        { status: 401 },
      );
    }

    const admin = await prisma.admin.findFirst({
      where: { userId: session.user.id },
      include: { business: true },
    });

    if (!admin || !admin.business) {
      return NextResponse.json(
        { error: "Business not found", cashiers: [], total: 0, perPage: 10 },
        { status: 404 },
      );
    }

    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    let validatedData;
    try {
      validatedData = cashiersQuerySchema.parse(queryParams);
    } catch (error: any) {
      if (error.name === "ZodError") {
        const firstError = error.errors?.[0];
        const errorMessage = firstError
          ? `${firstError.path.join(".")}: ${firstError.message}`
          : "Invalid query parameters";
        return NextResponse.json(
          { error: errorMessage, cashiers: [], total: 0, perPage: 10 },
          { status: 400 },
        );
      }
      return NextResponse.json(
        {
          error: "Invalid query parameters",
          cashiers: [],
          total: 0,
          perPage: 10,
        },
        { status: 400 },
      );
    }

    const { page = 1, perPage = 10, sort, name, email } = validatedData;

    const skip = (page - 1) * perPage;
    const take = perPage;

    const where: any = {
      businessId: admin.business.id,
    };

    const userFilters: any = {};
    if (name) {
      userFilters.name = {
        contains: name,
        mode: "insensitive",
      };
    }
    if (email) {
      userFilters.email = {
        contains: email,
        mode: "insensitive",
      };
    }

    if (Object.keys(userFilters).length > 0) {
      where.user = userFilters;
    }

    const orderBy: any = {};
    if (sort) {
      const [field, direction] = sort.split(":");
      const sortDirection = direction === "desc" ? "desc" : "asc";
      if (field === "name" || field === "email") {
        orderBy.user = {
          [field]: sortDirection,
        };
      } else if (field === "createdAt") {
        orderBy.createdAt = sortDirection;
      } else {
        orderBy.createdAt = "desc";
      }
    } else {
      orderBy.createdAt = "desc";
    }

    const [cashiers, total] = await Promise.all([
      prisma.cashier.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              createdAt: true,
            },
          },
        },
      }),
      prisma.cashier.count({ where }),
    ]);

    const formattedCashiers = cashiers.map((cashier) => ({
      id: cashier.id,
      userId: cashier.userId,
      name: cashier.user.name,
      email: cashier.user.email,
      cashierLinkSlug: cashier.cashierLinkSlug,
      createdAt: cashier.createdAt.toISOString(),
      updatedAt: cashier.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      cashiers: formattedCashiers,
      total,
      page,
      perPage,
    });
  } catch (error: any) {
    console.error("Failed to fetch cashiers:", error);
    return NextResponse.json(
      {
        error:
          sanitizeErrorMessage(error) ||
          "Failed to fetch cashiers. Please try again.",
        cashiers: [],
        total: 0,
        perPage: 10,
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized", cashier: null },
        { status: 401 },
      );
    }

    const admin = await prisma.admin.findFirst({
      where: { userId: session.user.id },
      include: { business: true },
    });

    if (!admin || !admin.business) {
      return NextResponse.json(
        { error: "Business not found", cashier: null },
        { status: 404 },
      );
    }

    const body = await request.json();

    let validatedData;
    try {
      validatedData = createCashierSchema.parse(body);
    } catch (error: any) {
      if (error.name === "ZodError") {
        const firstError = error.errors?.[0];
        const errorMessage = firstError
          ? `${firstError.path.join(".")}: ${firstError.message}`
          : "Invalid input data";
        return NextResponse.json(
          { error: errorMessage, cashier: null },
          { status: 400 },
        );
      }
      return NextResponse.json(
        { error: "Invalid input data", cashier: null },
        { status: 400 },
      );
    }

    const { name, email, password, cashierLinkSlug } = validatedData;

    const existingCashierSlug = await prisma.cashier.findFirst({
      where: {
        cashierLinkSlug,
        businessId: admin.business.id,
      },
    });

    if (existingCashierSlug) {
      return NextResponse.json(
        {
          error: "Cashier link slug already exists in this business",
          cashier: null,
        },
        { status: 400 },
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists", cashier: null },
        { status: 400 },
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const cashierUser = await tx.user.create({
        data: {
          name,
          email,
          role: "CASHIER",
        },
      });

      const cashier = await tx.cashier.create({
        data: {
          userId: cashierUser.id,
          businessId: admin.business.id,
          cashierLinkSlug,
          password,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              createdAt: true,
            },
          },
        },
      });

      return cashier;
    });

    return NextResponse.json({
      cashier: {
        id: result.id,
        userId: result.userId,
        name: result.user.name,
        email: result.user.email,
        cashierLinkSlug: result.cashierLinkSlug,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      },
    });
  } catch (error: any) {
    console.error("Failed to create cashier:", error);
    return NextResponse.json(
      {
        error:
          sanitizeErrorMessage(error) ||
          "Failed to create cashier. Please try again.",
        cashier: null,
      },
      { status: 500 },
    );
  }
}
