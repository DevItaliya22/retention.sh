import { classifyCustomer } from "@/lib/segmentation/classify";
import {
  getSegmentCustomerIds,
  getSegmentCustomerIdsForSlugs,
} from "@/lib/segmentation/get-segment-ids";
import { seedDefaultSegments } from "@/lib/segmentation/seed";
import type { SegmentConfig } from "@/lib/segmentation/types";
import type { AudienceChecker, AudienceResolver } from "../types";

export const resolveSegmentAudience: AudienceResolver = async (
  businessId,
  param,
) => {
  const slugs = param.split(",").filter(Boolean);
  if (slugs.length === 0) return [];
  if (slugs.length === 1) return getSegmentCustomerIds(businessId, slugs[0]!);
  return getSegmentCustomerIdsForSlugs(businessId, slugs);
};

export const checkSegmentAudience: AudienceChecker = async (
  dbClient,
  businessId,
  customerId,
  param,
) => {
  const targetSlug = param.trim();
  if (!targetSlug) return false;

  let segments = await dbClient.segment.findMany({
    where: { businessId },
    orderBy: { sortOrder: "asc" },
  });

  if (segments.length === 0) {
    await seedDefaultSegments(businessId);
    segments = await dbClient.segment.findMany({
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
    monetaryUnit: s.monetaryUnit ?? "RATIO",
    monetaryOperator: s.monetaryOperator,
    monetaryValue: s.monetaryValue,
    monetaryValue2: s.monetaryValue2,
    sortOrder: s.sortOrder,
    isSystem: s.isSystem,
  }));

  const wallet = await dbClient.wallet.findUnique({
    where: { businessId_customerId: { businessId, customerId } },
    select: {
      customerId: true,
      visitCount: true,
      lifetimeSpend: true,
      lastVisitAt: true,
      createdAt: true,
    },
  });

  if (!wallet) return false;

  const [latestBill, avgResult] = await Promise.all([
    dbClient.bill.aggregate({
      where: { businessId, customerId },
      _max: { createdAt: true },
    }),
    dbClient.wallet.aggregate({
      where: { businessId },
      _avg: { lifetimeSpend: true },
    }),
  ]);

  const lastBill = latestBill._max.createdAt;
  const avgSpend = avgResult._avg.lifetimeSpend ?? 0;

  let effectiveLifetimeSpend = wallet.lifetimeSpend;
  if (effectiveLifetimeSpend <= 0) {
    const billSpend = await dbClient.bill.aggregate({
      where: { businessId, customerId },
      _sum: { finalAmount: true },
    });
    effectiveLifetimeSpend = billSpend._sum.finalAmount ?? 0;
  }

  const customerSlug = classifyCustomer(
    {
      customerId: wallet.customerId,
      visitCount: wallet.visitCount,
      lifetimeSpend: effectiveLifetimeSpend,
      lastVisitAt: wallet.lastVisitAt,
      createdAt: wallet.createdAt,
    },
    segmentConfigs,
    lastBill,
    new Date(),
    avgSpend,
  );

  return customerSlug === targetSlug;
};
