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

  const stats: {
    label: string;
    format: HighlightStat["format"];
    stat?: HighlightStat;
  }[] = [
    { label: "Total Sales", format: "currency", stat: data?.totalSales },
    { label: "Total Orders", format: "number", stat: data?.totalOrders },
    { label: "New Customers", format: "number", stat: data?.newCustomers },
    {
      label: "Repeat Customers",
      format: "number",
      stat: data?.repeatCustomers,
    },
    {
      label: "Rewards Redeemed",
      format: "number",
      stat: data?.rewardsRedeemed,
    },
  ];

  return (
    <section className="space-y-3">
      <SectionHeader
        title="Highlights"
        actions={<PeriodSelector value={period} onChange={setPeriod} />}
      />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {stats.map((item, i) => (
          <StatCard
            key={item.label ?? i}
            label={item.label}
            format={item.format}
            stat={isLoading ? undefined : item.stat}
            isLoading={isLoading}
            currencySymbol={currencySymbol}
          />
        ))}
      </div>
    </section>
  );
}
