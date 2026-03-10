import { db } from "@reelo/db";
import { classifyCustomer } from "./classify";
import { seedDefaultSegments } from "./seed";
import type { SegmentConfig } from "./types";

export interface SegmentSummary {
  name: string;
  slug: string;
  count: number;
  percentage: number;
  description: string | null;
  proTip: string | null;
}

export interface SegmentsOverviewResponse {
  totalCustomers: number;
  segments: SegmentSummary[];
}

export async function getSegmentsOverview(
  businessId: string,
): Promise<SegmentsOverviewResponse> {
  await seedDefaultSegments(businessId);

  const segments = await db.segment.findMany({
    where: { businessId },
    orderBy: { sortOrder: "asc" },
  });

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
    return {
      totalCustomers: 0,
      segments: segments.map((s) => ({
        name: s.name,
        slug: s.slug,
        count: 0,
        percentage: 0,
        description: s.description,
        proTip: s.proTip,
      })),
    };
  }

  const customerIds = wallets.map((w) => w.customerId);
  const [latestBills, billsSpend] = await Promise.all([
    db.bill.groupBy({
      by: ["customerId"],
      where: { businessId, customerId: { in: customerIds } },
      _max: { createdAt: true },
    }),
    db.bill.groupBy({
      by: ["customerId"],
      where: { businessId, customerId: { in: customerIds } },
      _sum: { finalAmount: true },
    }),
  ]);
  const lastBillMap = new Map(
    latestBills.map((b) => [b.customerId, b._max.createdAt]),
  );
  const billSpendMap = new Map(
    billsSpend.map((b) => [b.customerId, b._sum.finalAmount ?? 0]),
  );

  const effectiveLifetimeSpend = (w: (typeof wallets)[number]) =>
    w.lifetimeSpend > 0
      ? w.lifetimeSpend
      : (billSpendMap.get(w.customerId) ?? 0);

  const totalSpend = wallets.reduce(
    (sum, w) => sum + effectiveLifetimeSpend(w),
    0,
  );
  const avgSpend = totalSpend / totalCustomers;
  const now = new Date();

  const segmentConfigs: SegmentConfig[] = segments.map((s) => ({
    id: s.id,
    name: s.name,
    slug: s.slug,
    description: s.description,
    proTip: s.proTip,
    recencyOperator: s.recencyOperator,
    recencyValue: s.recencyValue,
    recencyValue2: s.recencyValue2,
    recencyUnit: s.recencyUnit,
    frequencyOperator: s.frequencyOperator,
    frequencyValue: s.frequencyValue,
    frequencyValue2: s.frequencyValue2,
    monetaryUnit: s.monetaryUnit ?? "RATIO",
    monetaryOperator: s.monetaryOperator,
    monetaryValue: s.monetaryValue,
    monetaryValue2: s.monetaryValue2,
    sortOrder: s.sortOrder,
    isSystem: s.isSystem,
  }));

  const slugCounts = new Map<string, number>();
  for (const seg of segments) {
    slugCounts.set(seg.slug, 0);
  }

  for (const wallet of wallets) {
    const lastBill = lastBillMap.get(wallet.customerId) ?? null;
    const slug = classifyCustomer(
      {
        customerId: wallet.customerId,
        visitCount: wallet.visitCount,
        lifetimeSpend: effectiveLifetimeSpend(wallet),
        lastVisitAt: wallet.lastVisitAt,
        createdAt: wallet.createdAt,
      },
      segmentConfigs,
      lastBill,
      now,
      avgSpend,
    );
    slugCounts.set(slug, (slugCounts.get(slug) ?? 0) + 1);
  }

  const segmentSummaries: SegmentSummary[] = segments.map((s) => {
    const count = slugCounts.get(s.slug) ?? 0;
    return {
      name: s.name,
      slug: s.slug,
      count,
      percentage:
        totalCustomers > 0
          ? Math.round((count / totalCustomers) * 10000) / 100
          : 0,
      description: s.description,
      proTip: s.proTip,
    };
  });

  return {
    totalCustomers,
    segments: segmentSummaries,
  };
}
