import { db } from "@reelo/db";
import { classifyCustomer } from "./classify";
import { seedDefaultSegments } from "./seed";
import type { SegmentConfig } from "./types";

export async function getSegmentCustomerIds(
  businessId: string,
  segmentSlug: string,
): Promise<string[]> {
  let segments = await db.segment.findMany({
    where: { businessId },
    orderBy: { sortOrder: "asc" },
  });

  if (segments.length === 0) {
    await seedDefaultSegments(businessId);
    segments = await db.segment.findMany({
      where: { businessId },
      orderBy: { sortOrder: "asc" },
    });
  }

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
    monetaryOperator: s.monetaryOperator,
    monetaryValue: s.monetaryValue,
    monetaryValue2: s.monetaryValue2,
    sortOrder: s.sortOrder,
    isSystem: s.isSystem,
  }));

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

  if (wallets.length === 0) return [];

  const customerIds = wallets.map((w) => w.customerId);
  const latestBills = await db.bill.groupBy({
    by: ["customerId"],
    where: { businessId, customerId: { in: customerIds } },
    _max: { createdAt: true },
  });
  const lastBillMap = new Map(
    latestBills.map((b) => [b.customerId, b._max.createdAt]),
  );

  const totalSpend = wallets.reduce((sum, w) => sum + w.lifetimeSpend, 0);
  const avgSpend = totalSpend / wallets.length;
  const now = new Date();

  const result: string[] = [];
  for (const wallet of wallets) {
    const lastBill = lastBillMap.get(wallet.customerId) ?? null;
    const slug = classifyCustomer(
      {
        customerId: wallet.customerId,
        visitCount: wallet.visitCount,
        lifetimeSpend: wallet.lifetimeSpend,
        lastVisitAt: wallet.lastVisitAt,
        createdAt: wallet.createdAt,
      },
      segmentConfigs,
      lastBill,
      now,
      avgSpend,
    );
    if (slug === segmentSlug) {
      result.push(wallet.customerId);
    }
  }
  return result;
}

export async function getSegmentCustomerIdsForSlugs(
  businessId: string,
  slugs: string[],
): Promise<string[]> {
  if (slugs.length === 0) return [];
  const results = await Promise.all(
    slugs.map((slug) => getSegmentCustomerIds(businessId, slug)),
  );
  const union = new Set<string>();
  for (const ids of results) {
    for (const id of ids) union.add(id);
  }
  return Array.from(union);
}
