"use client";

import { PeriodSelector } from "@/components/dashboard/shared/PeriodSelector";
import type { AnalyticsPeriod } from "@/lib/schemas/analytics";
import { useState } from "react";
import { CategoryRevenueChart } from "./CategoryRevenueChart";
import { SkuSalesTrendChart } from "./SkuSalesTrendChart";
import { SkuStatsCards } from "./SkuStatsCards";
import { SlowMovingSkuTable } from "./SlowMovingSkuTable";
import { TopSellingSkuTable } from "./TopSellingSkuTable";

export function SkuAnalyticsView() {
  const [period, setPeriod] = useState<AnalyticsPeriod>("30d");

  return (
    <div className="space-y-8">
      <section>
        <div className="text-foreground mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Overview</h2>
          <PeriodSelector value={period} onChange={setPeriod} />
        </div>
        <SkuStatsCards period={period} />
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <TopSellingSkuTable period={period} />
        <SlowMovingSkuTable period={period} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <CategoryRevenueChart period={period} />
        <SkuSalesTrendChart />
      </div>
    </div>
  );
}
