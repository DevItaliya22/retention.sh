import { LoyaltySettingsPageClient } from "@/components/settings/loyalty/LoyaltySettingsPageClient";
import { LoyaltySettingsSkeleton } from "@/components/settings/loyalty/LoyaltySettingsSkeleton";

import { generateRouteMetadata } from "@/lib/utils/route-metadata";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = generateRouteMetadata("/settings/loyalty");

export default function LoyaltySettingsPage() {
  return (
    <Suspense fallback={<LoyaltySettingsSkeleton />}>
      <LoyaltySettingsPageClient />
    </Suspense>
  );
}
