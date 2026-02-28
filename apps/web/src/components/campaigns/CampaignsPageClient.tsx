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
import { useState } from "react";
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

  if (!campaign) return null;

  return (
    <div
      className="pointer-events-none fixed top-0 left-[-9999px] z-[-1] opacity-0"
      ref={(el) => {
        if (!el) return;
        const previewEl = el.querySelector("[data-campaign-preview]");
        if (previewEl instanceof HTMLElement) {
          requestAnimationFrame(() => {
            const filename = (campaign.title || "campaign-card")
              .replace(/\s+/g, "-")
              .replace(/[^a-zA-Z0-9-]/g, "");
            downloadCampaignCardAsImage(previewEl, filename)
              .catch(() => toast.error("Failed to download image"))
              .finally(onDone);
          });
        } else {
          onDone();
        }
      }}
    >
      <div data-campaign-preview>
        <CampaignPreview
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
            logo: campaign.logo ?? null,
            themeColor: campaign.themeColor ?? null,
            textColor: campaign.textColor ?? null,
            bannerImage: campaign.bannerImage ?? null,
          }}
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
      secondaryActions={
        <Button variant="outline" onClick={() => router.push("/campaigns")}>
          Reset filters
        </Button>
      }
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
