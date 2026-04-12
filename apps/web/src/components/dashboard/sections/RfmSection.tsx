"use client";

import { useCustomerSegmentsQuery } from "@/hooks/analytics/useAnalyticsQuery";
import { useCreateCampaignDraft } from "@/hooks/campaigns/useCampaignsQuery";
import {
  getSegmentTagHex,
  segmentCardSurfaceStyle,
} from "@/lib/segmentation/segment-tag-colours";
import type { CustomerSegment } from "@/lib/types/analytics";
import { InfoIcon } from "@reelo/ui/components";
import { Skeleton } from "@reelo/ui/components/skeleton";
import { cn } from "@reelo/ui/lib/utils";
import { Info, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { toast } from "sonner";
import { SectionHeader } from "../shared";

type CardSize = "large" | "wide" | "tall" | "small";

const GRID_BASE =
  "grid grid-flow-dense gap-3 grid-cols-2 md:grid-cols-4 grid-auto-rows-[100px]";

const SIZE_CLASSES: Record<CardSize, string> = {
  large: "col-span-2 row-span-2 min-h-0",
  wide: "col-span-2 row-span-1 min-h-0",
  tall: "col-span-1 row-span-2 min-h-0",
  small: "col-span-1 row-span-1 min-h-0",
};

function getSize(index: number, total: number): CardSize {
  if (index <= 1) return "large";
  if (index <= 3) return "wide";
  if (index <= 5) return "tall";
  return "small";
}

function SegmentBlock({
  segment,
  onSelect,
  onCreateCampaign,
  isCreatingCampaign,
  size,
}: {
  segment: CustomerSegment;
  onSelect: () => void;
  onCreateCampaign: (e: React.MouseEvent) => void;
  isCreatingCampaign?: boolean;
  size: CardSize;
}) {
  const hex = getSegmentTagHex(segment.tagColour, segment.slug);
  const infoContent = [segment.description, segment.proTip]
    .filter(Boolean)
    .join("\n\nPro-tip: ");
  const isLarge = size === "large";
  const isWideOrTall = size === "wide" || size === "tall";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        "group flex cursor-pointer flex-col justify-between rounded-lg border p-4 text-left transition-all duration-200 hover:scale-[1.02] hover:shadow-md",
        SIZE_CLASSES[size],
      )}
      style={segmentCardSurfaceStyle(hex)}
    >
      <div className="flex items-start justify-between gap-2">
        <p
          className={cn(
            "text-muted-foreground line-clamp-2 font-medium",
            isLarge ? "text-base" : "text-sm",
          )}
        >
          {segment.name}
        </p>
        {infoContent && (
          <div
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            className="shrink-0"
          >
            <InfoIcon content={infoContent} size={12} />
          </div>
        )}
      </div>
      <div className="mt-auto flex items-end justify-between">
        <div>
          <p
            className={cn(
              "text-foreground font-bold tabular-nums",
              isLarge ? "text-2xl" : isWideOrTall ? "text-xl" : "text-lg",
            )}
          >
            {segment.percentage}%
          </p>
          <p className="text-muted-foreground text-xs">
            {segment.count.toLocaleString()} customers
          </p>
        </div>
        <button
          type="button"
          className="border-border/60 bg-background/90 text-foreground hover:bg-background flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium shadow-sm transition-all duration-200 disabled:opacity-50 md:opacity-0 md:group-hover:opacity-100"
          disabled={isCreatingCampaign}
          onClick={(e) => {
            e.stopPropagation();
            onCreateCampaign(e);
          }}
        >
          <Plus className="h-3 w-3 shrink-0" />
          {(isLarge || size === "wide") && "Campaign"}
        </button>
      </div>
    </div>
  );
}

export function RfmSection() {
  const router = useRouter();
  const { data, isLoading } = useCustomerSegmentsQuery();

  const createDraft = useCreateCampaignDraft();

  const handleSelect = useCallback(
    (slug: string) => {
      router.push(`/customers?segment=${encodeURIComponent(slug)}`);
    },
    [router],
  );

  const handleCreateCampaign = async (e: React.MouseEvent, slug: string) => {
    e.stopPropagation();
    try {
      const result = await createDraft.mutateAsync();
      router.push(
        `/campaigns/create/${result.id}?audience=${encodeURIComponent(`segment:${slug}`)}`,
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create campaign");
    }
  };

  return (
    <section className="space-y-3">
      <SectionHeader
        title={
          data
            ? `${data.totalCustomers.toLocaleString()} Total Customers`
            : "Total Customers"
        }
        description="Customer segments based on visit patterns and spending. Click a segment to view customers."
      />
      {isLoading ? (
        <div className={GRID_BASE}>
          {Array.from({ length: 9 }).map((_, i) => {
            const size = getSize(i, 9);
            return (
              <div
                key={i}
                className={cn(
                  "bg-muted/20 flex flex-col justify-between rounded-lg border p-4",
                  SIZE_CLASSES[size],
                )}
              >
                <Skeleton className="h-4 w-24" />
                <div className="mt-auto space-y-2">
                  <Skeleton className="h-6 w-12" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            );
          })}
        </div>
      ) : data?.segments && data.segments.length > 0 ? (
        <div className={GRID_BASE}>
          {data.segments
            .filter((s) => s.slug !== "other")
            .sort((a, b) => b.percentage - a.percentage)
            .map((segment, index) => (
              <SegmentBlock
                key={segment.slug}
                segment={segment}
                onSelect={() => handleSelect(segment.slug)}
                onCreateCampaign={(e) => handleCreateCampaign(e, segment.slug)}
                isCreatingCampaign={createDraft.isPending}
                size={getSize(index, data.segments.length)}
              />
            ))}
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-lg border p-6">
          <Info className="text-muted-foreground size-4" />
          <p className="text-muted-foreground text-sm">
            No customer data available yet.
          </p>
        </div>
      )}
    </section>
  );
}
