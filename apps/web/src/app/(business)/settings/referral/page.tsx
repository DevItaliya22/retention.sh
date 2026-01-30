import { ReferralSettingsPageClient } from "@/components/settings/referral/ReferralSettingsPageClient";
import { generateRouteMetadata } from "@/lib/utils/route-metadata";
import type { Metadata } from "next";

export const metadata: Metadata = generateRouteMetadata("/settings/referral");

export default function ReferralSettingsPage() {
  return <ReferralSettingsPageClient />;
}
