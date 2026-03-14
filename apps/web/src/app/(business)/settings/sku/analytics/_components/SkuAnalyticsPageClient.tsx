"use client";

import {
  DashboardPageShell,
  GooeyTabs,
  ScaffoldSection,
} from "@/components/layouts";
import { SkuAnalyticsView } from "@/components/settings/sku/analytics/SkuAnalyticsView";
import { usePathname, useRouter } from "next/navigation";

import { SKU_TABS } from "../../_components/sku-tabs-config";

export function SkuAnalyticsPageClient() {
  const pathname = usePathname();
  const router = useRouter();
  const activeTab =
    pathname === "/settings/sku"
      ? "sku"
      : pathname === "/settings/sku/analytics"
        ? "analytics"
        : "categories";

  return (
    <DashboardPageShell
      title="SKU Analytics"
      subtitle="Product and category sales performance"
    >
      <ScaffoldSection isFullWidth className="pt-0!">
        <GooeyTabs
          gooeyId="sku-gooey"
          tabs={SKU_TABS}
          activeTab={activeTab}
          onTabChange={(path) => router.push(path)}
        >
          <SkuAnalyticsView />
        </GooeyTabs>
      </ScaffoldSection>
    </DashboardPageShell>
  );
}
