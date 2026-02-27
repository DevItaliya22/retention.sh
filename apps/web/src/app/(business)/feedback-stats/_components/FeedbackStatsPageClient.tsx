"use client";

import { FeedbackStatsTable } from "@/components/feedback-stats/FeedbackStatsTable";
import { DashboardPageShell } from "@/components/layouts";
import { Skeleton } from "@reelo/ui/components";
import { Suspense } from "react";

function FeedbackStatsContent() {
  return <FeedbackStatsTable />;
}

export function FeedbackStatsPageClient() {
  return (
    <DashboardPageShell
      title="Feedback stats"
      subtitle="Customer feedback responses by rating, comment and date"
    >
      <Suspense
        fallback={
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        }
      >
        <FeedbackStatsContent />
      </Suspense>
    </DashboardPageShell>
  );
}
