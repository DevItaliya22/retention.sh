import { FeedbackStatsTable } from "@/components/feedback-stats/FeedbackStatsTable";
import { generateRouteMetadata } from "@/lib/utils/route-metadata";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = generateRouteMetadata(
  "/feedback-stats/activity",
);

export default function FeedbackStatsActivityPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <div className="bg-muted h-32 w-full animate-pulse rounded-md" />
          <div className="bg-muted h-64 w-full animate-pulse rounded-md" />
        </div>
      }
    >
      <FeedbackStatsTable />
    </Suspense>
  );
}
