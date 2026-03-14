import { ReferralStatsTable } from "@/components/referral-stats/ReferralStatsTable";
import { generateRouteMetadata } from "@/lib/utils/route-metadata";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = generateRouteMetadata("/referral-stats");

export default function ReferralStatsActivityPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <div className="bg-muted h-32 w-full animate-pulse rounded-md" />
          <div className="bg-muted h-64 w-full animate-pulse rounded-md" />
        </div>
      }
    >
      <ReferralStatsTable />
    </Suspense>
  );
}
