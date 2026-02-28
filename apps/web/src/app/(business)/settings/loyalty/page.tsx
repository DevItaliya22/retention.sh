import { SettingsPageFallback } from "@/components/settings/SettingsPageFallback";
import { LoyaltySettingsSkeleton } from "@/components/settings/loyalty/LoyaltySettingsSkeleton";
import { LoyaltySettingsPageClient } from "./_components/LoyaltySettingsPageClient";

import { generateRouteMetadata } from "@/lib/utils/route-metadata";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = generateRouteMetadata("/settings/loyalty");

export default function LoyaltySettingsPage() {
  return (
    <Suspense
      fallback={
        <SettingsPageFallback
          title="Loyalty Settings"
          subtitle="Configure earning, redemption, expiry, and communication"
        >
          <LoyaltySettingsSkeleton />
        </SettingsPageFallback>
      }
    >
      <LoyaltySettingsPageClient />
    </Suspense>
  );
}
