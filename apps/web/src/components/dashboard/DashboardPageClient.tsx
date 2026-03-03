"use client";

import { Suspense } from "react";
import {
  CustomerSnapshotSection,
  EngagementSection,
  HighlightsSection,
  InsightsSection,
  LoyaltyPerformanceSection,
  RevenueSection,
  RfmSection,
} from "./sections";

export function DashboardPageClient() {
  return (
    <div className="space-y-8 pb-8">
      <Suspense>
        <HighlightsSection />
      </Suspense>
      <Suspense>
        <RevenueSection />
      </Suspense>
      <Suspense>
        <CustomerSnapshotSection />
      </Suspense>
      <Suspense>
        <LoyaltyPerformanceSection />
      </Suspense>
      <Suspense>
        <RfmSection />
      </Suspense>
      <Suspense>
        <EngagementSection />
      </Suspense>
      <Suspense>
        <InsightsSection />
      </Suspense>
    </div>
  );
}
