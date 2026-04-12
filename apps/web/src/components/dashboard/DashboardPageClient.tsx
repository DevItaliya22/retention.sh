"use client";

import { SetupChecklistSummary } from "@/components/onboarding";
import { useCurrentBusiness } from "@/hooks/business/useCurrentBusiness";
import { useOnboardingTourStore } from "@/stores/onboarding-tour-store";
import { Suspense } from "react";
import {
  CustomerSnapshotSection,
  CustomersByDaySection,
  HighlightsSection,
  InsightsSection,
  RevenueSalesInteractiveBarSection,
  WeeklyTrendsSection,
} from "./sections";

function DashboardSetupChecklistCard() {
  const tourActive = useOnboardingTourStore((s) => s.isActive);
  const { data } = useCurrentBusiness();
  const checklist = data?.setupChecklist;
  if (tourActive || !checklist || checklist.completedCount >= checklist.total) {
    return null;
  }

  return (
    <div
      className="border-border bg-card rounded-xl border p-4 shadow-sm"
      aria-label="Setup checklist"
    >
      <p className="text-foreground text-sm font-semibold tracking-tight">
        Finish your setup
      </p>
      <p className="text-muted-foreground mt-0.5 text-xs">
        Complete these steps to unlock the full product experience.
      </p>
      <SetupChecklistSummary
        checklist={checklist}
        variant="comfortable"
        className="mt-3"
      />
    </div>
  );
}

export function DashboardPageClient() {
  return (
    <div className="space-y-6 pb-6">
      <Suspense>
        <HighlightsSection />
      </Suspense>
      <DashboardSetupChecklistCard />
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
