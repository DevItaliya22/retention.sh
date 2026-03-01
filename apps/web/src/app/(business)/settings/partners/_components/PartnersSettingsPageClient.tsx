"use client";

import { SettingsFieldGroup } from "@/components/common/settings/SettingsFieldGroup";
import { SettingsSection } from "@/components/common/settings/SettingsSection";

import { DashboardPageShell } from "@/components/layouts";
import { useCurrentBusiness } from "@/hooks/business/useCurrentBusiness";
import {
  usePartnerRequests,
  useRespondPartnerRequest,
  useSendPartnerRequest,
  useUnPermanentReject,
  type PartnerRequestItem,
} from "@/hooks/partnership/usePartnerRequests";
import {
  useDissolvePartnership,
  usePartnerships,
  useUpdatePartnership,
  type Partnership,
} from "@/hooks/partnership/usePartnerships";
import {
  usePartnershipSettings,
  useUpdatePartnershipSettings,
} from "@/hooks/partnership/usePartnershipSettings";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Badge,
  Button,
  Checkbox,
  DataTable,
  DataTableColumnHeader,
  DataTableToolbar,
  DateDisplay,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  Input,
  Label,
  SaveButton,
  Skeleton,
  Switch,
} from "@reelo/ui/components";
import { useDataTable } from "@reelo/ui/hooks";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowRight, Check, Trash2, Undo2, X } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

const PARTNER_LABEL = "Partner";
const PARTNER_TABLE_PAGE_SIZE = 8;

function formatStatusLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildRequestSkeletonRows(length: number): PartnerRequestItem[] {
  return Array.from({ length }, (_, i) => ({
    id: `skeleton-${i}`,
    senderBusinessId: "",
    receiverBusinessId: "",
    status: "PENDING",
    partnershipId: null,
    senderBusiness: undefined,
    receiverBusiness: undefined,
    createdAt: "",
    updatedAt: "",
  }));
}

