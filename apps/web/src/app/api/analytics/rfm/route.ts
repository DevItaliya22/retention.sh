import { withAdminAuth } from "@/lib/auth/middleware";
import type { RfmResponse, RfmSegment } from "@/lib/types/analytics";
import { sanitizeErrorMessage } from "@/lib/utils/error-handler";
import { db } from "@reelo/db";
import { NextRequest, NextResponse } from "next/server";

interface WalletRow {
  customerId: string;
  visitCount: number;
  lifetimeSpend: number;
  lastVisitAt: Date | null;
  createdAt: Date;
}

type SegmentName =
  | "New"
  | "Promising"
  | "VIP"
  | "Loyal"
  | "Needs Attention"
  | "At Risk"
  | "Lost";

const SEGMENT_COLORS: Record<SegmentName, string> = {
  New: "#d4edda",
  Promising: "#b2dfdb",
  VIP: "#bbdefb",
  Loyal: "#c8e6c9",
  "Needs Attention": "#fff9c4",
  "At Risk": "#f8bbd0",
  Lost: "#ffcdd2",
};

function classifyCustomer(
  wallet: WalletRow,
  lastBillDate: Date | null,
  customerCreatedAt: Date | null,
  now: Date,
  avgSpend: number,
): SegmentName {
  const lastActivity = wallet.lastVisitAt ?? lastBillDate ?? wallet.createdAt;
  const daysSinceVisit = Math.floor(
    (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24),
  );

  const joinedAt = customerCreatedAt ?? wallet.createdAt;
  const daysSinceJoin = Math.floor(
    (now.getTime() - joinedAt.getTime()) / (1000 * 60 * 60 * 24),
  );

  const isNewJoiner = daysSinceJoin <= 30;
  const isHighMonetary = wallet.lifetimeSpend > avgSpend * 1.5;

  // Lost = didn't return for 1+ year
  if (daysSinceVisit >= 365) return "Lost";

  // New = joined within last 30 days, 1-2 visits
  if (isNewJoiner && wallet.visitCount <= 2) return "New";

  // At Risk = 180-365 days since last visit, had some engagement
  if (daysSinceVisit >= 180 && wallet.visitCount >= 2) return "At Risk";

  // Needs Attention = 90-180 days since last visit
  if (daysSinceVisit >= 90 && wallet.visitCount >= 2) return "Needs Attention";

  // VIP = recent, high frequency, high spend
  if (daysSinceVisit <= 60 && wallet.visitCount >= 10 && isHighMonetary)
    return "VIP";

  // Loyal = recent-ish, 4+ visits
  if (daysSinceVisit <= 90 && wallet.visitCount >= 4) return "Loyal";

  // Promising = recent, 2-3 visits (growing)
  if (daysSinceVisit <= 60 && wallet.visitCount >= 2) return "Promising";

  // New = recent single visit but not a new joiner (walked in once)
  if (wallet.visitCount <= 1 && daysSinceVisit <= 90) return "New";

  // Needs Attention for single-visit older than 90 days but less than 365
  if (wallet.visitCount <= 1 && daysSinceVisit < 365) return "Needs Attention";

  return "New";
}

export const GET = withAdminAuth(async (_request: NextRequest, context) => {
  try {
    const businessId = context.business.id;

    const wallets = await db.wallet.findMany({
      where: { businessId },
      select: {
        customerId: true,
        visitCount: true,
        lifetimeSpend: true,
        lastVisitAt: true,
        createdAt: true,
      },
    });

    const totalCustomers = wallets.length;

    if (totalCustomers === 0) {
      return NextResponse.json({
        totalCustomers: 0,
        segments: [],
      } satisfies RfmResponse);
    }

    const customerIds = wallets.map((w) => w.customerId);

    const [latestBills, businessCustomers] = await Promise.all([
      db.bill.groupBy({
        by: ["customerId"],
        where: { businessId, customerId: { in: customerIds } },
        _max: { createdAt: true },
      }),
      db.businessCustomer.findMany({
        where: { businessId, customerId: { in: customerIds } },
        select: { customerId: true, createdAt: true },
      }),
    ]);

    const lastBillMap = new Map(
      latestBills.map((b) => [b.customerId, b._max.createdAt]),
    );
    const customerCreatedMap = new Map(
      businessCustomers.map((bc) => [bc.customerId, bc.createdAt]),
    );

    const totalSpend = wallets.reduce((sum, w) => sum + w.lifetimeSpend, 0);
    const avgSpend = totalSpend / totalCustomers;
    const now = new Date();

    const segmentCounts = new Map<SegmentName, number>();
    const allSegments: SegmentName[] = [
      "New",
      "Promising",
      "VIP",
      "Loyal",
      "Needs Attention",
      "At Risk",
      "Lost",
    ];
    for (const s of allSegments) segmentCounts.set(s, 0);

    for (const wallet of wallets) {
      const lastBill = lastBillMap.get(wallet.customerId) ?? null;
      const customerCreated = customerCreatedMap.get(wallet.customerId) ?? null;
      const segment = classifyCustomer(
        wallet,
        lastBill,
        customerCreated,
        now,
        avgSpend,
      );
      segmentCounts.set(segment, (segmentCounts.get(segment) ?? 0) + 1);
    }

    const segments: RfmSegment[] = allSegments.map((name) => {
      const count = segmentCounts.get(name) ?? 0;
      return {
        name,
        count,
        percentage:
          totalCustomers > 0
            ? Math.round((count / totalCustomers) * 10000) / 100
            : 0,
        color: SEGMENT_COLORS[name],
      };
    });

    const response: RfmResponse = { totalCustomers, segments };
    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error("Failed to fetch RFM data:", error);
    return NextResponse.json(
      {
        error: sanitizeErrorMessage(error) || "Failed to fetch RFM data.",
        totalCustomers: 0,
        segments: [],
      } satisfies RfmResponse,
      { status: 500 },
    );
  }
});
