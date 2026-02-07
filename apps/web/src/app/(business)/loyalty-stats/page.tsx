import { generateRouteMetadata } from "@/lib/utils/route-metadata";
import type { Metadata } from "next";
import { Suspense } from "react";
import { LoyaltyStatsPageClient } from "./_components/LoyaltyStatsPageClient";

export const metadata: Metadata = generateRouteMetadata("/loyalty-stats");

export default function LoyaltyStatsPage() {
  return (
    <Suspense fallback={<div className="h-96" />}>
      <LoyaltyStatsPageClient />
    </Suspense>
  );
}
