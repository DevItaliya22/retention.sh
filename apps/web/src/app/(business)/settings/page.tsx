import { BusinessSettingsContainer } from "@/components/settings/business/BusinessSettingsContainer";
import { generateRouteMetadata } from "@/lib/utils/route-metadata";
import type { Metadata } from "next";

export const metadata: Metadata = generateRouteMetadata("/settings");

export default function GeneralSettingPage() {
  return (
    <BusinessSettingsContainer />
  );
}