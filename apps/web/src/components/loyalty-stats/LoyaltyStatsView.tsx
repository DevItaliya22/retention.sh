"use client";

import { PeriodSelector } from "@/components/dashboard/shared/PeriodSelector";
import type { AnalyticsPeriod } from "@/lib/schemas/analytics";
import { useState } from "react";
import { LoyaltyIssuedVsRedeemedChart } from "./LoyaltyIssuedVsRedeemedChart";
import { LoyaltyStatsCards } from "./LoyaltyStatsCards";

export function LoyaltyStatsView() {
  const [period, setPeriod] = useState<AnalyticsPeriod>("30d");

  return (
    <div className="space-y-8">
      <section>
        <div className="text-foreground mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Overview</h2>
          <PeriodSelector value={period} onChange={setPeriod} />
        </div>
        <LoyaltyStatsCards period={period} />
      </section>
      <section>
        <LoyaltyIssuedVsRedeemedChart period={period} />
      </section>
    </div>
  );
}
