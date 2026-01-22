import { auth } from "@/lib/auth/auth";
import { prisma } from "@reelo/db";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } },
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { cashierName, cashierEmail, cashierLinkSlug } = body;

    const cashier = await prisma.cashier.findUnique({
      where: { id: params.id },
      include: { business: { include: { admins: true } } },
    });

    if (
      !cashier ||
      !cashier.business.admins.some((a) => a.userId === session.user.id)
    ) {
      return NextResponse.json(
        { error: "Unauthorized or Cashier not found" },
        { status: 404 },
      );
    }

    if (cashierLinkSlug) {
      const existingSlug = await prisma.cashier.findFirst({
        where: {
          cashierLinkSlug,
          NOT: { id: params.id },
        },
      });
      if (existingSlug) {
        return NextResponse.json(
          { error: "Cashier slug already taken" },
          { status: 400 },
        );
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.cashier.update({
        where: { id: params.id },
        data: {
          cashierLinkSlug: cashierLinkSlug || cashier.cashierLinkSlug,
        },
      });

      if (cashierName || cashierEmail) {
        await tx.user.update({
          where: { id: cashier.userId },
          data: {
            ...(cashierName && { name: cashierName }),
            ...(cashierEmail && { email: cashierEmail }),
          },
        });
      }
    });

    const updatedCashier = await prisma.cashier.findUnique({
      where: { id: params.id },
      include: { user: true },
    });

    return NextResponse.json({
      cashier: {
        id: updatedCashier!.id,
        name: updatedCashier!.user.name,
        email: updatedCashier!.user.email,
        linkSlug: updatedCashier!.cashierLinkSlug,
        createdAt: updatedCashier!.createdAt,
        updatedAt: updatedCashier!.updatedAt,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update cashier" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } },
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const cashier = await prisma.cashier.findUnique({
      where: { id: params.id },
      include: { business: { include: { admins: true } } },
    });

    if (
      !cashier ||
      !cashier.business.admins.some((a) => a.userId === session.user.id)
    ) {
      return NextResponse.json(
        { error: "Unauthorized or Cashier not found" },
        { status: 404 },
      );
    }

    await prisma.cashier.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete cashier" },
      { status: 500 },
    );
  }
}
