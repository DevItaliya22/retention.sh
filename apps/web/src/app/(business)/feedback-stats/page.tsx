import { generateRouteMetadata } from "@/lib/utils/route-metadata";
import type { Metadata } from "next";
import { Suspense } from "react";
import { FeedbackStatsPageClient } from "./_components/FeedbackStatsPageClient";

export const metadata: Metadata = generateRouteMetadata("/feedback-stats");

export default function FeedbackStatsPage() {
  return (
    <Suspense fallback={<div className="h-96" />}>
      <FeedbackStatsPageClient />
    </Suspense>
  );
}
