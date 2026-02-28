import { SettingsPageFallback } from "@/components/settings/SettingsPageFallback";
import { ReferralSettingsSkeleton } from "@/components/settings/referral/ReferralSettingsSkeleton";
import { generateRouteMetadata } from "@/lib/utils/route-metadata";
import type { Metadata } from "next";
import { Suspense } from "react";
import { ReferralSettingsPageClient } from "./_components/ReferralSettingsPageClient";

export const metadata: Metadata = generateRouteMetadata("/settings/referral");

export default function ReferralSettingsPage() {
  return (
    <Suspense
      fallback={
        <SettingsPageFallback
          title="Referral Program"
          subtitle="Set up and manage referral rewards"
        >
          <ReferralSettingsSkeleton />
        </SettingsPageFallback>
      }
    >
      <ReferralSettingsPageClient />
    </Suspense>
  );
}
