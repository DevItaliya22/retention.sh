import { expireBucketsForCustomer } from "@/lib/actions/loyalty";
import { withCustomerAuth } from "@/lib/auth/middleware";
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

      await db.$transaction(async (tx) => {
        await expireBucketsForCustomer(tx, {
          businessId: bc.businessId,
          customerId: bc.customerId,
        });
      });

      const refreshed = await db.businessCustomer.findUnique({
        where: {
          businessId_customerId: {
            businessId: bc.businessId,
            customerId: bc.customerId,
          },
        },
        select: { pointsBalance: true },
      });

      const nextExpiring = await db.pointsTransaction.findFirst({
        where: {
          businessId: bc.businessId,
          customerId: bc.customerId,
          type: "EARNED",
          remainingAmount: { gt: 0 },
          expiresAt: { not: null },
        },
        orderBy: { expiresAt: "asc" },
        select: { remainingAmount: true, expiresAt: true },
      });

      items.push({
        businessId: bc.businessId,
        businessName: bc.business.name,
        businessSlug: bc.business.slug,
        pointsBalance: refreshed?.pointsBalance ?? bc.pointsBalance,
        nextExpiry: nextExpiring?.expiresAt
          ? {
              amount: nextExpiring.remainingAmount ?? 0,
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
