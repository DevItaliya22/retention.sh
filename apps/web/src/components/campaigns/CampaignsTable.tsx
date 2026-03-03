"use client";

import {
  type CampaignListItem,
  useCampaignsQuery,
} from "@/hooks/campaigns/useCampaignsQuery";
import {
  CAMPAIGN_APPLIES_TO_LABELS,
  CAMPAIGN_REDEMPTION_LABELS,
  CAMPAIGN_REWARD_TYPE_LABELS,
  CAMPAIGN_STATUS_LABELS,
} from "@/lib/constants/forms/campaign";
import {
  CAMPAIGN_APPLIES_TO,
  CAMPAIGN_REDEMPTION_LIMITS,
  CAMPAIGN_REWARD_TYPES,
  CAMPAIGN_STATUSES,
} from "@/lib/schemas/campaign";
import { getDataTableConfig } from "@/lib/utils/data-table-params";
import {
  Badge,
  Button,
  DataTable,
  DataTableColumnHeader,
  DataTableToolbar,
  DateDisplay,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Skeleton,
} from "@reelo/ui/components";
import { useDataTable } from "@reelo/ui/hooks";
import type { ColumnDef } from "@tanstack/react-table";
import { Download, Megaphone } from "lucide-react";
import { useMemo } from "react";

interface CampaignsTableProps {
  onEdit: (id: string) => void;
  onDownload: (id: string) => void;
}

const EMPTY_CAMPAIGNS: CampaignListItem[] = [];

function createSkeletonCampaign(id: string): CampaignListItem {
  return {
    id,
    slug: "",
    title: null,
    description: null,
    status: "DRAFT",
    rewardType: "FREE_ITEM",
    rewardValue: null,
    offerStatement: null,
    appliesTo: "ENTIRE_PURCHASE",
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
  };
}

