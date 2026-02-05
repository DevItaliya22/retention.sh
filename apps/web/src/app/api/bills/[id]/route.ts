import { withAdminAuth } from "@/lib/auth/middleware";
import {
  sanitizeErrorMessage,
  validateSchema,
} from "@/lib/utils/error-handler";
import { db } from "@reelo/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

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

      const bill = await db.bill.findFirst({
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
          lineItems: {
            include: {
              sku: {
                select: {
                  id: true,
                  sku: true,
                  name: true,
                  price: true,
                  unit: true,
                },
              },
            },
          },
          pointsTransactions: {
            orderBy: { createdAt: "asc" },
            select: {
              id: true,
              type: true,
              source: true,
              amount: true,
              balanceAfter: true,
              createdAt: true,
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
        finalAmount: bill.finalAmount,
        loyaltyPointsEarned: bill.loyaltyPointsEarned,
        loyaltyPointsRedeemed: bill.loyaltyPointsRedeemed,
        businessCustomerId: bill.businessCustomer.slugId,
        customerName: bill.businessCustomer.customer.user.name,
        customerPhone: bill.businessCustomer.customer.user.phoneNumber,
        customerEmail: bill.businessCustomer.customer.email,
        lineItems: bill.lineItems.map((li) => ({
          id: li.id,
          skuId: li.skuId,
          qty: li.qty,
          unitPrice: li.unitPrice,
          sku: {
            id: li.sku.id,
            sku: li.sku.sku,
            name: li.sku.name,
            price: li.sku.price,
            unit: li.sku.unit,
          },
        })),
        createdAt: bill.createdAt.toISOString(),
        updatedAt: bill.updatedAt.toISOString(),
        loyaltyLogs: bill.pointsTransactions.map((log) => ({
          id: log.id,
          type: log.type,
          source: log.source,
          amount: log.amount,
          balanceAfter: log.balanceAfter,
          createdAt: log.createdAt.toISOString(),
        })),
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
