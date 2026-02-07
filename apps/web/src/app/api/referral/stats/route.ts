import { withAdminAuth } from "@/lib/auth/middleware";
import {
  type IsServiceEnabled,
  isServiceEnabled,
} from "@/lib/utils/service-enabled";
import { referralStatsQuerySchema } from "@/lib/schemas/referral";
import {
  sanitizeErrorMessage,
  validateSchema,
} from "@/lib/utils/error-handler";
import { db } from "@reelo/db";
import { NextRequest, NextResponse } from "next/server";

export interface ReferralStatRow {
  id: string;
  referrerName: string;
  referrerSlugId: string;
  referredCount: number;
}

export const GET = withAdminAuth(async (request: NextRequest, context) => {
  try {
    const referralEnabled = isServiceEnabled(
      context.business.isServiceEnabled,
      "referral",
    );

    if (!referralEnabled) {
      return NextResponse.json(
        {
          isServiceEnabled: context.business.isServiceEnabled,
          error: "Referral is not enabled. Enable it in Settings → General.",
          items: [],
          total: 0,
          page: 1,
          perPage: 10,
        },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    const validation = validateSchema(referralStatsQuerySchema, queryParams);
    if (!validation.success) {
      return NextResponse.json(
        {
          isServiceEnabled: context.business.isServiceEnabled,
          error: validation.error,
          items: [],
          total: 0,
          page: 1,
          perPage: 10,
        },
        { status: 400 },
      );
    }

    const { page = 1, perPage = 10, sort } = validation.data;
    const businessId = context.business.id;
    const skip = (page - 1) * perPage;
    const take = perPage;

    const grouped = await db.referralLog.groupBy({
      by: ["referrerBusinessId", "referrerCustomerId"],
      _count: { id: true },
      where: { referrerBusinessId: businessId },
    });

    const sorted = [...grouped].sort(
      (a, b) => (b._count.id ?? 0) - (a._count.id ?? 0),
    );
    const total = sorted.length;
    const pageSlice = sorted.slice(skip, skip + take);

    if (pageSlice.length === 0) {
      return NextResponse.json({
        isServiceEnabled: context.business.isServiceEnabled,
        items: [],
        total,
        page,
        perPage,
      });
    }

    const referrerPairs = pageSlice.map((g) => ({
      businessId: g.referrerBusinessId,
      customerId: g.referrerCustomerId,
    }));

    const referrers = await db.businessCustomer.findMany({
      where: {
        OR: referrerPairs,
      },
      include: {
        customer: {
          include: {
            user: { select: { name: true } },
          },
        },
      },
    });

    const referrerByKey = new Map(
      referrers.map((bc) => [`${bc.businessId}:${bc.customerId}`, bc]),
    );

    const items: ReferralStatRow[] = pageSlice.map((g) => {
      const key = `${g.referrerBusinessId}:${g.referrerCustomerId}`;
      const bc = referrerByKey.get(key);
      return {
        id: bc?.slugId ?? key,
        referrerName: bc?.customer?.user?.name ?? "—",
        referrerSlugId: bc?.slugId ?? "",
        referredCount: g._count.id ?? 0,
      };
    });

    return NextResponse.json({
      isServiceEnabled: context.business.isServiceEnabled,
      items,
      total,
      page,
      perPage,
    });
  } catch (error: unknown) {
    console.error("Failed to fetch referral stats:", error);
    return NextResponse.json(
      {
        isServiceEnabled: null,
        items: [],
        total: 0,
        page: 1,
        perPage: 10,
        error:
          sanitizeErrorMessage(error) ||
          "Failed to fetch referral stats. Please try again.",
      },
      { status: 500 },
    );
  }
});
