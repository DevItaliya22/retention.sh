import { generateRouteMetadata } from "@/lib/utils/route-metadata";
import type { Metadata } from "next";
import { Suspense } from "react";
import { SkuSettingPageClient } from "./_components/SkuSettingPageClient";

export const metadata: Metadata = generateRouteMetadata("/settings/sku");

export default function SkuSettingPage() {
  return (
    <Suspense fallback={<div className="h-96" />}>
      <SkuSettingPageClient />
    </Suspense>
  );
}
