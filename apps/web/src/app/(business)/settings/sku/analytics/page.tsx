import { SettingsPageFallback } from "@/components/settings/SettingsPageFallback";
import { generateRouteMetadata } from "@/lib/utils/route-metadata";
import type { Metadata } from "next";
import { Suspense } from "react";
import { SkuAnalyticsPageClient } from "./_components/SkuAnalyticsPageClient";

export const metadata: Metadata = generateRouteMetadata("/settings/sku");

export default function SkuAnalyticsPage() {
  return (
    <Suspense
      fallback={
        <SettingsPageFallback
          title="SKU Analytics"
          subtitle="Product and category sales performance"
        />
      }
    >
      <SkuAnalyticsPageClient />
    </Suspense>
  );
}
