import { LoyaltyStatsView } from "@/components/loyalty-stats/LoyaltyStatsView";
import { generateRouteMetadata } from "@/lib/utils/route-metadata";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = generateRouteMetadata("/loyalty-stats");

export default function LoyaltyStatsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="bg-muted h-32 w-full animate-pulse rounded-lg" />
          <div className="bg-muted h-64 w-full animate-pulse rounded-lg" />
        </div>
      }
    >
      <LoyaltyStatsView />
    </Suspense>
  );
}
