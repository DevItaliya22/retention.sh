import { SettingsPageFallback } from "@/components/settings/SettingsPageFallback";
import { generateRouteMetadata } from "@/lib/utils/route-metadata";
import type { Metadata } from "next";
import { Suspense } from "react";
import {
  SegmentsSettingsPageClient,
  SegmentsSettingsSkeleton,
} from "./_components/SegmentsSettingsPageClient";

export const metadata: Metadata = generateRouteMetadata("/settings/segments");

export default function SegmentsSettingsPage() {
  return (
    <Suspense
      fallback={
        <SettingsPageFallback
          title="Customer Segments"
          subtitle="Configure recency, frequency, and monetary thresholds for customer segmentation"
        >
          <SegmentsSettingsSkeleton />
        </SettingsPageFallback>
      }
    >
      <SegmentsSettingsPageClient />
    </Suspense>
  );
}
