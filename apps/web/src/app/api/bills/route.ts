import { withAdminAuth } from "@/lib/auth/middleware";
import { sumCashbackEarnedFromTransactions } from "@/lib/loyalty";
import { billsQuerySchema } from "@/lib/schemas/bill";
import {
  sanitizeErrorMessage,
  validateSchema,
} from "@/lib/utils/error-handler";
import { db } from "@reelo/db";
import { NextRequest, NextResponse } from "next/server";

export const GET = withAdminAuth(async (request: NextRequest, context) => {
  try {
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    const validation = validateSchema(billsQuerySchema, queryParams);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error, bills: [], total: 0, perPage: 10 },
        { status: 400 },
      );
    }

    const {
      page = 1,
      perPage = 10,
      sort,
      billNumber,
      email,
      customerName,
      dateFrom,
      dateTo,
      amountMin,
      amountMax,
    } = validation.data;

    const skip = (page - 1) * perPage;
    const take = perPage;

    const where: any = {
      businessId: context.business.id,
    };

    if (billNumber) {
      where.billNumber = {
        contains: billNumber,
        mode: "insensitive",
      };
    }

    if (email || customerName) {
      const customerFilters: any = {};

      if (email) {
        customerFilters.email = {
          contains: email,
          mode: "insensitive",
        };
      }

      if (customerName) {
        customerFilters.user = {
          name: {
            contains: customerName,
            mode: "insensitive",
          },
        };
      }

      where.businessCustomer = {
        customer: customerFilters,
      };
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo);
      }
    }

    if (amountMin !== undefined || amountMax !== undefined) {
      where.finalAmount = {};
      if (amountMin !== undefined) {
        where.finalAmount.gte = amountMin;
      }
      if (amountMax !== undefined) {
        where.finalAmount.lte = amountMax;
      }
    }

    const orderBy: any = {};
    if (sort) {
      const [field, direction] = sort.split(":");
      if (
        field === "billNumber" ||
        field === "finalAmount" ||
        field === "amount" ||
        field === "createdAt"
      ) {
        const orderField = field === "amount" ? "finalAmount" : field;
        orderBy[orderField] = direction === "desc" ? "desc" : "asc";
      } else {
        orderBy.createdAt = "desc";
      }
    } else {
      orderBy.createdAt = "desc";
    }

    const [bills, total] = await Promise.all([
      db.bill.findMany({
        where,
        skip,
        take,
        orderBy,
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
          feedbackLink: {
            select: {
              token: true,
              feedbackResponse: {
                select: {
                  rating: true,
                  howDidYouHear: true,
                  selectedSelectionOptions: {
                    select: {
                      id: true,
                      label: true,
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
            where: {
              type: { in: ["EARNED", "REDEEMED"] },
            },
            select: { type: true, amount: true, valueKind: true },
          },
        },
      }),
      db.bill.count({ where }),
    ]);

    const pointValueKinds = ["AMOUNT_SPENT_POINTS", "VISIT_POINTS"] as const;
    const formattedBills = bills.map((bill) => {
      const earned = bill.transactions
        .filter(
          (pt) =>
            pt.type === "EARNED" &&
            pointValueKinds.includes(
              pt.valueKind as (typeof pointValueKinds)[number],
            ),
        )
        .reduce((s, pt) => s + Math.max(0, pt.amount), 0);
      const redeemed = bill.transactions
        .filter(
          (pt) =>
            pt.type === "REDEEMED" &&
            pointValueKinds.includes(
              pt.valueKind as (typeof pointValueKinds)[number],
            ),
        )
        .reduce((s, pt) => s + Math.abs(pt.amount), 0);
      const cashbackEarnedFromTx = sumCashbackEarnedFromTransactions(
        bill.transactions,
      );
      return {
        id: bill.id,
        billNumber: bill.billNumber,
        subtotal: bill.subtotal,
        storeDiscount: bill.storeDiscount,
        tax: bill.tax,
        finalAmount: bill.finalAmount,
        cashbackAmount:
          cashbackEarnedFromTx > 0 ? cashbackEarnedFromTx : bill.cashbackAmount,
        cashbackRedeemedAmount: bill.cashbackRedeemedAmount,
        userPaidAmount: bill.userPaidAmount,
        amount: bill.userPaidAmount ?? bill.finalAmount,
        loyaltyPointsEarned: earned,
        loyaltyPointsRedeemed: redeemed,
        customerName: bill.businessCustomer.customer.user.name,
        customerPhone: bill.businessCustomer.customer.user.phoneNumber,
        customerEmail: bill.businessCustomer.customer.email,
        feedbackLink: bill.feedbackLink
          ? { token: bill.feedbackLink.token }
          : null,
        feedback:
          bill.feedbackLink && bill.feedbackLink.feedbackResponse
            ? {
                rating: bill.feedbackLink.feedbackResponse.rating,
                howDidYouHear: bill.feedbackLink.feedbackResponse.howDidYouHear,
                selectionOptions:
                  bill.feedbackLink.feedbackResponse.selectedSelectionOptions.map(
                    (opt) => ({
                      id: opt.id,
                      label: opt.label,
                    }),
                  ),
              }
            : null,
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
      };
    });

    return NextResponse.json({
      bills: formattedBills,
      total,
      page,
      perPage,
      businessSlug: context.business.slug,
    });
  } catch (error: any) {
    console.error("Failed to fetch bills:", error);
    return NextResponse.json(
      {
        error:
          sanitizeErrorMessage(error) ||
          "Failed to fetch bills. Please try again.",
        bills: [],
        total: 0,
        perPage: 10,
      },
      { status: 500 },
    );
  }
});
