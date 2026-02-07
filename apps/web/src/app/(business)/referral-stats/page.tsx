import { generateRouteMetadata } from "@/lib/utils/route-metadata";
import type { Metadata } from "next";
import { Suspense } from "react";
import { ReferralStatsPageClient } from "./_components/ReferralStatsPageClient";

export const metadata: Metadata = generateRouteMetadata("/referral-stats");

export default function ReferralStatsPage() {
  return (
    <Suspense fallback={<div className="h-96" />}>
      <ReferralStatsPageClient />
    </Suspense>
  );
}
