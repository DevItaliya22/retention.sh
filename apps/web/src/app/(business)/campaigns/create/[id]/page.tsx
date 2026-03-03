import { auth } from "@/lib/auth/auth";
import { generateRouteMetadata } from "@/lib/utils/route-metadata";
import { db } from "@reelo/db";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { CampaignEditPageClient } from "./_components/CampaignEditPageClient";

export const metadata: Metadata = generateRouteMetadata(
  "/campaigns/create/[id]",
);

type Props = { params: Promise<{ id: string }> };

export default async function CampaignCreatePage({ params }: Props) {
  const { id } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user as { id: string; role?: string | null };
  if (user.role !== "ADMIN") {
    redirect("/login");
  }

  const admin = await db.admin.findFirst({
    where: { userId: user.id },
    select: { businessId: true },
  });

  if (!admin) {
    redirect("/welcome");
  }

  const campaign = await db.campaign.findFirst({
    where: {
      id,
      businessId: admin.businessId,
    },
  });

  if (!campaign) {
    notFound();
  }

  const initialCampaign = {
    ...campaign,
    expiresAt: campaign.expiresAt.toISOString(),
    createdAt: campaign.createdAt.toISOString(),
    updatedAt: campaign.updatedAt.toISOString(),
  };

  return (
    <CampaignEditPageClient campaignId={id} initialCampaign={initialCampaign} />
  );
}
