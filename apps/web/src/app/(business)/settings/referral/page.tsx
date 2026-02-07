import { generateRouteMetadata } from "@/lib/utils/route-metadata";
import type { Metadata } from "next";
import { Suspense } from "react";
import { ReferralSettingsPageClient } from "./_components/ReferralSettingsPageClient";

export const metadata: Metadata = generateRouteMetadata("/settings/referral");

export default function ReferralSettingsPage() {
  return (
    <Suspense fallback={<div className="h-96" />}>
      <ReferralSettingsPageClient />
    </Suspense>
  );
}
