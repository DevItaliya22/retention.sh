import { withAdminAuth } from "@/lib/auth/middleware";
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
          feedbackLink: {
            select: {
              feedbackResponse: {
                select: {
                  rating: true,
                  comment: true,
                  howDidYouHear: true,
                  selectedCategories: true,
                  selectedSelectionOptions: {
                    select: { id: true, label: true },
                  },
                  createdAt: true,
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
            orderBy: { createdAt: "asc" },
            select: {
              id: true,
              valueKind: true,
              type: true,
              source: true,
              amount: true,
              description: true,
              metadata: true,
              createdAt: true,
              campaign: { select: { title: true, rewardType: true } },
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

      const pointValueKinds = ["AMOUNT_SPENT_POINTS", "VISIT_POINTS"] as const;
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

      const formattedBill = {
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
        amount: bill.finalAmount,
        loyaltyPointsEarned: earned,
        loyaltyPointsRedeemed: redeemed,
        businessCustomerId: bill.businessCustomer.slugId,
        customerName: bill.businessCustomer.customer.user.name,
        customerPhone: bill.businessCustomer.customer.user.phoneNumber,
        customerEmail: bill.businessCustomer.customer.email,
        feedback:
          bill.feedbackLink?.feedbackResponse != null
            ? {
                rating: bill.feedbackLink.feedbackResponse.rating,
                comment: bill.feedbackLink.feedbackResponse.comment,
                howDidYouHear: bill.feedbackLink.feedbackResponse.howDidYouHear,
                selectedCategories:
                  bill.feedbackLink.feedbackResponse.selectedCategories,
                selectionOptions:
                  bill.feedbackLink.feedbackResponse.selectedSelectionOptions.map(
                    (opt) => ({ id: opt.id, label: opt.label }),
                  ),
                submittedAt:
                  bill.feedbackLink.feedbackResponse.createdAt.toISOString(),
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
        loyaltyLogs: bill.transactions.map((log) => {
          const meta = log.metadata as {
            redeemedAtBusinessId?: string;
            freeItemName?: string;
          } | null;
          const redeemedAtOurStore =
            meta != null &&
            typeof meta.redeemedAtBusinessId === "string" &&
            meta.redeemedAtBusinessId === context.business.id &&
            log.type === "REDEEMED";
          return {
            id: log.id,
            valueKind: log.valueKind,
            type: log.type,
            source: log.source,
            amount: log.amount,
            isPartnerRedemption: redeemedAtOurStore,
            campaignTitle: log.campaign?.title ?? null,
            freeItemName: meta?.freeItemName ?? null,
            createdAt: log.createdAt.toISOString(),
          };
        }),
      };

      return NextResponse.json({
        bill: formattedBill,
        businessSlug: context.business.slug,
      });
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
