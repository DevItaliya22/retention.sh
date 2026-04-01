import { withAdminAuth } from "@/lib/auth/middleware";
import {
  customerDetailQuerySchema,
  customerSlugIdParamSchema,
} from "@/lib/schemas/customer";
import {
  sanitizeErrorMessage,
  validateSchema,
} from "@/lib/utils/error-handler";
import { db } from "@reelo/db";
import { NextRequest, NextResponse } from "next/server";

export const GET = withAdminAuth<{ slugId: string }>(
  async (request: NextRequest, context, params) => {
    try {
      const validation = validateSchema(customerSlugIdParamSchema, params);
      if (!validation.success) {
        return NextResponse.json(
          {
            error: validation.error,
            items: [],
            total: 0,
            page: 1,
            perPage: 10,
          },
          { status: 400 },
        );
      }

      const queryValidation = validateSchema(
        customerDetailQuerySchema,
        Object.fromEntries(request.nextUrl.searchParams.entries()),
      );
      const query = queryValidation.success ? queryValidation.data : undefined;
      const page = query?.activityPage ?? 1;
      const perPage = query?.activityPerPage ?? 10;

      const { slugId } = validation.data;

      const businessCustomer = await db.businessCustomer.findFirst({
        where: { slugId, businessId: context.business.id },
        select: { customerId: true },
      });
      if (!businessCustomer) {
        return NextResponse.json(
          { error: "Customer not found", items: [], total: 0, page, perPage },
          { status: 404 },
        );
      }

      // Fetch enough items to compose the requested page after merging.
      // This keeps the endpoint fast while still supporting stable pagination UI.
      const takePerSource = Math.min(250, Math.max(30, page * perPage * 3));

      const [partnerTxs, referralLogs, walletTxs] = await Promise.all([
        db.transaction.findMany({
          where: {
            businessId: context.business.id,
            customerId: businessCustomer.customerId,
            type: "REDEEMED",
            source: "BILL",
          },
          orderBy: { createdAt: "desc" },
          take: takePerSource,
        }),
        db.referralLog.findMany({
          where: {
            referrerBusinessId: context.business.id,
            referrerCustomerId: businessCustomer.customerId,
          },
          orderBy: { createdAt: "desc" },
          take: takePerSource,
          select: {
            id: true,
            newCustomerName: true,
            newCustomerPhone: true,
            becameCustomer: true,
            createdAt: true,
          },
        }),
        db.transaction.findMany({
          where: {
            businessId: context.business.id,
            customerId: businessCustomer.customerId,
          },
          include: { campaign: { select: { title: true } } },
          orderBy: { createdAt: "desc" },
          take: takePerSource,
        }),
      ]);

      const hasPartnerRedemptionMetadata = (metadata: unknown) =>
        metadata != null &&
        typeof metadata === "object" &&
        "redeemedAtBusinessId" in metadata &&
        typeof (metadata as { redeemedAtBusinessId?: string })
          .redeemedAtBusinessId === "string";

      const partnerRedemptionsRaw = partnerTxs
        .filter((t) => hasPartnerRedemptionMetadata(t.metadata))
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

      const partnerItems = partnerRedemptionsRaw.map((r) => ({
        ...r,
        redeemedAtBusinessName:
          businessNameMap.get(r.redeemedAtBusinessId) ?? null,
        type: "partner" as const,
      }));

      const referralItems = referralLogs.map((log) => ({
        id: log.id,
        newCustomerName: log.newCustomerName,
        newCustomerPhone: log.newCustomerPhone,
        becameCustomer: log.becameCustomer,
        createdAt: log.createdAt.toISOString(),
        type: "referral" as const,
      }));

      const walletItems = walletTxs
        .filter((tx) => !hasPartnerRedemptionMetadata(tx.metadata))
        .map((tx) => {
          const meta = tx.metadata as { freeItemName?: string } | null;
          return {
            id: tx.id,
            valueKind: tx.valueKind,
            txType: tx.type,
            source: tx.source,
            amount: tx.amount,
            campaignTitle: tx.campaign?.title ?? null,
            freeItemName: meta?.freeItemName ?? null,
            createdAt: tx.createdAt.toISOString(),
            type: "walletTx" as const,
          };
        });

      const activityAll = [
        ...partnerItems,
        ...referralItems,
        ...walletItems,
      ].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

      const total = activityAll.length;
      const items = activityAll.slice((page - 1) * perPage, page * perPage);

      return NextResponse.json({ items, total, page, perPage });
    } catch (error: unknown) {
      console.error("Failed to fetch customer activity:", error);
      return NextResponse.json(
        {
          error:
            sanitizeErrorMessage(error) ||
            "Failed to fetch customer activity. Please try again.",
          items: [],
          total: 0,
          page: 1,
          perPage: 10,
        },
        { status: 500 },
      );
    }
  },
);
