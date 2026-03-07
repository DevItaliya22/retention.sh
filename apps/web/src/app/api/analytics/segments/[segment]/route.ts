import {
  getLockedReferralBalance,
  getLockedShopifyBalance,
} from "@/lib/actions/loyalty";
import { withAdminAuth } from "@/lib/auth/middleware";
import { runTransaction } from "@/lib/db/transaction";
import {
  segmentCustomersQuerySchema,
  segmentParamSchema,
} from "@/lib/schemas/segment";
import { getSegmentCustomerIds } from "@/lib/segmentation";
import {
  sanitizeErrorMessage,
  validateSchema,
} from "@/lib/utils/error-handler";
import { db, TransactionValueKind } from "@reelo/db";
import { NextRequest, NextResponse } from "next/server";

export const GET = withAdminAuth<{ segment: string }>(
  async (request: NextRequest, context, params) => {
    try {
      const segmentSlug =
        typeof params.segment === "string"
          ? params.segment
          : (params.segment?.[0] ?? "");
      const segmentValidation = validateSchema(segmentParamSchema, {
        segment: segmentSlug,
      });
      if (!segmentValidation.success) {
        return NextResponse.json(
          {
            error: segmentValidation.error,
            items: [],
            total: 0,
            page: 1,
            perPage: 10,
          },
          { status: 400 },
        );
      }
      const { segment: validatedSlug } = segmentValidation.data;
      const { searchParams } = new URL(request.url);
      const queryParams = Object.fromEntries(searchParams.entries());

      const validation = validateSchema(
        segmentCustomersQuerySchema,
        queryParams,
      );
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

      const { page = 1, perPage = 10, sort, name, email } = validation.data;

      const businessId = context.business.id;
      const customerIds = await getSegmentCustomerIds(
        businessId,
        validatedSlug,
      );

      if (customerIds.length === 0) {
        return NextResponse.json({
          items: [],
          total: 0,
          page,
          perPage,
        });
      }

      const skip = (page - 1) * perPage;
      const take = perPage;

      const where: Record<string, unknown> = {
        businessId,
        customerId: { in: customerIds },
      };

      if (name || email) {
        const customerFilters: Record<string, unknown> = {};
        const userFilters: Record<string, unknown> = {};

        if (name) {
          userFilters.name = { contains: name, mode: "insensitive" };
        }
        if (email) {
          customerFilters.email = { contains: email, mode: "insensitive" };
        }
        if (Object.keys(userFilters).length > 0) {
          customerFilters.user = userFilters;
        }
        if (Object.keys(customerFilters).length > 0) {
          where.customer = customerFilters;
        }
      }

      const orderBy: Record<string, unknown> = {};
      if (sort) {
        const [field, direction] = sort.split(":");
        const sortDirection = direction === "desc" ? "desc" : "asc";
        if (field === "name") {
          orderBy.customer = { user: { name: sortDirection } };
        } else if (field === "email") {
          orderBy.customer = { email: sortDirection };
        } else if (field === "createdAt") {
          orderBy.createdAt = sortDirection;
        } else {
          orderBy.createdAt = "desc";
        }
      } else {
        orderBy.createdAt = "desc";
      }

      const [businessCustomers, total] = await Promise.all([
        db.businessCustomer.findMany({
          where,
          skip,
          take,
          orderBy,
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
            wallet: true,
          },
        }),
        db.businessCustomer.count({ where }),
      ]);

      const lockedByCustomerId = await runTransaction(async (tx) => {
        const entries: Array<{
          customerId: string;
          lockedShopify: number;
          lockedReferral: number;
        }> = [];
        for (const bc of businessCustomers) {
          const [lockedShopify, lockedReferral] = await Promise.all([
            getLockedShopifyBalance(tx, {
              businessId,
              customerId: bc.customerId,
              valueKind: TransactionValueKind.CASHBACK,
            }),
            getLockedReferralBalance(tx, {
              businessId,
              customerId: bc.customerId,
            }),
          ]);
          entries.push({
            customerId: bc.customerId,
            lockedShopify,
            lockedReferral,
          });
        }
        return new Map(entries.map((e) => [e.customerId, e]));
      });

      const items = businessCustomers.map((bc) => {
        const locked = lockedByCustomerId.get(bc.customerId);
        const rawCashback = bc.wallet?.cashbackBalance ?? 0;
        const cashbackBalance =
          locked != null
            ? Math.max(
                0,
                rawCashback - locked.lockedShopify - locked.lockedReferral,
              )
            : rawCashback;
        return {
          id: bc.slugId,
          slugId: bc.slugId,
          customerId: bc.customer.id,
          name: bc.customer.user.name,
          email: bc.customer.email,
          phone: bc.customer.user.phoneNumber,
          pointsBalance:
            (bc.wallet?.amountSpentBalance ?? 0) +
            (bc.wallet?.visitPointsBalance ?? 0),
          cashbackBalance,
          createdAt: bc.createdAt.toISOString(),
          updatedAt: bc.updatedAt.toISOString(),
        };
      });

      return NextResponse.json({
        items,
        total,
        page,
        perPage,
      });
    } catch (error: unknown) {
      console.error("Failed to fetch segment customers:", error);
      return NextResponse.json(
        {
          error:
            sanitizeErrorMessage(error) || "Failed to fetch segment customers.",
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