// ---------------------------------------------------------------------------
// Single setting field: Receive + Send + Active (one card, no nested cards)
// ---------------------------------------------------------------------------
function PartnershipSettingsSingleSection({
  myBusinessId,
}: {
  myBusinessId: string;
}) {
  const { data: settingsData, isLoading: settingsLoading } =
    usePartnershipSettings();
  const updateSettings = useUpdatePartnershipSettings();
  const sendRequest = useSendPartnerRequest();
  const [sendSlug, setSendSlug] = useState("");
  const { data: partnershipsData, isLoading: partnershipsLoading } =
    usePartnerships();
  const partnerships = partnershipsData?.items ?? [];

  const handleSend = async () => {
    if (!sendSlug.trim()) return;
    try {
      await sendRequest.mutateAsync({ targetBusinessSlug: sendSlug.trim() });
      setSendSlug("");
      toast.success("Request sent.");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to send request.");
    }
  };

  if (settingsLoading) {
    return (
      <SettingsSection
        title="Partnership settings"
        description="Receive offers, send requests, and manage active partnerships."
      >
        <Skeleton className="h-32 w-full" />
      </SettingsSection>
    );
  }

  return (
    <SettingsSection
      title="Partnership settings"
      description="Receive offers, send requests, and manage active partnerships."
      contentClassName="flex flex-col gap-y-6"
    >
      {/* Receive partnership offers */}
      <div className="flex flex-col gap-2 md:grid md:grid-cols-12">
        <div className="col-span-4 flex flex-col gap-0.5">
          <Label className="text-sm">Receive partnership offers</Label>
          <p className="text-muted-foreground text-xs">
            When enabled, other businesses can send you partnership requests.
          </p>
        </div>
        <div className="col-span-8 flex items-center">
          <Switch
            checked={settingsData?.receivePartnershipOffers ?? false}
            onCheckedChange={async (v) => {
              try {
                await updateSettings.mutateAsync({
                  receivePartnershipOffers: v,
                });
                toast.success("Settings updated.");
              } catch (e: unknown) {
                toast.error(
                  e instanceof Error ? e.message : "Failed to update settings.",
                );
              }
            }}
            disabled={updateSettings.isPending}
          />
        </div>
      </div>

      {/* Send request */}
      <div className="flex flex-col gap-2 md:grid md:grid-cols-12">
        <div className="col-span-4 flex flex-col gap-0.5">
          <Label className="text-sm">Business slug</Label>
          <p className="text-muted-foreground text-xs">
            Enter partner&apos;s slug to send a partnership request.
          </p>
        </div>
        <div className="col-span-8 flex flex-wrap items-end gap-2">
          <Input
            variant="underline"
            placeholder="e.g. partner-cafe"
            className="min-w-0 flex-1"
            value={sendSlug}
            onChange={(e) => setSendSlug(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <Button
            onClick={handleSend}
            disabled={!sendSlug.trim() || sendRequest.isPending}
            className="shrink-0"
          >
            {sendRequest.isPending ? "Sending..." : "Send request"}
          </Button>
        </div>
      </div>

      {/* Active partnerships */}
      <div className="border-border/45 flex flex-col gap-4 border-t pt-6">
        <p className="text-foreground text-sm font-semibold">
          Active partnerships
        </p>
        {partnershipsLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : partnerships.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No partnerships yet. Send a request to get started.
          </p>
        ) : (
          <div className="divide-border/45 flex flex-col divide-y">
            {partnerships.map((p) => (
              <PartnershipBlock
                key={p.id}
                partnership={p}
                myBusinessId={myBusinessId}
                embedded
              />
            ))}
          </div>
        )}
      </div>
    </SettingsSection>
  );
}

// ---------------------------------------------------------------------------
// Incoming requests
// ---------------------------------------------------------------------------
function IncomingRequests() {
  const { data, isLoading } = usePartnerRequests("incoming");
  const respond = useRespondPartnerRequest();
  const pending = useMemo(
    () => data?.items.filter((r) => r.status === "PENDING") ?? [],
    [data?.items],
  );

  const handleAction = useCallback(
    async (id: string, action: "accept" | "reject" | "permanently_reject") => {
      try {
        await respond.mutateAsync({ id, action });
        toast.success(
          action === "accept"
            ? "Partnership accepted!"
            : action === "reject"
              ? "Request rejected."
              : "Permanently rejected.",
        );
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Failed to respond.");
      }
    },
    [respond],
  );

  const isEmpty = !isLoading && pending.length === 0;
  const displayItems = useMemo<PartnerRequestItem[]>(() => {
    if (isLoading && pending.length === 0) {
      return buildRequestSkeletonRows(PARTNER_TABLE_PAGE_SIZE);
    }
    if (isEmpty) return [];
    return pending;
  }, [isEmpty, isLoading, pending]);

  const columns = useMemo<ColumnDef<PartnerRequestItem>[]>(
    () => [
      {
        id: "business",
        accessorFn: (row) => row.senderBusiness?.name ?? "Unknown",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Business" />
        ),
        cell: ({ row }) => {
          const req = row.original;
          if (req.id === "empty-state") return null;
          if (isLoading && req.id.startsWith("skeleton-")) {
            return <Skeleton className="h-4 w-32" />;
          }
          return (
            <span className="font-medium">
              {req.senderBusiness?.name ?? "Unknown"}
            </span>
          );
        },
        enableColumnFilter: true,
        enableSorting: true,
        meta: {
          label: "Business",
          variant: "text" as const,
          placeholder: "Filter by business...",
          maxLength: 255,
        },
      },
      {
        id: "slug",
        accessorFn: (row) => row.senderBusiness?.slug ?? "",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Slug" />
        ),
        cell: ({ row }) => {
          const req = row.original;
          if (req.id === "empty-state") return null;
          if (isLoading && req.id.startsWith("skeleton-")) {
            return <Skeleton className="h-4 w-24" />;
          }
          return (
            <span className="text-muted-foreground text-sm">
              @{req.senderBusiness?.slug ?? "—"}
            </span>
          );
        },
        enableColumnFilter: true,
        meta: {
          label: "Slug",
          variant: "text" as const,
          placeholder: "Filter by slug...",
          maxLength: 255,
        },
      },
      {
        id: "createdAt",
        accessorKey: "createdAt",
        header: ({ column }) => (
          <div className="flex w-full justify-center">
            <DataTableColumnHeader column={column} label="Date" />
          </div>
        ),
        cell: ({ row }) => {
          const req = row.original;
          if (req.id === "empty-state") return null;
          if (isLoading && req.id.startsWith("skeleton-")) {
            return (
              <div className="flex justify-center">
                <Skeleton className="h-4 w-20" />
              </div>
            );
          }
          return (
            <div className="flex justify-center">
              <DateDisplay
                date={req.createdAt}
                className="text-muted-foreground text-sm"
              />
            </div>
          );
        },
        enableSorting: true,
        meta: {
          label: "Date",
          variant: "dateRange" as const,
        },
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => {
          const req = row.original;
          if (req.id === "empty-state") return null;
          if (isLoading && req.id.startsWith("skeleton-")) {
            return (
              <div className="flex justify-end gap-1.5">
                <Skeleton className="h-7 w-16" />
                <Skeleton className="h-7 w-16" />
                <Skeleton className="h-7 w-20" />
              </div>
            );
          }
          return (
            <div className="flex flex-nowrap justify-end gap-1.5">
              <Button
                size="sm"
                className="h-7 shrink-0 rounded px-2 text-xs"
                onClick={() => handleAction(req.id, "accept")}
                disabled={respond.isPending}
                icon={<Check className="h-3 w-3" />}
              >
                Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 shrink-0 rounded px-2 text-xs"
                onClick={() => handleAction(req.id, "reject")}
                disabled={respond.isPending}
                icon={<X className="h-3 w-3" />}
              >
                Reject
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="h-7 shrink-0 rounded px-2 text-xs"
                onClick={() => handleAction(req.id, "permanently_reject")}
                disabled={respond.isPending}
                icon={<Trash2 className="h-3 w-3" />}
              >
                Permanent
              </Button>
            </div>
          );
        },
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [handleAction, isLoading, respond.isPending],
  );

  const pageCount = Math.max(
    1,
    Math.ceil(displayItems.length / PARTNER_TABLE_PAGE_SIZE),
  );

  const { table } = useDataTable({
    data: displayItems,
    columns,
    pageCount,
    initialState: {
      pagination: { pageIndex: 0, pageSize: PARTNER_TABLE_PAGE_SIZE },
      sorting: [{ id: "createdAt", desc: true }],
      columnPinning: { right: ["actions"] },
    },
    prefix: "partnerIncoming",
    manualPagination: false,
    manualSorting: false,
    manualFiltering: false,
  });

  return (
    <SettingsSection
      title="Incoming"
      description="Partnership requests sent to you by other businesses."
      contentClassName="flex flex-col gap-2 px-1 pb-1"
    >
      <DataTable
        table={table}
        renderEmpty={() => (
          <Empty className="py-12">
            <EmptyHeader>
              <EmptyTitle>No pending requests</EmptyTitle>
              <EmptyDescription>
                When someone sends a request, it will show up here.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      >
        <DataTableToolbar table={table} maxTextFilters={2} />
      </DataTable>
    </SettingsSection>
  );
}

// ---------------------------------------------------------------------------
// Sent requests
// ---------------------------------------------------------------------------
function SentRequests() {
  const { data, isLoading } = usePartnerRequests("outgoing");
  const items = useMemo(() => data?.items ?? [], [data?.items]);
  const isEmpty = !isLoading && items.length === 0;
  const displayItems = useMemo<PartnerRequestItem[]>(() => {
    if (isLoading && items.length === 0) {
      return buildRequestSkeletonRows(PARTNER_TABLE_PAGE_SIZE);
    }
    if (isEmpty) return [];
    return items;
  }, [isEmpty, isLoading, items]);

  const columns = useMemo<ColumnDef<PartnerRequestItem>[]>(
    () => [
      {
        id: "business",
        accessorFn: (row) => row.receiverBusiness?.name ?? "Unknown",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Business" />
        ),
        cell: ({ row }) => {
          const req = row.original;
          if (req.id === "empty-state") return null;
          if (isLoading && req.id.startsWith("skeleton-")) {
            return <Skeleton className="h-4 w-32" />;
          }
          return (
            <span className="font-medium">
              {req.receiverBusiness?.name ?? "Unknown"}
            </span>
          );
        },
        enableColumnFilter: true,
        enableSorting: true,
        meta: {
          label: "Business",
          variant: "text" as const,
          placeholder: "Filter by business...",
          maxLength: 255,
        },
      },
      {
        id: "slug",
        accessorFn: (row) => row.receiverBusiness?.slug ?? "",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Slug" />
        ),
        cell: ({ row }) => {
          const req = row.original;
          if (req.id === "empty-state") return null;
          if (isLoading && req.id.startsWith("skeleton-")) {
            return <Skeleton className="h-4 w-24" />;
          }
          return (
            <span className="text-muted-foreground text-sm">
              @{req.receiverBusiness?.slug ?? "—"}
            </span>
          );
        },
        enableColumnFilter: true,
        meta: {
          label: "Slug",
          variant: "text" as const,
          placeholder: "Filter by slug...",
          maxLength: 255,
        },
      },
      {
        id: "createdAt",
        accessorKey: "createdAt",
        header: ({ column }) => (
          <div className="flex w-full justify-center">
            <DataTableColumnHeader column={column} label="Date" />
          </div>
        ),
        cell: ({ row }) => {
          const req = row.original;
          if (req.id === "empty-state") return null;
          if (isLoading && req.id.startsWith("skeleton-")) {
            return (
              <div className="flex justify-center">
                <Skeleton className="h-4 w-20" />
              </div>
            );
          }
          return (
            <div className="flex justify-center">
              <DateDisplay
                date={req.createdAt}
                className="text-muted-foreground text-sm"
              />
            </div>
          );
        },
        enableSorting: true,
        meta: {
          label: "Date",
          variant: "dateRange" as const,
        },
      },
      {
        id: "status",
        accessorKey: "status",
        header: ({ column }) => (
          <div className="flex w-full justify-end">
            <DataTableColumnHeader column={column} label="Status" />
          </div>
        ),
        cell: ({ row }) => {
          const req = row.original;
          if (req.id === "empty-state") return null;
          if (isLoading && req.id.startsWith("skeleton-")) {
            return (
              <div className="flex justify-end">
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>
            );
          }

          switch (req.status) {
            case "PENDING":
              return (
                <div className="flex justify-end">
                  <Badge
                    variant="secondary"
                    className="rounded-full font-medium"
                  >
                    Pending
                  </Badge>
                </div>
              );
            case "ACCEPTED":
              return (
                <div className="flex justify-end">
                  <Badge variant="default" className="rounded-full font-medium">
                    Accepted
                  </Badge>
                </div>
              );
            case "REJECTED":
              return (
                <div className="flex justify-end">
                  <Badge variant="outline" className="rounded-full">
                    Rejected
                  </Badge>
                </div>
              );
            case "PERMANENTLY_REJECTED":
              return (
                <div className="flex justify-end">
                  <Badge
                    variant="destructive"
                    className="rounded-full font-medium"
                  >
                    Permanently rejected
                  </Badge>
                </div>
              );
            default:
              return (
                <div className="flex justify-end">
                  <Badge variant="outline" className="rounded-full">
                    {formatStatusLabel(req.status)}
                  </Badge>
                </div>
              );
          }
        },
        enableSorting: true,
      },
    ],
    [isLoading],
  );

  const pageCount = Math.max(
    1,
    Math.ceil(displayItems.length / PARTNER_TABLE_PAGE_SIZE),
  );

  const { table } = useDataTable({
    data: displayItems,
    columns,
    pageCount,
    initialState: {
      pagination: { pageIndex: 0, pageSize: PARTNER_TABLE_PAGE_SIZE },
      sorting: [{ id: "createdAt", desc: true }],
    },
    prefix: "partnerSent",
    manualPagination: false,
    manualSorting: false,
    manualFiltering: false,
  });

  return (
    <SettingsSection
      title="Sent"
      description="Partnership requests you have sent."
      contentClassName="flex flex-col gap-2 px-1 pb-1"
    >
      <DataTable
        table={table}
        renderEmpty={() => (
          <Empty className="py-12">
            <EmptyHeader>
              <EmptyTitle>No sent requests</EmptyTitle>
              <EmptyDescription>
                Requests you send will appear here.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      >
        <DataTableToolbar table={table} maxTextFilters={2} />
      </DataTable>
    </SettingsSection>
  );
}

// ---------------------------------------------------------------------------
// Permanently rejected
// ---------------------------------------------------------------------------
function PermanentlyRejected() {
  const { data, isLoading } = usePartnerRequests("incoming");
  const unReject = useUnPermanentReject();
  const sendRequest = useSendPartnerRequest();
  const permanentlyRejected = useMemo(
    () => data?.items.filter((r) => r.status === "PERMANENTLY_REJECTED") ?? [],
    [data?.items],
  );

  if (isLoading || permanentlyRejected.length === 0) return null;

  const handleMoveToRejected = async (id: string) => {
    try {
      await unReject.mutateAsync(id);
      toast.success("Moved to rejected.");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to update.");
    }
  };

  const handleSendFromYourSide = async (req: PartnerRequestItem) => {
    const targetSlug = req.senderBusiness?.slug;
    if (!targetSlug) return;
    try {
      await sendRequest.mutateAsync({ targetBusinessSlug: targetSlug });
      toast.success("Request sent from your side.");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to send request.");
    }
  };

  return (
    <SettingsSection
      title="Permanently rejected"
      description="They cannot re-request until you move them back or send a request from your side."
    >
      <RejectedRequestsTable
        items={permanentlyRejected}
        unRejectPending={unReject.isPending}
        sendRequestPending={sendRequest.isPending}
        onMoveToRejected={handleMoveToRejected}
        onSendFromYourSide={handleSendFromYourSide}
      />
    </SettingsSection>
  );
}

function RejectedRequestsTable({
  items,
  unRejectPending,
  sendRequestPending,
  onMoveToRejected,
  onSendFromYourSide,
}: {
  items: PartnerRequestItem[];
  unRejectPending: boolean;
  sendRequestPending: boolean;
  onMoveToRejected: (id: string) => Promise<void>;
  onSendFromYourSide: (item: PartnerRequestItem) => Promise<void>;
}) {
  const columns = useMemo<ColumnDef<PartnerRequestItem>[]>(
    () => [
      {
        id: "business",
        accessorFn: (row) => row.senderBusiness?.name ?? "Unknown",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Business" />
        ),
        cell: ({ row }) => (
          <span className="font-medium">
            {row.original.senderBusiness?.name ?? "Unknown"}
          </span>
        ),
        enableColumnFilter: true,
        enableSorting: true,
        meta: {
          label: "Business",
          variant: "text" as const,
          placeholder: "Filter by business...",
          maxLength: 255,
        },
      },
      {
        id: "slug",
        accessorFn: (row) => row.senderBusiness?.slug ?? "",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Slug" />
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm">
            @{row.original.senderBusiness?.slug ?? "—"}
          </span>
        ),
        enableColumnFilter: true,
        meta: {
          label: "Slug",
          variant: "text" as const,
          placeholder: "Filter by slug...",
          maxLength: 255,
        },
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <div className="flex flex-nowrap justify-end gap-1.5">
            <Button
              size="sm"
              variant="outline"
              className="h-7 shrink-0 rounded px-2 text-xs"
              onClick={() => void onMoveToRejected(row.original.id)}
              disabled={unRejectPending}
              icon={<Undo2 className="h-3 w-3" />}
            >
              Move to rejected
            </Button>
            <Button
              size="sm"
              className="h-7 shrink-0 rounded px-2 text-xs"
              onClick={() => void onSendFromYourSide(row.original)}
              disabled={sendRequestPending}
              icon={<ArrowRight className="h-3 w-3" />}
            >
              Send from your side
            </Button>
          </div>
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [onMoveToRejected, onSendFromYourSide, sendRequestPending, unRejectPending],
  );

  const pageCount = Math.max(
    1,
    Math.ceil(items.length / PARTNER_TABLE_PAGE_SIZE),
  );

  const { table } = useDataTable({
    data: items,
    columns,
    pageCount,
    initialState: {
      pagination: { pageIndex: 0, pageSize: PARTNER_TABLE_PAGE_SIZE },
      sorting: [{ id: "createdAt", desc: true }],
      columnPinning: { right: ["actions"] },
    },
    prefix: "partnerRejected",
    manualPagination: false,
    manualSorting: false,
    manualFiltering: false,
  });

  return (
    <DataTable table={table}>
      <DataTableToolbar table={table} maxTextFilters={2} />
    </DataTable>
  );
}

// ---------------------------------------------------------------------------
// Partner block: embedded = inline form (no card); else SettingsFieldGroup + footerActions
// ---------------------------------------------------------------------------
function PartnershipBlock({
  partnership,
  myBusinessId,
  embedded = false,
}: {
  partnership: Partnership;
  myBusinessId: string;
  embedded?: boolean;
}) {
  const myMember = partnership.members.find(
    (m) => m.businessId === myBusinessId,
  );
  const partnerMember = partnership.members.find(
    (m) => m.businessId !== myBusinessId,
  );

  const update = useUpdatePartnership(partnership.id);
  const dissolve = useDissolvePartnership();
  const [confirmDissolve, setConfirmDissolve] = useState(false);

  const myLoyaltyType = myMember?.business.loyalty?.loyaltyType;
  const showPointRate =
    myLoyaltyType === "AMOUNT_SPENT" || myLoyaltyType === "VISIT_MADE";
  const partnerRateNum = partnerMember?.exchangeRate ?? 1;
  const partnerBusinessName = partnerMember?.business.name ?? PARTNER_LABEL;
  const slug = partnerMember?.business.slug ?? "";
  const sinceDate = new Date(partnership.createdAt).toLocaleDateString();

  const fields = useMemo(() => {
    const base = [
      {
        name: "exchangeRate",
        label: "Your rate",
        type: "number" as const,
        min: 0.01,
        step: "0.01",
      },
      ...(showPointRate
        ? [
            {
              name: "pointToCurrencyRate",
              label: "Point to currency rate",
              type: "number" as const,
              optional: true,
              min: 0.001,
              step: "0.001",
            },
          ]
        : []),
      {
        name: "partnerRate",
        label: "Partner's rate",
        disabled: true,
      },
      {
        name: "sharedReferrals",
        label: "Shared referrals",
        type: "checkbox" as const,
        checkboxLabel:
          "New customers from either referral link join both businesses.",
      },
      {
        name: "shareReferralRewards",
        label: "Share referral rewards",
        type: "checkbox" as const,
        checkboxLabel:
          "Rewards trigger from both programs (doubles cost per referral).",
      },
    ];
    return base;
  }, [showPointRate]);

  const defaultValues = useMemo(
    () => ({
      exchangeRate: String(myMember?.exchangeRate ?? 1),
      pointToCurrencyRate: String(myMember?.pointToCurrencyRate ?? 1),
      partnerRate: String(partnerRateNum),
      sharedReferrals: partnership.sharedReferrals ? "true" : "false",
      shareReferralRewards: partnership.shareReferralRewards ? "true" : "false",
    }),
    [
      myMember?.exchangeRate,
      myMember?.pointToCurrencyRate,
      partnerRateNum,
      partnership.sharedReferrals,
      partnership.shareReferralRewards,
    ],
  );

  const handleSubmit = async (values: Record<string, string>) => {
    try {
      await update.mutateAsync({
        exchangeRate: Number(values.exchangeRate),
        ...(showPointRate &&
          values.pointToCurrencyRate && {
            pointToCurrencyRate: Number(values.pointToCurrencyRate),
          }),
        sharedReferrals: values.sharedReferrals === "true",
        shareReferralRewards: values.shareReferralRewards === "true",
      });
      return { success: true };
    } catch (e: unknown) {
      return {
        success: false,
        error: e instanceof Error ? e.message : "Failed to update.",
      };
    }
  };

  const handleDissolve = async () => {
    try {
      await dissolve.mutateAsync(partnership.id);
      toast.success("Partnership dissolved.");
      setConfirmDissolve(false);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to dissolve.");
    }
  };

  if (partnership.status === "DISSOLVED") {
    return (
      <div className="border-border/60 bg-muted/10 flex items-center justify-between rounded-lg border px-4 py-3 opacity-70">
        <div>
          <p className="font-medium">
            {partnerMember?.business.name ?? "Unknown partner"}
          </p>
          <p className="text-muted-foreground text-xs">
            @{partnerMember?.business.slug} · Dissolved
          </p>
        </div>
      </div>
    );
  }

  const footerActions = useMemo(() => {
    if (confirmDissolve) {
      return [
        {
          label: "Cancel",
          variant: "outline" as const,
          onAction: async () => setConfirmDissolve(false),
        },
        {
          label: "Confirm dissolve",
          variant: "destructive" as const,
          loading: dissolve.isPending,
          onAction: handleDissolve,
        },
      ];
    }
    return [
      {
        label: "Dissolve",
        variant: "destructive" as const,
        onAction: async () => setConfirmDissolve(true),
      },
    ];
  }, [confirmDissolve, dissolve.isPending]);

  if (embedded) {
    return (
      <PartnershipBlockEmbedded
        partnerBusinessName={partnerBusinessName}
        slug={slug}
        sinceDate={sinceDate}
        fields={fields}
        defaultValues={defaultValues}
        handleSubmit={handleSubmit}
        updatePending={update.isPending}
        footerActions={footerActions}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <SettingsFieldGroup
        title={partnerBusinessName}
        description={`@${slug} · Since ${sinceDate}`}
        fields={fields}
        defaultValues={defaultValues}
        onSubmit={handleSubmit}
      />
      {/* Dissolve as separate field */}
      <div className="flex flex-col gap-2 py-2 md:grid md:grid-cols-12">
        <div className="col-span-4 flex flex-col gap-0.5">
          <Label className="text-sm">Dissolve partnership</Label>
          <p className="text-muted-foreground text-xs">
            Permanently end this partnership. This cannot be undone.
          </p>
        </div>
        <div className="col-span-8 flex flex-wrap items-center gap-2">
          {footerActions.map((action, i) => (
            <Button
              key={i}
              type="button"
              variant={action.variant ?? "outline"}
              size="sm"
              disabled={"loading" in action ? action.loading : false}
              loading={"loading" in action ? action.loading : false}
              onClick={() => void action.onAction()}
            >
              {action.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Inline form (no card) for use inside single section
function PartnershipBlockEmbedded({
  partnerBusinessName,
  slug,
  sinceDate,
  fields,
  defaultValues,
  handleSubmit,
  updatePending,
  footerActions,
}: {
  partnerBusinessName: string;
  slug: string;
  sinceDate: string;
  fields: Array<{
    name: string;
    label: string;
    type?: "number" | "checkbox";
    optional?: boolean;
    disabled?: boolean;
    checkboxLabel?: string;
    min?: number;
    step?: string;
  }>;
  defaultValues: Record<string, string>;
  handleSubmit: (v: Record<string, string>) => Promise<{
    success: boolean;
    error?: string;
  }>;
  updatePending: boolean;
  footerActions: Array<{
    label: string;
    variant?: "destructive" | "outline";
    onAction: () => Promise<void>;
    loading?: boolean;
  }>;
}) {
  const schema = useMemo(
    () =>
      z.object(
        fields.reduce(
          (acc, f) => {
            acc[f.name] =
              f.disabled || f.optional
                ? z.string().optional()
                : z.string().min(1, `${f.label} is required`);
            return acc;
          },
          {} as Record<string, z.ZodString | z.ZodOptional<z.ZodString>>,
        ),
      ),
    [fields],
  );

  const form = useForm<Record<string, string | undefined>>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const runSubmit = async () => {
    const valid = await form.trigger();
    if (!valid) throw new Error("Validation failed");
    const values = form.getValues() as Record<string, string>;
    const result = await handleSubmit(values);
    if (result.success) {
      toast.success("Settings updated successfully");
      form.reset(values, { keepDefaultValues: false });
    } else {
      toast.error(result.error || "Failed to update");
      throw new Error(result.error);
    }
  };

  return (
    <div className="flex flex-col gap-y-4 py-4">
      <div>
        <p className="text-foreground text-base leading-none font-semibold">
          {partnerBusinessName}
        </p>
        <p className="text-muted-foreground mt-0.5 text-sm">
          @{slug} · Since {sinceDate}
        </p>
      </div>
      <Form {...form}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void runSubmit();
          }}
          className="flex flex-col gap-y-4"
        >
          {fields.map((field) => (
            <FormField
              key={field.name}
              control={form.control}
              name={field.name}
              render={({ field: formField }) => (
                <FormItem className="flex flex-col gap-2 md:grid md:grid-cols-12">
                  <div className="col-span-4 flex flex-col gap-0.5">
                    <FormLabel className="text-sm">{field.label}</FormLabel>
                    {field.type !== "checkbox" && field.checkboxLabel && (
                      <p className="text-muted-foreground text-xs">
                        {field.checkboxLabel}
                      </p>
                    )}
                  </div>
                  <div className="col-span-8 flex flex-col gap-1">
                    <FormControl>
                      {field.type === "checkbox" ? (
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={formField.value === "true"}
                            onCheckedChange={(v) =>
                              formField.onChange(v ? "true" : "false")
                            }
                            disabled={field.disabled}
                          />
                          {field.checkboxLabel && (
                            <span className="text-muted-foreground text-sm">
                              {field.checkboxLabel}
                            </span>
                          )}
                        </div>
                      ) : (
                        <Input
                          variant="underline"
                          type={field.type === "number" ? "number" : "text"}
                          value={formField.value || ""}
                          onChange={formField.onChange}
                          onBlur={formField.onBlur}
                          disabled={field.disabled}
                          {...(field.type === "number"
                            ? { min: field.min, step: field.step }
                            : {})}
                        />
                      )}
                    </FormControl>
                  </div>
                </FormItem>
              )}
            />
          ))}

          {/* Dissolve as separate field row */}
          <div className="flex flex-col gap-2 md:grid md:grid-cols-12">
            <div className="col-span-4 flex flex-col gap-0.5">
              <Label className="text-sm">Dissolve partnership</Label>
              <p className="text-muted-foreground text-xs">
                Permanently end this partnership. This cannot be undone.
              </p>
            </div>
            <div className="col-span-8 flex flex-wrap items-center gap-2">
              {footerActions.map((action, i) => (
                <Button
                  key={i}
                  type="button"
                  variant={action.variant ?? "outline"}
                  size="sm"
                  disabled={"loading" in action ? action.loading : false}
                  loading={"loading" in action ? action.loading : false}
                  onClick={() => void action.onAction()}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex shrink-0 items-center justify-end border-0 pt-2">
            <SaveButton
              onSave={runSubmit}
              disabled={updatePending || !form.formState.isDirty}
              labels={{
                idle: "Save changes",
                loading: "Saving",
                success: "Saved",
              }}
            />
          </div>
        </form>
      </Form>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
const PAGE_SUBTITLE =
  "Share referrals, run joint campaigns, and let customers redeem loyalty value across partners.";

export function PartnersSettingsPageClient() {
  const { data: businessData } = useCurrentBusiness();
  const myBusinessId: string = businessData?.business?.id ?? "";

  return (
    <DashboardPageShell
      title="Partners"
      subtitle={PAGE_SUBTITLE}
      contentVariant="contained"
    >
      <div className="space-y-6 pb-6">
        {/* Single card: Receive + Send + Active partnerships */}
        <PartnershipSettingsSingleSection myBusinessId={myBusinessId} />

        {/* Incoming + Sent requests */}
        <section className="grid gap-4 xl:grid-cols-2">
          <IncomingRequests />
          <SentRequests />
        </section>

        <PermanentlyRejected />
      </div>
    </DashboardPageShell>
  );
}
