"use client";

import { CampaignPreview } from "@/components/campaigns/CampaignPreview";
import { PageLayout, ScaffoldContainer } from "@/components/layouts";
import {
  useCampaignQuery,
  useCampaignsQuery,
  useCreateCampaignDraft,
  type CampaignListItem,
} from "@/hooks/campaigns/useCampaignsQuery";
import { CAMPAIGN_REWARD_TYPES } from "@/lib/schemas/campaign";
import { downloadCampaignCardAsImage } from "@/lib/utils/campaign-card-image";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DateDisplay,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
} from "@reelo/ui/components";
import { Download, Megaphone, MoreVertical, Pencil, Plus } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { toast } from "sonner";

const REWARD_TYPE_LABELS: Record<string, string> = {
  FREE_ITEM: "Free item",
  PERCENTAGE_DISCOUNT: "Percentage discount",
  CASH_DISCOUNT: "Cash discount",
  NO_REWARD: "No reward",
};

function RewardTypeFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("rewardType") ?? "all";

  return (
    <Select
      value={current}
      onValueChange={(value) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value === "all") {
          params.delete("rewardType");
        } else {
          params.set("rewardType", value);
        }
        router.push(`/campaigns?${params.toString()}`);
      }}
    >
      <SelectTrigger className="w-[200px]" size="default">
        <SelectValue placeholder="Reward type" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All reward types</SelectItem>
        {CAMPAIGN_REWARD_TYPES.map((type) => (
          <SelectItem key={type} value={type}>
            {REWARD_TYPE_LABELS[type] ?? type}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

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

function CampaignCard({
  campaign,
  isLoading,
  onEdit,
  onDownload,
}: {
  campaign: CampaignListItem;
  isLoading?: boolean;
  onEdit: (id: string) => void;
  onDownload: (id: string) => void;
}) {
  if (campaign.id.startsWith("skeleton-")) {
    return (
      <Card className="transition hover:shadow-md">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="mt-1 h-4 w-1/2" />
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full transition hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="line-clamp-1 text-base">
            {campaign.title || "Untitled campaign"}
          </CardTitle>
          <div className="flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(campaign.id);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onDownload(campaign.id);
                  }}
                >
                  <Download className="h-4 w-4" />
                  Download image
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Badge
              variant={campaign.status === "DRAFT" ? "secondary" : "default"}
            >
              {campaign.status}
            </Badge>
          </div>
        </div>
        <CardDescription className="text-xs">
          {REWARD_TYPE_LABELS[campaign.rewardType] ?? campaign.rewardType}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        {campaign.description && (
          <p className="text-muted-foreground line-clamp-2 text-sm">
            {campaign.description}
          </p>
        )}
        <p className="text-muted-foreground text-xs">
          Expires <DateDisplay date={campaign.expiresAt} />
        </p>
      </CardContent>
    </Card>
  );
}

function CampaignsListContent({
  onEdit,
  onDownload,
}: {
  onEdit: (id: string) => void;
  onDownload: (id: string) => void;
}) {
  const { data, isLoading, isError, error } = useCampaignsQuery();
  const items = data?.items ?? [];

  const displayItems: CampaignListItem[] =
    isLoading && items.length === 0
      ? Array.from({ length: 6 }, (_, i) => ({
          id: `skeleton-${i}`,
          slug: "",
          title: null,
          description: null,
          status: "DRAFT",
          rewardType: "FREE_ITEM",
          rewardValue: null,
          expiresAt: new Date().toISOString(),
          themeColor: null,
          bannerImage: null,
          logo: null,
          contactNumber: null,
          termsAndConditions: [],
          maxRedemptionEnabled: false,
          maxRedemptionAmount: null,
          minPurchaseForEarningEnabled: false,
          minPurchaseForEarning: null,
          minPurchaseForRedemptionEnabled: false,
          minPurchaseForRedemption: null,
          instantCashbackRedeemable: false,
          redemptionLimit: "ONCE",
          createdAt: "",
          updatedAt: "",
        }))
      : items;

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-destructive text-sm font-medium">
          Failed to load campaigns
        </p>
        <p className="text-muted-foreground mt-1 text-sm">
          {error?.message || "Please try again later"}
        </p>
      </div>
    );
  }

  if (!isLoading && items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Megaphone className="text-muted-foreground/50 h-12 w-12" />
        <p className="text-muted-foreground mt-2 font-medium">
          No campaigns yet
        </p>
        <p className="text-muted-foreground text-sm">
          Create your first campaign to get started
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {displayItems.map((campaign) => (
        <CampaignCard
          key={campaign.id}
          campaign={campaign}
          isLoading={isLoading && items.length === 0}
          onEdit={onEdit}
          onDownload={onDownload}
        />
      ))}
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
    <PageLayout
      title="Campaigns"
      subtitle="Create and manage marketing campaigns"
      size="full"
      scaffoldSectionClassName="h-full w-full pt-2 pb-0"
      primaryActions={
        <Button
          icon={<Plus className="h-4 w-4" />}
          onClick={handleCreateCampaign}
          disabled={createDraft.isPending}
        >
          Create campaign
        </Button>
      }
    >
      <ScaffoldContainer className="max-w-full px-6">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground text-sm">Reward type:</span>
            <Suspense fallback={<Skeleton className="h-9 w-[200px]" />}>
              <RewardTypeFilter />
            </Suspense>
          </div>
          {downloadCampaignId && (
            <CampaignDownloadPreview
              campaignId={downloadCampaignId}
              onDone={() => setDownloadCampaignId(null)}
            />
          )}
          <Suspense
            fallback={
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i}>
                    <CardHeader className="pb-2">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="mt-1 h-4 w-1/2" />
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            }
          >
            <CampaignsListContent
              onEdit={(id) => router.push(`/campaigns/create/${id}`)}
              onDownload={setDownloadCampaignId}
            />
          </Suspense>
        </div>
      </ScaffoldContainer>
    </PageLayout>
  );
}
