"use client";

import { ReferralCostVsRevenueChart } from "./ReferralCostVsRevenueChart";
import { ReferralFunnelChart } from "./ReferralFunnelChart";
import { ReferralStatsCards } from "./ReferralStatsCards";

export function ReferralAnalyticsView() {
  return (
    <div className="space-y-8">
      <section>
        <div className="text-foreground mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Referral Analytics</h2>
        </div>
        <ReferralStatsCards period="12mo" />
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ReferralFunnelChart />
        <ReferralCostVsRevenueChart />
      </div>
    </div>
  );
}
