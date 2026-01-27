import { withAdminAuth } from "@/lib/auth/middleware";
import {
  sanitizeErrorMessage,
  validateSchema,
} from "@/lib/utils/error-handler";
import { z } from "zod";
import { prisma } from "@reelo/db";
import { NextRequest, NextResponse } from "next/server";

const billIdParamSchema = z.object({
  id: z.string().uuid("Invalid bill ID"),
});

export const GET = withAdminAuth<{ id: string }>(
  async (request: NextRequest, context, params) => {
    try {
      const validation = validateSchema(billIdParamSchema, params);
      if (!validation.success) {
        return NextResponse.json(
          { error: validation.error, bill: null },
          { status: 400 },
        );
      }

      const { id } = validation.data;

      const bill = await prisma.bill.findFirst({
        where: {
          id,
          businessId: context.business.id,
        },
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
      });

      if (!bill) {
        return NextResponse.json(
          { error: "Bill not found", bill: null },
          { status: 404 },
        );
      }

      const formattedBill = {
        id: bill.id,
        billNumber: bill.billNumber,
        amount: bill.amount,
        businessCustomerId: bill.businessCustomer.slugId,
        customerName: bill.businessCustomer.customer.user.name,
        customerPhone: bill.businessCustomer.customer.user.phoneNumber,
        customerEmail: bill.businessCustomer.customer.email,
        createdAt: bill.createdAt.toISOString(),
        updatedAt: bill.updatedAt.toISOString(),
      };

      return NextResponse.json({ bill: formattedBill });
    } catch (error: unknown) {
      console.error("Failed to fetch bill:", error);
      return NextResponse.json(
        {
          error:
            sanitizeErrorMessage(error) || "Failed to fetch bill. Try again.",
          bill: null,
        },
        { status: 500 },
      );
    }
  },
);
