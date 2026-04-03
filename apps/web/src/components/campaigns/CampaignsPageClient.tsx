"use client";

import { CampaignPreview } from "@/components/campaigns/CampaignPreview";
import { CampaignsTable } from "@/components/campaigns/CampaignsTable";
import { DashboardPageShell } from "@/components/layouts";
import {
  useCampaignQuery,
  useCreateCampaignDraft,
} from "@/hooks/campaigns/useCampaignsQuery";
import { downloadCampaignCardAsImage } from "@/lib/utils/campaign-card-image";
import { Button } from "@reelo/ui/components";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

/** Renders hidden campaign preview and triggers download when mounted. */
function CampaignDownloadPreview({
  campaignId,
  onDone,
}: {
  campaignId: string;
  onDone: () => void;
}) {
  const { data: campaign } = useCampaignQuery(campaignId);
  const previewRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);

  const resolvedLogoUrl = useMemo(() => {
    if (!campaign?.logo) return null;
    if (
      campaign.logo.startsWith("http://") ||
      campaign.logo.startsWith("https://") ||
      campaign.logo.startsWith("blob:") ||
      campaign.logo.startsWith("data:")
    ) {
      return campaign.logo;
    }
    return `/api/storage/read?src=${encodeURIComponent(campaign.logo)}`;
  }, [campaign?.logo]);

  const resolvedBannerUrl = useMemo(() => {
    if (!campaign?.bannerImage) return null;
    if (
      campaign.bannerImage.startsWith("http://") ||
      campaign.bannerImage.startsWith("https://") ||
      campaign.bannerImage.startsWith("blob:") ||
      campaign.bannerImage.startsWith("data:")
    ) {
      return campaign.bannerImage;
    }
    return `/api/storage/read?src=${encodeURIComponent(campaign.bannerImage)}`;
  }, [campaign?.bannerImage]);

  useEffect(() => {
    if (!campaign || !previewRef.current || startedRef.current) return;

    const brandingReady =
      (!campaign.logo || !!resolvedLogoUrl) &&
      (!campaign.bannerImage || !!resolvedBannerUrl);

    if (!brandingReady) return;

    startedRef.current = true;

    const filename = (campaign.title || "campaign-card")
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9-]/g, "");

    requestAnimationFrame(() => {
      if (!previewRef.current) {
        onDone();
        return;
      }

      downloadCampaignCardAsImage(previewRef.current, filename)
        .catch(() => toast.error("Failed to download image"))
        .finally(onDone);
    });
  }, [
    campaign,
    onDone,
    resolvedBannerUrl,
    resolvedLogoUrl,
    campaign?.bannerImage,
    campaign?.logo,
    campaign?.title,
  ]);

  if (!campaign) return null;

  return (
    <div className="pointer-events-none fixed top-0 left-[-9999px] z-[-1]">
      <div data-campaign-preview>
        <CampaignPreview
          ref={previewRef}
          data={{
            title: campaign.title,
            description: campaign.description,
            contactNumber: campaign.contactNumber,
            rewardValue: campaign.rewardValue ?? null,
            expiresAt: campaign.expiresAt,
            termsAndConditions: campaign.termsAndConditions ?? [],
            maxRedemptionEnabled: campaign.maxRedemptionEnabled ?? false,
            maxRedemptionAmount: campaign.maxRedemptionAmount ?? null,
            minPurchaseForEarningEnabled:
              campaign.minPurchaseForEarningEnabled ?? false,
            minPurchaseForEarning: campaign.minPurchaseForEarning ?? null,
            minPurchaseForRedemptionEnabled:
              campaign.minPurchaseForRedemptionEnabled ?? false,
            minPurchaseForRedemption: campaign.minPurchaseForRedemption ?? null,
            instantCashbackRedeemable:
              campaign.instantCashbackRedeemable ?? false,
            redemptionLimit: campaign.redemptionLimit ?? "ONCE",
          }}
          branding={{
            logo: resolvedLogoUrl,
            themeColor: campaign.themeColor ?? null,
            textColor: campaign.textColor ?? null,
            bannerImage: resolvedBannerUrl,
          }}
          className="w-[360px] max-w-none shadow-none"
          showControls={false}
        />
      </div>
    </div>
  );
}

export function CampaignsPageClient() {
  const router = useRouter();
  const createDraft = useCreateCampaignDraft();
  const [downloadCampaignId, setDownloadCampaignId] = useState<string | null>(
    null,
  );

  const handleCreateCampaign = async () => {
    try {
      const result = await createDraft.mutateAsync();
      router.push(`/campaigns/create/${result.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create campaign");
    }
  };

  return (
    <DashboardPageShell
      title="Campaigns"
      subtitle="Create and manage marketing campaigns"
      primaryActions={
        <Button
          icon={<Plus className="h-4 w-4" />}
          onClick={handleCreateCampaign}
          disabled={createDraft.isPending}
        >
          Add campaign
        </Button>
      }
    >
      {downloadCampaignId && (
        <CampaignDownloadPreview
          campaignId={downloadCampaignId}
          onDone={() => setDownloadCampaignId(null)}
        />
      )}
      <CampaignsTable
        onEdit={(id) => router.push(`/campaigns/create/${id}`)}
        onDownload={setDownloadCampaignId}
      />
    </DashboardPageShell>
  );
}
