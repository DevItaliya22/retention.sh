import { SettingsPageFallback } from "@/components/settings/SettingsPageFallback";
import { generateRouteMetadata } from "@/lib/utils/route-metadata";
import type { Metadata } from "next";
import { Suspense } from "react";
import { ShopifySettingsPageClient } from "./_components/ShopifySettingsPageClient";

export const metadata: Metadata = generateRouteMetadata("/settings/shopify");

export default function ShopifySettingsPage() {
  return (
    <Suspense
      fallback={
        <SettingsPageFallback
          title="Shopify"
          subtitle="Connect your Shopify store to sync products into your catalog"
        />
      }
    >
      <ShopifySettingsPageClient />
    </Suspense>
  );
}
