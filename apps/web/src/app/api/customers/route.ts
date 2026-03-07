import {
  getLockedReferralBalance,
  getLockedShopifyBalance,
} from "@/lib/actions/loyalty";
import { withAdminAuth } from "@/lib/auth/middleware";
import { runTransaction } from "@/lib/db/transaction";
import { customersQuerySchema } from "@/lib/schemas/customer";
import { getSegmentCustomerIdsForSlugs } from "@/lib/segmentation";
import {
  sanitizeErrorMessage,
  validateSchema,
} from "@/lib/utils/error-handler";
import { db, TransactionValueKind } from "@reelo/db";
import { NextRequest, NextResponse } from "next/server";

export const GET = withAdminAuth(async (request: NextRequest, context) => {
  try {
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    const validation = validateSchema(customersQuerySchema, queryParams);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error, items: [], total: 0, perPage: 10 },
        { status: 400 },
      );
    }

    const {
      page = 1,
      perPage = 10,
      sort,
      name,
      email,
      phone,
      dateFrom,
      dateTo,
      segment,
    } = validation.data;

    const skip = (page - 1) * perPage;
    const take = perPage;

    const where: any = {
      businessId: context.business.id,
    };

    if (segment) {
      const slugs = segment
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (slugs.length > 0) {
        const customerIds = await getSegmentCustomerIdsForSlugs(
          context.business.id,
          slugs,
        );
        if (customerIds.length === 0) {
          return NextResponse.json({
            items: [],
            total: 0,
            page,
            perPage,
          });
        }
        where.customerId = { in: customerIds };
      }
    }

    if (name || email || phone) {
      const customerFilters: any = {};
      const userFilters: any = {};

      if (name) {
        userFilters.name = {
          contains: name,
          mode: "insensitive",
        };
      }

      if (phone) {
        userFilters.phoneNumber = {
          contains: phone,
          mode: "insensitive",
        };
      }

      if (Object.keys(userFilters).length > 0) {
        customerFilters.user = userFilters;
      }

      if (email) {
        customerFilters.email = {
          contains: email,
          mode: "insensitive",
        };
      }

      if (Object.keys(customerFilters).length > 0) {
        where.customer = customerFilters;
      }
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

    const orderBy: any = {};
    if (sort) {
      const [field, direction] = sort.split(":");
      const sortDirection = direction === "desc" ? "desc" : "asc";

      if (field === "name") {
        orderBy.customer = {
          user: {
            name: sortDirection,
          },
        };
      } else if (field === "email") {
        orderBy.customer = {
          email: sortDirection,
        };
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
            businessId: context.business.id,
            customerId: bc.customerId,
            valueKind: TransactionValueKind.CASHBACK,
          }),
          getLockedReferralBalance(tx, {
            businessId: context.business.id,
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

    const formattedCustomers = businessCustomers.map((bc) => {
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
        visitCount: bc.wallet?.visitCount ?? 0,
        totalSpent: bc.wallet?.lifetimeSpend ?? 0,
        createdAt: bc.createdAt.toISOString(),
        updatedAt: bc.updatedAt.toISOString(),
      };
    });

    return NextResponse.json({
      items: formattedCustomers,
      total,
      page,
      perPage,
    });
  } catch (error: any) {
    console.error("Failed to fetch customers:", error);
    return NextResponse.json(
      {
        error:
          sanitizeErrorMessage(error) ||
          "Failed to fetch customers. Please try again.",
        items: [],
        total: 0,
        perPage: 10,
      },
      { status: 500 },
    );
  }
});
