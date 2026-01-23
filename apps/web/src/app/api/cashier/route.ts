import { auth } from "@/lib/auth/auth";
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
        error: error.message || "Failed to fetch cashiers",
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
    const { name, email, password, cashierLinkSlug } = body;

    if (!name || !email || !password || !cashierLinkSlug) {
      return NextResponse.json(
        { error: "Missing required fields", cashier: null },
        { status: 400 },
      );
    }

    const existingCashierSlug = await prisma.cashier.findUnique({
      where: { cashierLinkSlug },
    });

    if (existingCashierSlug) {
      return NextResponse.json(
        { error: "Cashier link slug already exists", cashier: null },
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
        error: error.message || "Failed to create cashier",
        cashier: null,
      },
      { status: 500 },
    );
  }
}
