import { ReferralAnalyticsView } from "@/components/referral-stats/ReferralAnalyticsView";
import { generateRouteMetadata } from "@/lib/utils/route-metadata";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = generateRouteMetadata("/referral-stats");

export default function ReferralStatsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="bg-muted h-32 w-full animate-pulse rounded-lg" />
          <div className="bg-muted h-64 w-full animate-pulse rounded-lg" />
        </div>
      }
    >
      <ReferralAnalyticsView />
    </Suspense>
  );
}
