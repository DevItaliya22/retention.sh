import { expirePointsForCustomer } from "@/lib/actions/loyalty";
import { withCustomerAuth } from "@/lib/auth/middleware";
import { runTransaction } from "@/lib/db/transaction";
import { sanitizeErrorMessage } from "@/lib/utils/error-handler";
import {
  type IsServiceEnabled,
  isServiceEnabled,
} from "@/lib/utils/service-enabled";
import { db } from "@reelo/db";
import { NextResponse } from "next/server";

export const GET = withCustomerAuth(async (_request, context) => {
  try {
    const businessCustomers = await db.businessCustomer.findMany({
      where: { customerId: context.customer.id },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            slug: true,
            defaultCurrencyCode: true,
            defaultCurrencySymbol: true,
            isServiceEnabled: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const items = [] as {
      businessId: string;
      businessName: string;
      businessSlug: string;
      pointsBalance: number;
      nextExpiry?: { amount: number; expiresAt: string } | null;
      currencySymbol: string;
      currencyCode: string;
    }[];

    for (const bc of businessCustomers) {
      if (
        !isServiceEnabled(
          bc.business.isServiceEnabled as IsServiceEnabled | null | undefined,
          "loyalty",
        )
      ) {
        continue;
      }

      await runTransaction(async (tx) => {
        await expirePointsForCustomer(tx, {
          businessId: bc.businessId,
          customerId: bc.customerId,
        });
      });

      const wallet = await db.wallet.findUnique({
        where: {
          businessId_customerId: {
            businessId: bc.businessId,
            customerId: bc.customerId,
          },
        },
      });

      const nextExpiring = await db.transaction.findFirst({
        where: {
          businessId: bc.businessId,
          customerId: bc.customerId,
          type: "EARNED",
          amount: { gt: 0 },
          expiresAt: { not: null },
        },
        orderBy: { expiresAt: "asc" },
        select: { amount: true, expiresAt: true },
      });

      const businessLoyalty = await db.loyalty.findFirst({
        where: { businessId: bc.businessId },
      });
      const loyaltyType = businessLoyalty?.loyaltyType ?? null;
      const amountSpentBalance = wallet?.amountSpentBalance ?? 0;
      const visitPointsBalance = wallet?.visitPointsBalance ?? 0;
      const pointsBalance =
        loyaltyType === "AMOUNT_SPENT"
          ? amountSpentBalance
          : loyaltyType === "VISIT_MADE"
            ? visitPointsBalance
            : amountSpentBalance + visitPointsBalance;

      items.push({
        businessId: bc.businessId,
        businessName: bc.business.name,
        businessSlug: bc.business.slug,
        pointsBalance,
        nextExpiry: nextExpiring?.expiresAt
          ? {
              amount: nextExpiring.amount ?? 0,
              expiresAt: nextExpiring.expiresAt.toISOString(),
            }
          : null,
        currencySymbol: bc.business.defaultCurrencySymbol,
        currencyCode: bc.business.defaultCurrencyCode,
      });
    }

    return NextResponse.json({ items });
  } catch (error: any) {
    console.error("Failed to fetch customer loyalty:", error);
    return NextResponse.json(
      {
        items: [],
        error:
          sanitizeErrorMessage(error) ||
          "Failed to fetch loyalty data. Please try again.",
      },
      { status: 500 },
    );
  }
});
