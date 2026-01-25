import { auth } from "@/lib/auth/auth";
import { createCashierSchema } from "@/lib/schemas/cashier";
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
        { error: "Unauthorized", cashiers: [] },
        { status: 401 },
      );
    }

    const admin = await prisma.admin.findFirst({
      where: { userId: session.user.id },
      include: { business: true },
    });

    if (!admin || !admin.business) {
      return NextResponse.json(
        { error: "Business not found", cashiers: [] },
        { status: 404 },
      );
    }

    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email") || undefined;

    const cashiers = await prisma.cashier.findMany({
      where: {
        businessId: admin.business.id,
        ...(email && {
          user: {
            email: {
              contains: email,
              mode: "insensitive",
            },
          },
        }),
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
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      cashiers: cashiers.map((cashier) => ({
        id: cashier.id,
        userId: cashier.userId,
        name: cashier.user.name,
        email: cashier.user.email,
        cashierLinkSlug: cashier.cashierLinkSlug,
        createdAt: cashier.createdAt,
        updatedAt: cashier.updatedAt,
      })),
    });
  } catch (error: any) {
    console.error("Failed to fetch cashiers:", error);
    return NextResponse.json(
      {
        error: sanitizeErrorMessage(error) || "Failed to fetch cashiers. Please try again.",
        cashiers: [],
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
        { error: "Cashier link slug already exists in this business", cashier: null },
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
        error: sanitizeErrorMessage(error) || "Failed to create cashier. Please try again.",
        cashier: null,
      },
      { status: 500 },
    );
  }
}
