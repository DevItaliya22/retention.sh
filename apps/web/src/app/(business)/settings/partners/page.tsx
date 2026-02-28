import { SettingsPageFallback } from "@/components/settings/SettingsPageFallback";
import { generateRouteMetadata } from "@/lib/utils/route-metadata";
import type { Metadata } from "next";
import { Suspense } from "react";
import { PartnersSettingsPageClient } from "./_components/PartnersSettingsPageClient";

export const metadata: Metadata = generateRouteMetadata("/settings/partners");

export default function PartnersSettingsPage() {
  return (
    <Suspense
      fallback={
        <SettingsPageFallback
          title="Partners"
          subtitle="Manage partnerships, requests, and shared campaigns"
        />
      }
    >
      <PartnersSettingsPageClient />
    </Suspense>
  );
}