export function CampaignsTable({ onEdit, onDownload }: CampaignsTableProps) {
  const { data, isLoading, isError, error } = useCampaignsQuery();
  const items = data?.items ?? EMPTY_CAMPAIGNS;
  const total = data?.total ?? 0;
  const perPage = data?.perPage ?? 10;
  const pageCount = Math.max(1, Math.ceil(total / perPage));
  const isEmpty = !isLoading && items.length === 0;

  const displayItems = useMemo(() => {
    if (isLoading && items.length === 0) {
      return Array.from({ length: perPage }, (_, i) =>
        createSkeletonCampaign(`skeleton-${i}`),
      );
    }

    if (isEmpty) return [] as CampaignListItem[];

    return items;
  }, [isEmpty, isLoading, items, perPage]);

  const columns = useMemo<ColumnDef<CampaignListItem>[]>(
    () => [
      {
        id: "title",
        accessorKey: "title",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Campaign" />
        ),
        cell: ({ row }) => {
          const campaign = row.original;
          if (campaign.id === "empty-state") return null;
          if (isLoading && campaign.id.startsWith("skeleton-")) {
            return <Skeleton className="h-4 w-40" />;
          }
          return (
            <div>
              <p className="font-medium">
                {campaign.title?.trim() || "Untitled campaign"}
              </p>
              {campaign.description?.trim() && (
                <p className="text-muted-foreground mt-0.5 line-clamp-1 text-xs">
                  {campaign.description}
                </p>
              )}
            </div>
          );
        },
        enableColumnFilter: true,
        enableSorting: true,
        meta: {
          label: "Campaign",
          variant: "text" as const,
          placeholder: "Search by campaign title...",
          maxLength: 500,
        },
      },
      {
        id: "status",
        accessorKey: "status",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Status" />
        ),
        cell: ({ row }) => {
          const campaign = row.original;
          if (campaign.id === "empty-state") return null;
          if (isLoading && campaign.id.startsWith("skeleton-")) {
            return <Skeleton className="h-5 w-20" />;
          }
          return (
            <Badge
              variant={campaign.status === "DRAFT" ? "secondary" : "default"}
            >
              {CAMPAIGN_STATUS_LABELS[campaign.status] ?? campaign.status}
            </Badge>
          );
        },
        enableColumnFilter: true,
        enableSorting: true,
        meta: {
          label: "Status",
          variant: "select" as const,
          options: CAMPAIGN_STATUSES.map((status) => ({
            label: CAMPAIGN_STATUS_LABELS[status] ?? status,
            value: status,
          })),
        },
      },
      {
        id: "rewardType",
        accessorKey: "rewardType",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Reward" />
        ),
        cell: ({ row }) => {
          const campaign = row.original;
          if (campaign.id === "empty-state") return null;
          if (isLoading && campaign.id.startsWith("skeleton-")) {
            return <Skeleton className="h-4 w-28" />;
          }
          return (
            <span className="text-sm">
              {CAMPAIGN_REWARD_TYPE_LABELS[campaign.rewardType] ??
                campaign.rewardType}
            </span>
          );
        },
        enableColumnFilter: true,
        enableSorting: true,
        meta: {
          label: "Reward",
          variant: "select" as const,
          options: CAMPAIGN_REWARD_TYPES.map((rewardType) => ({
            label: CAMPAIGN_REWARD_TYPE_LABELS[rewardType] ?? rewardType,
            value: rewardType,
          })),
        },
      },
      {
        id: "appliesTo",
        accessorKey: "appliesTo",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Applies to" />
        ),
        cell: ({ row }) => {
          const campaign = row.original;
          if (campaign.id === "empty-state") return null;
          if (isLoading && campaign.id.startsWith("skeleton-")) {
            return <Skeleton className="h-4 w-28" />;
          }
          return (
            <span className="text-muted-foreground text-sm">
              {CAMPAIGN_APPLIES_TO_LABELS[campaign.appliesTo] ??
                campaign.appliesTo}
            </span>
          );
        },
        enableColumnFilter: true,
        meta: {
          label: "Applies to",
          variant: "select" as const,
          options: CAMPAIGN_APPLIES_TO.map((appliesTo) => ({
            label: CAMPAIGN_APPLIES_TO_LABELS[appliesTo] ?? appliesTo,
            value: appliesTo,
          })),
        },
      },
      {
        id: "redemptionLimit",
        accessorKey: "redemptionLimit",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Usage" />
        ),
        cell: ({ row }) => {
          const campaign = row.original;
          if (campaign.id === "empty-state") return null;
          if (isLoading && campaign.id.startsWith("skeleton-")) {
            return <Skeleton className="h-4 w-20" />;
          }
          return (
            <span className="text-muted-foreground text-sm">
              {CAMPAIGN_REDEMPTION_LABELS[campaign.redemptionLimit] ??
                campaign.redemptionLimit}
            </span>
          );
        },
        enableColumnFilter: true,
        meta: {
          label: "Usage",
          variant: "select" as const,
          options: CAMPAIGN_REDEMPTION_LIMITS.map((limit) => ({
            label: CAMPAIGN_REDEMPTION_LABELS[limit] ?? limit,
            value: limit,
          })),
        },
      },
      {
        id: "expiresAt",
        accessorKey: "expiresAt",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Expires" />
        ),
        cell: ({ row }) => {
          const campaign = row.original;
          if (campaign.id === "empty-state") return null;
          if (isLoading && campaign.id.startsWith("skeleton-")) {
            return <Skeleton className="h-4 w-24" />;
          }
          return (
            <DateDisplay
              date={campaign.expiresAt}
              relative={false}
              className="text-muted-foreground text-sm"
            />
          );
        },
        enableSorting: true,
      },
      {
        id: "updatedAt",
        accessorKey: "updatedAt",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Updated" />
        ),
        cell: ({ row }) => {
          const campaign = row.original;
          if (campaign.id === "empty-state") return null;
          if (isLoading && campaign.id.startsWith("skeleton-")) {
            return <Skeleton className="h-4 w-24" />;
          }
          return (
            <DateDisplay
              date={campaign.updatedAt}
              className="text-muted-foreground text-sm"
            />
          );
        },
        enableSorting: true,
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        size: 180,
        cell: ({ row }) => {
          const campaign = row.original;
          if (campaign.id === "empty-state") return null;
          if (isLoading && campaign.id.startsWith("skeleton-")) {
            return (
              <div className="flex justify-end gap-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-16" />
              </div>
            );
          }

          return (
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-border/60 bg-background/55 h-8 rounded-md px-2.5 text-xs"
                icon={<Download className="h-3.5 w-3.5" />}
                onClick={() => onDownload(campaign.id)}
              >
                Ad campaign
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 rounded-md px-2.5 text-xs"
                onClick={() => onEdit(campaign.id)}
              >
                Details
              </Button>
            </div>
          );
        },
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [isLoading, onDownload, onEdit],
  );

  const { table } = useDataTable({
    data: displayItems,
    columns,
    pageCount: isLoading && items.length === 0 ? 1 : pageCount,
    shallow: false,
    initialState: {
      pagination: { pageIndex: 0, pageSize: perPage },
      sorting: [{ id: "updatedAt", desc: true }],
      columnPinning: { right: ["actions"] },
    },
    prefix: getDataTableConfig("campaigns").prefix,
  });

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

  return (
    <DataTable
      table={table}
      renderEmpty={() => (
        <Empty className="py-12">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Megaphone className="size-6" />
            </EmptyMedia>
            <EmptyTitle>No campaigns found</EmptyTitle>
            <EmptyDescription>
              Create a campaign or adjust your filters
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    >
      <DataTableToolbar table={table} maxTextFilters={1} />
    </DataTable>
  );
}
