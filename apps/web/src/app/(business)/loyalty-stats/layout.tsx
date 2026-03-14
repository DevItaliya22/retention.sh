"use client";

import {
  DashboardPageShell,
  GooeyTabs,
  ScaffoldSection,
} from "@/components/layouts";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode } from "react";

const LOYALTY_STATS_TABS = [
  { value: "stats", label: "Stats", path: "/loyalty-stats" },
  { value: "activity", label: "Activity", path: "/loyalty-stats/activity" },
];

export default function LoyaltyStatsLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const activeTab =
    pathname === "/loyalty-stats/activity" ? "activity" : "stats";

  return (
    <DashboardPageShell
      title="Loyalty stats"
      subtitle="Earned and redeemed points by source, customer and bill"
    >
      <ScaffoldSection isFullWidth className="pt-0!">
        <GooeyTabs
          gooeyId="loyalty-stats-gooey"
          tabs={LOYALTY_STATS_TABS}
          activeTab={activeTab}
          onTabChange={(path) => router.push(path)}
        >
          {children}
        </GooeyTabs>
      </ScaffoldSection>
    </DashboardPageShell>
  );
}
