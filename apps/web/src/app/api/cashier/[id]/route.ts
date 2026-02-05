import { hashPassword } from "@/lib/utils/password";
import { withAdminAuth } from "@/lib/auth/middleware";
import { updateCashierSchema } from "@/lib/schemas/cashier";
import {
  sanitizeErrorMessage,
  validateSchema,
} from "@/lib/utils/error-handler";
import { db } from "@reelo/db";
import { NextRequest, NextResponse } from "next/server";

export const GET = withAdminAuth<{ id: string }>(
  async (request: NextRequest, context, params) => {
    try {
      const { id } = params;

      const cashier = await db.cashier.findFirst({
        where: {
          id,
          businessId: context.business.id,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          bills: {
            take: 3,
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              billNumber: true,
              amount: true,
              createdAt: true,
            },
          },
        },
      });

      if (!cashier) {
        return NextResponse.json(
          { error: "Cashier not found", cashier: null },
          { status: 404 },
        );
      }

      return NextResponse.json({
        cashier: {
          id: cashier.id,
          userId: cashier.userId,
          name: cashier.user.name,
          email: cashier.email,
          cashierLinkSlug: cashier.cashierLinkSlug,
          isActive: cashier.isActive,
          createdAt: cashier.createdAt.toISOString(),
          updatedAt: cashier.updatedAt.toISOString(),
          recentBills: cashier.bills.map((b) => ({
            id: b.id,
            billNumber: b.billNumber,
            amount: b.amount,
            createdAt: b.createdAt.toISOString(),
          })),
        },
      });
    } catch (error: any) {
      console.error("Failed to fetch cashier:", error);
      return NextResponse.json(
        {
          error:
            sanitizeErrorMessage(error) ||
            "Failed to fetch cashier. Please try again.",
          cashier: null,
        },
        { status: 500 },
      );
    }
  },
);

export const PUT = withAdminAuth<{ id: string }>(
  async (request: NextRequest, context, params) => {
    try {
      const { id } = params;

      const cashier = await db.cashier.findFirst({
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

      const { name, email, password, cashierLinkSlug, isActive } =
        validation.data;

      if (cashierLinkSlug && cashierLinkSlug !== cashier.cashierLinkSlug) {
        const existingCashierSlug = await db.cashier.findFirst({
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

      if (email && email !== cashier.email) {
        const existingCashierEmail = await db.cashier.findFirst({
          where: {
            businessId: context.business.id,
            email,
            id: { not: id },
          },
        });

        if (existingCashierEmail) {
          return NextResponse.json(
            {
              error:
                "A cashier with this email already exists in this business",
              cashier: null,
            },
            { status: 400 },
          );
        }
      }

      const result = await db.$transaction(async (tx) => {
        if (name) {
          await tx.user.update({
            where: { id: cashier.userId },
            data: { name },
          });
        }

        const cashierUpdateData: {
          cashierLinkSlug?: string;
          email?: string;
          password?: string;
          isActive?: boolean;
        } = {};

        if (cashierLinkSlug)
          cashierUpdateData.cashierLinkSlug = cashierLinkSlug;
        if (email) cashierUpdateData.email = email;
        if (password) cashierUpdateData.password = await hashPassword(password);
        if (typeof isActive === "boolean")
          cashierUpdateData.isActive = isActive;

        const updatedCashier = await tx.cashier.update({
          where: { id },
          data: cashierUpdateData,
          include: {
            user: {
              select: {
                id: true,
                name: true,
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
          email: result.email,
          cashierLinkSlug: result.cashierLinkSlug,
          isActive: result.isActive,
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
  },
);

export const DELETE = withAdminAuth<{ id: string }>(
  async (request: NextRequest, context, params) => {
    try {
      const { id } = params;

      const cashier = await db.cashier.findFirst({
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

      await db.$transaction(async (tx) => {
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
