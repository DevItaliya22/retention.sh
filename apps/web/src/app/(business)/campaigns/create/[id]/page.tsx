import { generateRouteMetadata } from "@/lib/utils/route-metadata";
import type { Metadata } from "next";
import { CampaignEditPageClient } from "./_components/CampaignEditPageClient";

export const metadata: Metadata = generateRouteMetadata(
  "/campaigns/create/[id]",
);

type Props = { params: Promise<{ id: string }> };

export default async function CampaignCreatePage({ params }: Props) {
  const { id } = await params;
  return <CampaignEditPageClient campaignId={id} />;
}
