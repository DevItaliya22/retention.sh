import { withAdminAuth } from "@/lib/auth/middleware";
import type { InsightsResponse } from "@/lib/types/analytics";
import { sanitizeErrorMessage } from "@/lib/utils/error-handler";
import { db } from "@reelo/db";
import { NextRequest, NextResponse } from "next/server";

export const GET = withAdminAuth(async (_request: NextRequest, context) => {
  try {
    const businessId = context.business.id;

    const [billAgg, customerSpends] = await Promise.all([
      db.bill.aggregate({
        where: { businessId },
        _sum: { finalAmount: true },
        _count: true,
      }),
      db.bill.groupBy({
        by: ["customerId"],
        where: { businessId },
        _sum: { finalAmount: true },
        _count: { id: true },
        orderBy: { _sum: { finalAmount: "desc" } },
      }),
    ]);

    const totalRevenue = billAgg._sum.finalAmount ?? 0;
    const totalOrders = billAgg._count;
    const totalCustomersWithPurchase = customerSpends.length;

    if (totalCustomersWithPurchase === 0 || totalOrders === 0) {
      return NextResponse.json({
        revenuePareto: { customerPercentage: 0, revenuePercentage: 0 },
        averageOrderValue: 0,
        avgVisitsPerYear: 0,
      } satisfies InsightsResponse);
    }

    const averageOrderValue =
      Math.round((totalRevenue / totalOrders) * 100) / 100;

    const totalVisitsAllCustomers = customerSpends.reduce(
      (sum, c) => sum + c._count.id,
      0,
    );
    const avgVisitsPerYear =
      Math.round((totalVisitsAllCustomers / totalCustomersWithPurchase) * 100) /
      100;

    let cumulativeRevenue = 0;
    let paretoCustomerCount = 0;
    const targetRevenue = totalRevenue * 0.8;

    for (const c of customerSpends) {
      cumulativeRevenue += c._sum.finalAmount ?? 0;
      paretoCustomerCount++;
      if (cumulativeRevenue >= targetRevenue) break;
    }

    const customerPercentage = Math.round(
      (paretoCustomerCount / totalCustomersWithPurchase) * 100,
    );

    const response: InsightsResponse = {
      revenuePareto: {
        customerPercentage,
        revenuePercentage: 80,
      },
      averageOrderValue,
      avgVisitsPerYear,
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error("Failed to fetch insights:", error);
    return NextResponse.json(
      {
        error: sanitizeErrorMessage(error) || "Failed to fetch insights.",
        revenuePareto: { customerPercentage: 0, revenuePercentage: 0 },
        averageOrderValue: 0,
        avgVisitsPerYear: 0,
      } satisfies InsightsResponse,
      { status: 500 },
    );
  }
});
