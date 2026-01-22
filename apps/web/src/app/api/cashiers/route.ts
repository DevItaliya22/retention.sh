import { auth } from "@/lib/auth/auth";
import { prisma } from "@reelo/db";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const admin = await prisma.admin.findUnique({
      where: { userId: session.user.id },
      include: {
        business: {
          include: {
            cashiers: {
              include: {
                user: true,
              },
              orderBy: {
                createdAt: "desc",
              },
            },
          },
        },
      },
    });

    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    const cashiers = admin.business.cashiers.map((c) => ({
      id: c.id,
      name: c.user.name,
      email: c.user.email,
      linkSlug: c.cashierLinkSlug,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));

    return NextResponse.json({ cashiers });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch cashiers" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { cashierName, cashierEmail, cashierLinkSlug, cashierPassword } =
      body;

    if (!cashierName || !cashierEmail || !cashierLinkSlug || !cashierPassword) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const admin = await prisma.admin.findUnique({
      where: { userId: session.user.id },
    });

    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    const existingCashierSlug = await prisma.cashier.findUnique({
      where: { cashierLinkSlug },
    });

    if (existingCashierSlug) {
      return NextResponse.json(
        { error: "Cashier link slug already exists" },
        { status: 400 },
      );
    }

    let cashierUser = await prisma.user.findUnique({
      where: { email: cashierEmail },
    });

    if (!cashierUser) {
      cashierUser = await prisma.user.create({
        data: {
          name: cashierName,
          email: cashierEmail,
          role: "CASHIER",
        },
      });
    } else if (cashierUser.role !== "CASHIER") {
      return NextResponse.json(
        { error: "User with this email already exists with a different role" },
        { status: 400 },
      );
    }

    const cashier = await prisma.cashier.create({
      data: {
        userId: cashierUser.id,
        businessId: admin.businessId,
        cashierLinkSlug,
        password: cashierPassword,
      },
      include: {
        user: true,
      },
    });

    return NextResponse.json({
      cashier: {
        id: cashier.id,
        name: cashier.user.name,
        email: cashier.user.email,
        linkSlug: cashier.cashierLinkSlug,
        createdAt: cashier.createdAt,
        updatedAt: cashier.updatedAt,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create cashier" },
      { status: 500 },
    );
  }
}
