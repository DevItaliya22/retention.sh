import { withCashierAuth } from "@/lib/auth/middleware";
import { sumCashbackEarnedFromTransactions } from "@/lib/loyalty";
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

export const GET = withCashierAuth<{ id: string }>(
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
          cashierId: context.cashier.id,
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
          transactions: {
            where: { type: "EARNED", valueKind: "CASHBACK" },
            select: { type: true, valueKind: true, amount: true },
          },
        },
      });

      if (!bill) {
        return NextResponse.json(
          { error: "Bill not found", bill: null },
          { status: 404 },
        );
      }

      const cashbackEarnedFromTx = sumCashbackEarnedFromTransactions(
        bill.transactions,
      );

      const formattedBill = {
        id: bill.id,
        billNumber: bill.billNumber,
        subtotal: bill.subtotal,
        storeDiscount: bill.storeDiscount,
        tax: bill.tax,
        finalAmount: bill.finalAmount,
        cashbackAmount:
          cashbackEarnedFromTx > 0 ? cashbackEarnedFromTx : bill.cashbackAmount,
        userPaidAmount: bill.userPaidAmount,
        amount: bill.userPaidAmount ?? bill.finalAmount,
        notes: bill.notes,
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
      };

      return NextResponse.json({ bill: formattedBill });
    } catch (error: unknown) {
      console.error("Failed to fetch cashier bill:", error);
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
