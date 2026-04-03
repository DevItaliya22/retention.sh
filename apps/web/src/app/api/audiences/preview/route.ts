import { resolveAudiences } from "@/lib/audiences";
import { withAdminAuth } from "@/lib/auth/middleware";
import { sanitizeErrorMessage } from "@/lib/utils/error-handler";
import { db, type Prisma } from "@reelo/db";
import { NextRequest, NextResponse } from "next/server";

export const GET = withAdminAuth(async (request: NextRequest, context) => {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");
    const page = Math.max(1, Number(searchParams.get("page") || "1") || 1);
    const perPage = Math.min(
      50,
      Math.max(1, Number(searchParams.get("perPage") || "10") || 10),
    );

    const keys =
      key
        ?.split(",")
        .map((k) => k.trim())
        .filter(Boolean) ?? [];
    const resolvedKeys = keys.length > 0 ? keys : ["all:customers"];

    const membershipSelect = {
      customer: {
        select: {
          id: true,
          email: true,
          user: {
            select: {
              name: true,
              phoneNumber: true,
            },
          },
        },
      },
    } as const;

    const fetchAudienceCustomers = async (
      where: Prisma.BusinessCustomerWhereInput,
    ) => {
      const [count, memberships] = await Promise.all([
        db.businessCustomer.count({ where }),
        db.businessCustomer.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * perPage,
          take: perPage,
          select: membershipSelect,
        }),
      ]);

      return {
        count,
        page,
        perPage,
        customers: memberships.map((membership) => ({
          id: membership.customer.id,
          name: membership.customer.user?.name ?? null,
          phone: membership.customer.user?.phoneNumber ?? null,
          email: membership.customer.email ?? null,
        })),
      };
    };

    const customerIds = await resolveAudiences(
      context.business.id,
      resolvedKeys,
    );
    if (customerIds.length === 0) {
      return NextResponse.json({
        count: 0,
        page,
        perPage,
        customers: [],
      });
    }

    return NextResponse.json(
      await fetchAudienceCustomers({
        businessId: context.business.id,
        customerId: { in: customerIds },
      }),
    );
  } catch (error) {
    console.error("Audience preview error:", error);
    return NextResponse.json(
      { error: sanitizeErrorMessage(error), count: 0, customers: [] },
      { status: 500 },
    );
  }
});
