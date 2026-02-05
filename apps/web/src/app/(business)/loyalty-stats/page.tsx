import { LoyaltyStatsPageClient } from "./_components/LoyaltyStatsPageClient";
import { generateRouteMetadata } from "@/lib/utils/route-metadata";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = generateRouteMetadata("/loyalty-stats");

export default function LoyaltyStatsPage() {
  return (
    <Suspense fallback={<div className="h-96" />}>
      <LoyaltyStatsPageClient />
    </Suspense>
  );
}
