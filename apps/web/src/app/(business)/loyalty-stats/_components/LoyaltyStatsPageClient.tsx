"use client";

import { DashboardPageShell } from "@/components/layouts";
import { LoyaltyStatsTable } from "@/components/loyalty-stats/LoyaltyStatsTable";
import { Skeleton } from "@reelo/ui/components";
import { Suspense } from "react";

function LoyaltyStatsContent() {
  return <LoyaltyStatsTable />;
}

export function LoyaltyStatsPageClient() {
  return (
    <DashboardPageShell
      title="Loyalty stats"
      subtitle="Earned and redeemed points by source, customer and bill"
    >
      <Suspense
        fallback={
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        }
      >
        <LoyaltyStatsContent />
      </Suspense>
    </DashboardPageShell>
  );
}
