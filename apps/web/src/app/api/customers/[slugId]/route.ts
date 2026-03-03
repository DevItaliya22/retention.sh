import {
  getLockedReferralBalance,
  getLockedShopifyBalance,
} from "@/lib/actions/loyalty";
import { withAdminAuth } from "@/lib/auth/middleware";
import { runTransaction } from "@/lib/db/transaction";
import { sumCashbackEarnedFromTransactions } from "@/lib/loyalty";
import {
  customerDetailQuerySchema,
  customerSlugIdParamSchema,
} from "@/lib/schemas/customer";
import {
  sanitizeErrorMessage,
  validateSchema,
} from "@/lib/utils/error-handler";
import { parseFreeItems } from "@/lib/utils/free-items";
import { db, TransactionValueKind } from "@reelo/db";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/customers/[slugId]
 *
 * Route segment is [slugId] (not [id]) to avoid confusion with Customer.id or
 * BusinessCustomer composite id (businessId + customerId). The param value is
 * BusinessCustomer.slugId – a short uuid used in URLs and APIs. Scoped by
 * admin.business.id.
 */
export const GET = withAdminAuth<{ slugId: string }>(
  async (request: NextRequest, context, params) => {
    try {
      const validation = validateSchema(customerSlugIdParamSchema, params);
      if (!validation.success) {
        return NextResponse.json(
          { error: validation.error, customer: null },
          { status: 400 },
        );
      }

      const { slugId } = validation.data;

      const queryValidation = validateSchema(
        customerDetailQuerySchema,
        Object.fromEntries(request.nextUrl.searchParams.entries()),
      );
      const query = queryValidation.success ? queryValidation.data : undefined;
      const billsPage = query?.billsPage ?? 1;
      const billsPerPage = query?.billsPerPage ?? 5;
      const activityPage = query?.activityPage ?? 1;
      const activityPerPage = query?.activityPerPage ?? 5;

      const businessCustomer = await db.businessCustomer.findFirst({
        where: {
          slugId,
          businessId: context.business.id,
        },
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
          referredBy: {
            include: {
              customer: {
                include: {
                  user: {
                    select: { name: true },
                  },
                },
              },
            },
          },
          referrals: {
            include: {
              customer: {
                include: {
                  user: {
                    select: { name: true },
                  },
                },
              },
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

      // Bills: paginated, sorted by latest first (server-side)
      const [billsRows, billsTotal] = await Promise.all([
        db.bill.findMany({
          where: {
            businessId: context.business.id,
            customerId: businessCustomer.customerId,
          },
          orderBy: { createdAt: "desc" },
          skip: (billsPage - 1) * billsPerPage,
          take: billsPerPage,
          include: {
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
        }),
        db.bill.count({
          where: {
            businessId: context.business.id,
            customerId: businessCustomer.customerId,
          },
        }),
      ]);

      // Partner redemption logs (for activity merge)
      const partnerRedemptionTxs = await db.transaction.findMany({
        where: {
          businessId: context.business.id,
          customerId: businessCustomer.customerId,
          type: "REDEEMED",
          source: "BILL",
        },
        orderBy: { createdAt: "desc" },
      });
      const partnerRedemptionsRaw = partnerRedemptionTxs
        .filter(
          (t) =>
            t.metadata != null &&
            typeof t.metadata === "object" &&
            "redeemedAtBusinessId" in t.metadata &&
            typeof (t.metadata as { redeemedAtBusinessId?: string })
              .redeemedAtBusinessId === "string",
        )
        .map((t) => {
          const meta = t.metadata as { redeemedAtBusinessId: string };
          return {
            id: t.id,
            amount: Math.abs(t.amount),
            valueKind: t.valueKind,
            redeemedAtBusinessId: meta.redeemedAtBusinessId,
            createdAt: t.createdAt.toISOString(),
          };
        });
      const redeemedAtBusinessIds = [
        ...new Set(
          partnerRedemptionsRaw
            .map((r) => r.redeemedAtBusinessId)
            .filter(Boolean),
        ),
      ];
      const businessNames =
        redeemedAtBusinessIds.length > 0
          ? await db.business.findMany({
              where: { id: { in: redeemedAtBusinessIds } },
              select: { id: true, name: true },
            })
          : [];
      const businessNameMap = new Map(businessNames.map((b) => [b.id, b.name]));
      const partnerRedemptionsWithNames = partnerRedemptionsRaw.map((r) => ({
        ...r,
        redeemedAtBusinessName:
          businessNameMap.get(r.redeemedAtBusinessId) ?? null,
      }));

      // Referral logs (for activity merge) — ReferralLog has referrer = BusinessCustomer (composite)
      const referralLogsAll = await db.referralLog.findMany({
        where: {
          referrerBusinessId: context.business.id,
          referrerCustomerId: businessCustomer.customerId,
        },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          newCustomerName: true,
          newCustomerPhone: true,
          becameCustomer: true,
          createdAt: true,
        },
      });
      const referralLogsMapped = referralLogsAll.map((log) => ({
        id: log.id,
        newCustomerName: log.newCustomerName,
        newCustomerPhone: log.newCustomerPhone,
        becameCustomer: log.becameCustomer,
        createdAt: log.createdAt.toISOString(),
      }));

      // Activity: merge partner redemptions + referral logs, sort by date desc, paginate
      type ActivityPartner = (typeof partnerRedemptionsWithNames)[number] & {
        type: "partner";
      };
      type ActivityReferral = (typeof referralLogsMapped)[number] & {
        type: "referral";
      };
      const activityAll: (ActivityPartner | ActivityReferral)[] = [
        ...partnerRedemptionsWithNames.map(
          (r): ActivityPartner => ({ ...r, type: "partner" }),
        ),
        ...referralLogsMapped.map(
          (r): ActivityReferral => ({ ...r, type: "referral" }),
        ),
      ].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      const activityTotal = activityAll.length;
      const activityItems = activityAll.slice(
        (activityPage - 1) * activityPerPage,
        activityPage * activityPerPage,
      );

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
        referralLogs: referralLogsMapped,
        bills: billsRows.map((b) => {
          const amountToShow = b.userPaidAmount ?? b.finalAmount ?? null;
          const cashbackEarnedFromTx = sumCashbackEarnedFromTransactions(
            "transactions" in b ? b.transactions : [],
          );
          const lineItems = "lineItems" in b ? b.lineItems : [];
          return {
            id: b.id,
            billNumber: b.billNumber,
            finalAmount: b.finalAmount,
            userPaidAmount: b.userPaidAmount,
            amount: amountToShow,
            cashbackAmount:
              cashbackEarnedFromTx > 0
                ? cashbackEarnedFromTx
                : (b.cashbackAmount ?? null),
            cashbackRedeemedAmount: b.cashbackRedeemedAmount ?? null,
            lineItems: lineItems.map(
              (li: {
                id: string;
                skuId: string;
                qty: number;
                unitPrice: number | null;
                sku: {
                  id: string;
                  sku: string;
                  name: string;
                  price: number | null;
                  unit: string | null;
                };
              }) => ({
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
              }),
            ),
            createdAt: b.createdAt.toISOString(),
          };
        }),
        billsTotal,
        activityItems,
        activityTotal,
      };

      return NextResponse.json({ customer });
    } catch (error: unknown) {
      console.error("Failed to fetch customer:", error);
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
