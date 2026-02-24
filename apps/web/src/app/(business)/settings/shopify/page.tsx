import { generateRouteMetadata } from "@/lib/utils/route-metadata";
import type { Metadata } from "next";
import { Suspense } from "react";
import { ShopifySettingsPageClient } from "./_components/ShopifySettingsPageClient";

export const metadata: Metadata = generateRouteMetadata("/settings/shopify");

export default function ShopifySettingsPage() {
  return (
    <Suspense fallback={<div className="h-96" />}>
      <ShopifySettingsPageClient />
    </Suspense>
  );
}
