"use client";

import {
  DashboardPageShell,
  GooeyTabs,
  ScaffoldSection,
} from "@/components/layouts";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode } from "react";

const FEEDBACK_STATS_TABS = [
  { value: "stats", label: "Stats", path: "/feedback-stats" },
  { value: "activity", label: "Activity", path: "/feedback-stats/activity" },
];

export default function FeedbackStatsLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const activeTab =
    pathname === "/feedback-stats/activity" ? "activity" : "stats";

  return (
    <DashboardPageShell
      title="Feedback stats"
      subtitle="Customer feedback responses by rating, comment and date"
    >
      <ScaffoldSection isFullWidth className="pt-0!">
        <GooeyTabs
          gooeyId="feedback-stats-gooey"
          tabs={FEEDBACK_STATS_TABS}
          activeTab={activeTab}
          onTabChange={(path) => router.push(path)}
        >
          {children}
        </GooeyTabs>
      </ScaffoldSection>
    </DashboardPageShell>
  );
}
