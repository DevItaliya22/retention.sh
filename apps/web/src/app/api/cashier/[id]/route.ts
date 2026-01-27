import { withAdminAuth } from "@/lib/auth/middleware";
import { updateCashierSchema } from "@/lib/schemas/cashier";
import {
  sanitizeErrorMessage,
  validateSchema,
} from "@/lib/utils/error-handler";
import { prisma } from "@reelo/db";
import { NextRequest, NextResponse } from "next/server";

export const PUT = withAdminAuth<{ id: string }>(
  async (request: NextRequest, context, params) => {
    try {
      const { id } = params;

      const cashier = await prisma.cashier.findFirst({
        where: {
          id,
          businessId: context.business.id,
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

      const validation = validateSchema(updateCashierSchema, body);
      if (!validation.success) {
        return NextResponse.json(
          { error: validation.error, cashier: null },
          { status: 400 },
        );
      }

      const { name, email, password, cashierLinkSlug } = validation.data;

      if (cashierLinkSlug && cashierLinkSlug !== cashier.cashierLinkSlug) {
        const existingCashierSlug = await prisma.cashier.findFirst({
          where: {
            cashierLinkSlug,
            businessId: context.business.id,
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
        error:
          sanitizeErrorMessage(error) ||
          "Failed to update cashier. Please try again.",
        cashier: null,
      },
      { status: 500 },
    );
  }
});

export const DELETE = withAdminAuth<{ id: string }>(
  async (request: NextRequest, context, params) => {
    try {
      const { id } = params;

      const cashier = await prisma.cashier.findFirst({
        where: {
          id,
          businessId: context.business.id,
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
          error:
            sanitizeErrorMessage(error) ||
            "Failed to delete cashier. Please try again.",
          success: false,
        },
        { status: 500 },
      );
    }
  },
);
