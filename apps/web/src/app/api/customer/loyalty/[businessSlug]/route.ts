import { expireBucketsForCustomer } from "@/lib/actions/loyalty";
import { withCustomerAuth } from "@/lib/auth/middleware";
import { businessSlugParamSchema } from "@/lib/schemas/common";
import {
  sanitizeErrorMessage,
  validateSchema,
} from "@/lib/utils/error-handler";
import {
  type IsServiceEnabled,
  isServiceEnabled,
} from "@/lib/utils/service-enabled";
import { db } from "@reelo/db";
import { NextRequest, NextResponse } from "next/server";

export const GET = withCustomerAuth<{ businessSlug: string }>(
  async (_request: NextRequest, context, params) => {
    try {
      const validation = validateSchema(businessSlugParamSchema, params);
      if (!validation.success) {
        return NextResponse.json(
          { loyalty: null, error: validation.error },
          { status: 400 },
        );
      }
      const { businessSlug } = validation.data;

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

      if (
        !isServiceEnabled(
          business.isServiceEnabled as IsServiceEnabled | null | undefined,
          "loyalty",
        )
      ) {
        return NextResponse.json(
          { error: "Loyalty is not enabled for this business", loyalty: null },
          { status: 403 },
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

      const expiringRows = await db.pointsTransaction.findMany({
        where: {
          businessId: business.id,
          customerId: businessCustomer.customerId,
          type: "EARNED",
          remainingAmount: { gt: 0 },
          expiresAt: { not: null },
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
          buckets: expiringRows
            .filter((b) => b.expiresAt)
            .map((b) => ({
              id: b.id,
              remainingAmount: b.remainingAmount ?? 0,
              expiresAt: b.expiresAt!.toISOString(),
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
