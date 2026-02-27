import { SettingsPageFallback } from "@/components/settings/SettingsPageFallback";
import { generateRouteMetadata } from "@/lib/utils/route-metadata";
import type { Metadata } from "next";
import { Suspense } from "react";
import { CategorySettingPageClient } from "./_components/CategorySettingPageClient";

export const metadata: Metadata = generateRouteMetadata(
  "/settings/sku/categories",
);

export default function CategorySettingPage() {
  return (
    <Suspense
      fallback={
        <SettingsPageFallback
          title="Categories"
          subtitle="Manage product categories for your SKUs"
        />
      }
    >
      <CategorySettingPageClient />
    </Suspense>
  );
}
