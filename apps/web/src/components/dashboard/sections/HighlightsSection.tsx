"use client";

import { useHighlightsQuery } from "@/hooks/analytics/useAnalyticsQuery";
import { useCurrentBusiness } from "@/hooks/business/useCurrentBusiness";
import type { AnalyticsPeriod } from "@/lib/schemas/analytics";
import type { HighlightStat } from "@/lib/types/analytics";
import { useState } from "react";
import { PeriodSelector, SectionHeader, StatCard } from "../shared";

export function HighlightsSection() {
  const [period, setPeriod] = useState<AnalyticsPeriod>("30d");
  const { data, isLoading } = useHighlightsQuery(period);
  const { data: businessData } = useCurrentBusiness();
  const currencySymbol = businessData?.business?.defaultCurrencySymbol ?? "$";

  const stats: (HighlightStat | undefined)[] = isLoading
    ? Array(5).fill(undefined)
    : [
        data?.totalSales,
        data?.totalOrders,
        data?.newCustomers,
        data?.repeatCustomers,
        data?.rewardsRedeemed,
      ];

  return (
    <section className="space-y-3">
      <SectionHeader
        title="Highlights"
        actions={<PeriodSelector value={period} onChange={setPeriod} />}
      />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {stats.map((stat, i) => (
          <StatCard
            key={stat?.label ?? i}
            stat={stat}
            isLoading={isLoading}
            currencySymbol={currencySymbol}
          />
        ))}
      </div>
    </section>
  );
}
