import { withCashierAuth } from "@/lib/auth/middleware";
import {
  sanitizeErrorMessage,
  validateSchema,
} from "@/lib/utils/error-handler";
import { db } from "@reelo/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const cashierBillsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).optional(),
  perPage: z.coerce.number().int().min(1).max(50).default(20).optional(),
});

export const GET = withCashierAuth(async (request: NextRequest, context) => {
  try {
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    const validation = validateSchema(cashierBillsQuerySchema, queryParams);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error, bills: [], total: 0, perPage: 20 },
        { status: 400 },
      );
    }

    const { page = 1, perPage = 20 } = validation.data;
    const skip = (page - 1) * perPage;
    const take = perPage;

    const where = {
      businessId: context.business.id,
      cashierId: context.cashier.id,
    };

    const [bills, total] = await Promise.all([
      db.bill.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
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
      }),
      db.bill.count({ where }),
    ]);

    const formattedBills = bills.map((bill) => ({
      id: bill.id,
      billNumber: bill.billNumber,
      subtotal: bill.subtotal,
      storeDiscount: bill.storeDiscount,
      tax: bill.tax,
      finalAmount: bill.finalAmount,
      cashbackAmount: bill.cashbackAmount,
      userPaidAmount: bill.userPaidAmount,
      amount: bill.userPaidAmount ?? bill.finalAmount,
      customerName: bill.businessCustomer.customer.user.name,
      customerPhone: bill.businessCustomer.customer.user.phoneNumber,
      customerEmail: bill.businessCustomer.customer.email,
      createdAt: bill.createdAt.toISOString(),
    }));

    return NextResponse.json({
      bills: formattedBills,
      total,
      page,
      perPage,
    });
  } catch (error: unknown) {
    console.error("Failed to fetch cashier bills:", error);
    return NextResponse.json(
      {
        error:
          sanitizeErrorMessage(error) ||
          "Failed to fetch bills. Please try again.",
        bills: [],
        total: 0,
        perPage: 20,
      },
      { status: 500 },
    );
  }
});
