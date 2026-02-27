import { SettingsPageFallback } from "@/components/settings/SettingsPageFallback";
import { generateRouteMetadata } from "@/lib/utils/route-metadata";
import type { Metadata } from "next";
import { Suspense } from "react";
import { SkuSettingPageClient } from "./_components/SkuSettingPageClient";

export const metadata: Metadata = generateRouteMetadata("/settings/sku");

export default function SkuSettingPage() {
  return (
    <Suspense
      fallback={
        <SettingsPageFallback
          title="SKU"
          subtitle="Manage SKUs and product categories"
        />
      }
    >
      <SkuSettingPageClient />
    </Suspense>
  );
}
