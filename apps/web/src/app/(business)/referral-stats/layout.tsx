"use client";

import {
  DashboardPageShell,
  GooeyTabs,
  ScaffoldSection,
} from "@/components/layouts";
import { Button } from "@reelo/ui/components";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode } from "react";

const REFERRAL_STATS_TABS = [
  { value: "stats", label: "Stats", path: "/referral-stats" },
  { value: "activity", label: "Activity", path: "/referral-stats/activity" },
];

export default function ReferralStatsLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const activeTab =
    pathname === "/referral-stats/activity" ? "activity" : "stats";

  return (
    <DashboardPageShell
      title="Referral stats"
      subtitle="Referral performance, costs, and revenue analytics"
      primaryActions={
        <Button
          variant="outline"
          onClick={() => router.push("/settings/referral")}
        >
          Edit referral settings
        </Button>
      }
    >
      <ScaffoldSection isFullWidth className="pt-0!">
        <GooeyTabs
          gooeyId="referral-stats-gooey"
          tabs={REFERRAL_STATS_TABS}
          activeTab={activeTab}
          onTabChange={(path) => router.push(path)}
        >
          {children}
        </GooeyTabs>
      </ScaffoldSection>
    </DashboardPageShell>
  );
}
