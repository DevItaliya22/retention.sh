import { CampaignsPageClient } from "@/components/campaigns/CampaignsPageClient";
import { generateRouteMetadata } from "@/lib/utils/route-metadata";
import type { Metadata } from "next";

export const metadata: Metadata = generateRouteMetadata("/campaigns");

export default function CampaignsPage() {
  return <CampaignsPageClient />;
}
