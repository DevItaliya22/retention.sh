"use client";

import { Suspense } from "react";
import {
  CustomerSnapshotSection,
  CustomersByDaySection,
  HighlightsSection,
  InsightsSection,
  RevenueSalesInteractiveBarSection,
  WeeklyTrendsSection,
} from "./sections";

export function DashboardPageClient() {
  return (
    <div className="space-y-6 pb-6">
      <Suspense>
        <HighlightsSection />
      </Suspense>
      <Suspense>
        <WeeklyTrendsSection />
      </Suspense>
      <Suspense>
        <CustomersByDaySection />
      </Suspense>
      <Suspense>
        <RevenueSalesInteractiveBarSection />
      </Suspense>
      <Suspense>
        <CustomerSnapshotSection />
      </Suspense>
      <Suspense>
        <InsightsSection />
      </Suspense>
    </div>
  );
}
