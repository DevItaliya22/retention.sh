import { auth } from "@/lib/auth/auth";
import { updateCashierSchema } from "@/lib/schemas/cashier";
import { sanitizeErrorMessage } from "@/lib/utils/error-handler";
import { prisma } from "@reelo/db";
import { NextResponse } from "next/server";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
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

    const { id } = await params;

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

    const cashier = await prisma.cashier.findFirst({
      where: {
        id,
        businessId: admin.business.id,
      },
      include: { user: true },
    });

    if (!cashier) {
      return NextResponse.json(
        { error: "Cashier not found", cashier: null },
        { status: 404 },
      );
    }

    const body = await request.json();

    let validatedData;
    try {
      validatedData = updateCashierSchema.parse(body);
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

    if (cashierLinkSlug && cashierLinkSlug !== cashier.cashierLinkSlug) {
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
    }

    if (email && email !== cashier.user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser && existingUser.id !== cashier.userId) {
        return NextResponse.json(
          { error: "User with this email already exists", cashier: null },
          { status: 400 },
        );
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const updateData: {
        name?: string;
        email?: string;
      } = {};

      if (name) updateData.name = name;
      if (email) updateData.email = email;

      if (Object.keys(updateData).length > 0) {
        await tx.user.update({
          where: { id: cashier.userId },
          data: updateData,
        });
      }

      const cashierUpdateData: {
        cashierLinkSlug?: string;
        password?: string;
      } = {};

      if (cashierLinkSlug) cashierUpdateData.cashierLinkSlug = cashierLinkSlug;
      if (password) cashierUpdateData.password = password;

      const updatedCashier = await tx.cashier.update({
        where: { id },
        data: cashierUpdateData,
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

      return updatedCashier;
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
    console.error("Failed to update cashier:", error);
    return NextResponse.json(
      {
        error: sanitizeErrorMessage(error) || "Failed to update cashier. Please try again.",
        cashier: null,
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized", success: false },
        { status: 401 },
      );
    }

    const { id } = await params;

    const admin = await prisma.admin.findFirst({
      where: { userId: session.user.id },
      include: { business: true },
    });

    if (!admin || !admin.business) {
      return NextResponse.json(
        { error: "Business not found", success: false },
        { status: 404 },
      );
    }

    const cashier = await prisma.cashier.findFirst({
      where: {
        id,
        businessId: admin.business.id,
      },
    });

    if (!cashier) {
      return NextResponse.json(
        { error: "Cashier not found", success: false },
        { status: 404 },
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.cashier.delete({
        where: { id },
      });

      await tx.user.delete({
        where: { id: cashier.userId },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to delete cashier:", error);
    return NextResponse.json(
      {
        error: sanitizeErrorMessage(error) || "Failed to delete cashier. Please try again.",
        success: false,
      },
      { status: 500 },
    );
  }
}
