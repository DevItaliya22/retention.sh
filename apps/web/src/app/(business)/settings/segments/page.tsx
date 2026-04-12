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
          title="Segments"
          subtitle="Create and manage customer segments"
        >
          <SegmentsSettingsSkeleton />
        </SettingsPageFallback>
      }
    >
      <SegmentsSettingsPageClient />
    </Suspense>
  );
}
