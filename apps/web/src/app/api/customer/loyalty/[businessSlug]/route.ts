import { withCustomerAuth } from "@/lib/auth/middleware";
import { expireBucketsForCustomer } from "@/lib/loyalty";
import { sanitizeErrorMessage } from "@/lib/utils/error-handler";
import { db } from "@reelo/db";
import { NextRequest, NextResponse } from "next/server";

export const GET = withCustomerAuth<{ businessSlug: string }>(
  async (_request: NextRequest, context, params) => {
    try {
      const { businessSlug } = params;

      const business = await db.business.findUnique({
        where: { slug: businessSlug },
        include: {
          loyalty: true,
        },
      });

      if (!business) {
        return NextResponse.json(
          { error: "Business not found", loyalty: null },
          { status: 404 },
        );
      }

      const businessCustomer = await db.businessCustomer.findUnique({
        where: {
          businessId_customerId: {
            businessId: business.id,
            customerId: context.customer.id,
          },
        },
      });

      if (!businessCustomer) {
        return NextResponse.json(
          { error: "Customer not found", loyalty: null },
          { status: 404 },
        );
      }

      await db.$transaction(async (tx) => {
        await expireBucketsForCustomer(tx, {
          businessId: business.id,
          customerId: businessCustomer.customerId,
        });
      });

      const refreshed = await db.businessCustomer.findUnique({
        where: {
          businessId_customerId: {
            businessId: business.id,
            customerId: businessCustomer.customerId,
          },
        },
      });

      const buckets = await db.pointsBucket.findMany({
        where: {
          businessId: business.id,
          customerId: businessCustomer.customerId,
          remainingAmount: { gt: 0 },
          status: "ACTIVE",
        },
        orderBy: { expiresAt: "asc" },
        take: 10,
        select: { id: true, remainingAmount: true, expiresAt: true },
      });

      const transactions = await db.pointsTransaction.findMany({
        where: {
          businessId: business.id,
          customerId: businessCustomer.customerId,
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      });

      return NextResponse.json({
        loyalty: {
          business: {
            id: business.id,
            name: business.name,
            slug: business.slug,
            currencySymbol: business.defaultCurrencySymbol,
            currencyCode: business.defaultCurrencyCode,
          },
          settings: business.loyalty,
          pointsBalance: refreshed?.pointsBalance ?? 0,
          buckets: buckets.map((b) => ({
            id: b.id,
            remainingAmount: b.remainingAmount,
            expiresAt: b.expiresAt.toISOString(),
          })),
          transactions: transactions.map((t) => ({
            id: t.id,
            amount: t.amount,
            type: t.type,
            source: t.source,
            createdAt: t.createdAt.toISOString(),
            expiresAt: t.expiresAt ? t.expiresAt.toISOString() : null,
            metadata: t.metadata,
          })),
        },
      });
    } catch (error: any) {
      console.error("Failed to fetch customer loyalty:", error);
      return NextResponse.json(
        {
          loyalty: null,
          error:
            sanitizeErrorMessage(error) ||
            "Failed to fetch loyalty data. Please try again.",
        },
        { status: 500 },
      );
    }
  },
);
