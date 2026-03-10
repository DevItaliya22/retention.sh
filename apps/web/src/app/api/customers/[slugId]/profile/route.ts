import {
  getLockedReferralBalance,
  getLockedShopifyBalance,
} from "@/lib/actions/loyalty";
import { withAdminAuth } from "@/lib/auth/middleware";
import { runTransaction } from "@/lib/db/transaction";
import { customerSlugIdParamSchema } from "@/lib/schemas/customer";
import {
  sanitizeErrorMessage,
  validateSchema,
} from "@/lib/utils/error-handler";
import { parseFreeItems } from "@/lib/utils/free-items";
import { db, TransactionValueKind } from "@reelo/db";
import { NextRequest, NextResponse } from "next/server";

export const GET = withAdminAuth<{ slugId: string }>(
  async (_request: NextRequest, context, params) => {
    try {
      const validation = validateSchema(customerSlugIdParamSchema, params);
      if (!validation.success) {
        return NextResponse.json(
          { error: validation.error, customer: null },
          { status: 400 },
        );
      }

      const { slugId } = validation.data;

      const businessCustomer = await db.businessCustomer.findFirst({
        where: { slugId, businessId: context.business.id },
        include: {
          customer: {
            include: {
              user: { select: { id: true, name: true, phoneNumber: true } },
            },
          },
          referredBy: {
            include: {
              customer: { include: { user: { select: { name: true } } } },
            },
          },
          referrals: {
            include: {
              customer: { include: { user: { select: { name: true } } } },
            },
          },
          wallet: true,
        },
      });

      if (!businessCustomer) {
        return NextResponse.json(
          { error: "Customer not found", customer: null },
          { status: 404 },
        );
      }

      const rawCashback = businessCustomer.wallet?.cashbackBalance ?? 0;
      const { lockedCashback, lockedReferralCashback } = await runTransaction(
        async (tx) => ({
          lockedCashback: await getLockedShopifyBalance(tx, {
            businessId: context.business.id,
            customerId: businessCustomer.customerId,
            valueKind: TransactionValueKind.CASHBACK,
          }),
          lockedReferralCashback: await getLockedReferralBalance(tx, {
            businessId: context.business.id,
            customerId: businessCustomer.customerId,
          }),
        }),
      );
      const cashbackBalance = Math.max(
        0,
        rawCashback - lockedCashback - lockedReferralCashback,
      );

      const customer = {
        id: businessCustomer.slugId,
        slugId: businessCustomer.slugId,
        customerId: businessCustomer.customer.id,
        name: businessCustomer.customer.user.name,
        email: businessCustomer.customer.email,
        phone: businessCustomer.customer.user.phoneNumber,
        pointsBalance:
          (businessCustomer.wallet?.amountSpentBalance ?? 0) +
          (businessCustomer.wallet?.visitPointsBalance ?? 0),
        cashbackBalance,
        freeItems: parseFreeItems(businessCustomer.wallet?.freeItems),
        createdAt: businessCustomer.createdAt.toISOString(),
        updatedAt: businessCustomer.updatedAt.toISOString(),
        businessSlug: context.business.slug,
        referralSlug: businessCustomer.referralSlug,
        isServiceEnabled: context.business.isServiceEnabled,
        referredBy: businessCustomer.referredBy
          ? {
              name: businessCustomer.referredBy.customer.user.name,
              slugId: businessCustomer.referredBy.slugId,
            }
          : null,
        referrals: businessCustomer.referrals.map((r) => ({
          name: r.customer.user.name,
          slugId: r.slugId,
        })),
      };

      return NextResponse.json({ customer });
    } catch (error: unknown) {
      console.error("Failed to fetch customer profile:", error);
      return NextResponse.json(
        {
          error:
            sanitizeErrorMessage(error) ||
            "Failed to fetch customer. Please try again.",
          customer: null,
        },
        { status: 500 },
      );
    }
  },
);
