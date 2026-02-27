"use client";

import { DashboardPageShell } from "@/components/layouts";
import { useCurrentBusiness } from "@/hooks/business/useCurrentBusiness";
import {
  useCreatePartnerCampaign,
  usePartnerCampaigns,
} from "@/hooks/partnership/usePartnerCampaigns";
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
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DataTable,
  DataTableColumnHeader,
  DataTableToolbar,
  DateDisplay,
  Input,
  Label,
  Skeleton,
  Switch,
} from "@reelo/ui/components";
import { useDataTable } from "@reelo/ui/hooks";
import { cn } from "@reelo/ui/lib/utils";
import type { ColumnDef } from "@tanstack/react-table";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  Handshake,
  Plus,
  Send,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import { useCallback, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";

const MY_BUSINESS_LABEL = "Your business";
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

function SettingsPanel({
  title,
  description,
  children,
  contentClassName,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  contentClassName?: string;
}) {
  return (
    <Card className="bg-sidebar-accent/50 flex min-h-0 flex-col gap-0 rounded-lg border-0 p-2">
      <CardHeader className="mb-3 shrink-0 gap-0 border-0 px-0 pt-0.5 pb-0 pl-3">
        <CardTitle className="text-foreground text-base leading-none font-semibold">
          {title}
        </CardTitle>
        {description ? (
          <CardDescription className="text-muted-foreground mt-0.5 text-sm">
            {description}
          </CardDescription>
        ) : null}
      </CardHeader>
      <Card className="border-border/45 bg-background/55 flex min-h-0 flex-col gap-0 overflow-hidden rounded-lg border">
        <CardContent
          className={cn("min-h-0 overflow-hidden px-4 py-4", contentClassName)}
        >
          {children}
        </CardContent>
      </Card>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// General settings
// ---------------------------------------------------------------------------
function GeneralSettings() {
  const { data, isLoading } = usePartnershipSettings();
  const updateSettings = useUpdatePartnershipSettings();

  if (isLoading) {
    return (
      <SettingsPanel
        title="Receive partnership offers"
        description="When enabled, other businesses can send you partnership requests."
      >
        <div className="space-y-2">
          <Skeleton className="h-4 w-56 rounded-md" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      </SettingsPanel>
    );
  }

  const handleToggle = async (checked: boolean) => {
    try {
      await updateSettings.mutateAsync({ receivePartnershipOffers: checked });
      toast.success("Settings updated.");
    } catch (e: unknown) {
      toast.error(
        e instanceof Error ? e.message : "Failed to update settings.",
      );
    }
  };

  return (
    <SettingsPanel
      title="Receive partnership offers"
      description="When enabled, other businesses can send you partnership requests."
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <Label className="text-sm font-medium">
            Receive partnership offers
          </Label>
          <p className="text-muted-foreground text-xs">
            Allow other businesses to send partnership requests to you.
          </p>
        </div>
        <Switch
          checked={data?.receivePartnershipOffers ?? false}
          onCheckedChange={handleToggle}
          disabled={updateSettings.isPending}
        />
      </div>
    </SettingsPanel>
  );
}

// ---------------------------------------------------------------------------
// Send request
// ---------------------------------------------------------------------------
function SendRequest() {
  const [slug, setSlug] = useState("");
  const sendRequest = useSendPartnerRequest();

  const handleSend = async () => {
    if (!slug.trim()) return;
    try {
      await sendRequest.mutateAsync({ targetBusinessSlug: slug.trim() });
      setSlug("");
      toast.success("Request sent.");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to send request.");
    }
  };

  return (
    <SettingsPanel
      title="Send request"
      description="Enter the partner's business slug to send a partnership request."
      contentClassName="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto] sm:items-end"
    >
      <div className="min-w-0 space-y-1.5">
        <Label className="text-sm font-medium">Business slug</Label>
        <Input
          placeholder="e.g. partner-cafe"
          className="border-border/80 bg-background rounded-lg"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
      </div>
      <Button
        onClick={handleSend}
        disabled={!slug.trim() || sendRequest.isPending}
        className="shrink-0 rounded-lg"
        icon={<Send className="h-4 w-4" />}
      >
        {sendRequest.isPending ? "Sending..." : "Send request"}
      </Button>
    </SettingsPanel>
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
    if (isEmpty) {
      return [
        {
          id: "empty-state",
          senderBusinessId: "",
          receiverBusinessId: "",
          status: "PENDING",
          partnershipId: null,
          senderBusiness: undefined,
          receiverBusiness: undefined,
          createdAt: "",
          updatedAt: "",
        },
      ];
    }
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
    <DataTable
      table={table}
      renderRowFooter={(row) => {
        if (isEmpty && row.original.id === "empty-state") {
          return (
            <div className="flex flex-col items-center justify-center px-4 py-12">
              <p className="text-muted-foreground text-sm font-medium">
                No pending requests
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                When someone sends a request, it will show up here.
              </p>
            </div>
          );
        }
        return null;
      }}
    >
      <div className="space-y-0.5 px-1 pb-1">
        <p className="text-foreground text-base leading-none font-semibold">
          Incoming
        </p>
        <p className="text-muted-foreground text-sm">
          Partnership requests sent to you by other businesses.
        </p>
      </div>
      <DataTableToolbar table={table} maxTextFilters={2} />
    </DataTable>
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
    if (isEmpty) {
      return [
        {
          id: "empty-state",
          senderBusinessId: "",
          receiverBusinessId: "",
          status: "PENDING",
          partnershipId: null,
          senderBusiness: undefined,
          receiverBusiness: undefined,
          createdAt: "",
          updatedAt: "",
        },
      ];
    }
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
    <DataTable
      table={table}
      renderRowFooter={(row) => {
        if (isEmpty && row.original.id === "empty-state") {
          return (
            <div className="flex flex-col items-center justify-center px-4 py-12">
              <p className="text-muted-foreground text-sm font-medium">
                No sent requests
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                Requests you send will appear here.
              </p>
            </div>
          );
        }
        return null;
      }}
    >
      <div className="space-y-0.5 px-1 pb-1">
        <p className="text-foreground text-base leading-none font-semibold">
          Sent
        </p>
        <p className="text-muted-foreground text-sm">
          Partnership requests you have sent.
        </p>
      </div>
      <DataTableToolbar table={table} maxTextFilters={2} />
    </DataTable>
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
    <SettingsPanel
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
    </SettingsPanel>
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
// Single partnership block (no card)
// ---------------------------------------------------------------------------
function PartnershipBlock({
  partnership,
  myBusinessId,
}: {
  partnership: Partnership;
  myBusinessId: string;
}) {
  const myMember = partnership.members.find(
    (m) => m.businessId === myBusinessId,
  );
  const partnerMember = partnership.members.find(
    (m) => m.businessId !== myBusinessId,
  );

  const update = useUpdatePartnership(partnership.id);
  const dissolve = useDissolvePartnership();
  const createCampaign = useCreatePartnerCampaign();

  const [exchangeRate, setExchangeRate] = useState(
    String(myMember?.exchangeRate ?? 1),
  );
  const [pointRate, setPointRate] = useState(
    String(myMember?.pointToCurrencyRate ?? 1),
  );
  const [confirmDissolve, setConfirmDissolve] = useState(false);

  const myLoyaltyType = myMember?.business.loyalty?.loyaltyType;
  const showPointRate =
    myLoyaltyType === "AMOUNT_SPENT" || myLoyaltyType === "VISIT_MADE";

  const myRateNum = Number(exchangeRate) || 1;
  const partnerRateNum = partnerMember?.exchangeRate ?? 1;
  const ratioLabel = `${myRateNum} : ${partnerRateNum}`;

  const myBusinessName = myMember?.business.name ?? MY_BUSINESS_LABEL;
  const partnerBusinessName = partnerMember?.business.name ?? PARTNER_LABEL;

  const handleSaveRates = async () => {
    try {
      await update.mutateAsync({
        exchangeRate: Number(exchangeRate),
        ...(showPointRate && { pointToCurrencyRate: Number(pointRate) }),
      });
      toast.success("Rates updated.");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to update.");
    }
  };

  const handleToggle = async (
    field: "sharedReferrals" | "shareReferralRewards" | "sharedCampaigns",
    value: boolean,
  ) => {
    try {
      await update.mutateAsync({ [field]: value });
      toast.success("Updated.");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to update.");
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

  const handleCreateCampaign = async () => {
    try {
      await createCampaign.mutateAsync({ partnershipId: partnership.id });
      toast.success("Campaign draft created.");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to create.");
    }
  };

  if (partnership.status === "DISSOLVED") {
    return (
      <div className="border-border/60 bg-muted/10 flex items-center justify-between rounded-2xl border px-5 py-4 opacity-70">
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

  return (
    <div className="space-y-5 py-2">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-primary/15 flex h-10 w-10 items-center justify-center rounded-lg">
            <Handshake className="text-primary h-5 w-5" />
          </div>
          <div>
            <p className="text-base font-semibold">{partnerBusinessName}</p>
            <p className="text-muted-foreground text-xs">
              @{partnerMember?.business.slug} · Since{" "}
              {new Date(partnership.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <Badge variant="default" className="rounded-full font-medium">
          Active
        </Badge>
      </div>

      {/* Exchange rates */}
      <div className="space-y-3">
        <p className="text-sm font-semibold">Exchange rates</p>
        <p className="text-muted-foreground text-xs">
          You set your rate; partner sets theirs. Your rate converts your coins
          to their value; theirs converts their coins to yours.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <p className="text-muted-foreground text-xs font-medium">
              Your rate (you set)
            </p>
            <p className="text-sm">
              1 of your coins →{" "}
              <span className="font-mono font-semibold">
                {exchangeRate || "—"}
              </span>{" "}
              at {partnerBusinessName}
            </p>
            <Input
              type="number"
              step="0.01"
              min={0.01}
              className="rounded-lg"
              value={exchangeRate}
              onChange={(e) => setExchangeRate(e.target.value)}
            />
            {showPointRate && (
              <div className="mt-2 space-y-1">
                <Label className="text-xs">Point → currency</Label>
                <Input
                  type="number"
                  step="0.001"
                  min={0.001}
                  className="rounded-lg"
                  value={pointRate}
                  onChange={(e) => setPointRate(e.target.value)}
                />
              </div>
            )}
            <Button
              size="sm"
              className="mt-1 rounded-lg"
              onClick={handleSaveRates}
              disabled={update.isPending}
            >
              {update.isPending ? "Saving…" : "Save your rate"}
            </Button>
          </div>
          <div className="space-y-2">
            <p className="text-muted-foreground text-xs font-medium">
              Partner&apos;s rate (they set)
            </p>
            <p className="text-sm">
              1 of {partnerBusinessName}&apos;s coins →{" "}
              <span className="font-mono font-semibold">{partnerRateNum}</span>{" "}
              at {myBusinessName}
            </p>
            <p className="text-muted-foreground text-xs">
              They set this on their Partners page. Read-only for you.
            </p>
          </div>
        </div>
        <div className="bg-primary/10 flex flex-wrap items-center gap-2 rounded-lg px-3 py-2">
          <span className="text-muted-foreground text-sm">
            Ratio (you → them : them → you)
          </span>
          <span className="text-primary font-mono text-sm font-semibold">
            {ratioLabel}
          </span>
        </div>
      </div>

      {/* Features */}
      <div className="space-y-3">
        <p className="text-sm font-semibold">Features</p>
        <div className="space-y-2">
          <div className="bg-background/60 hover:bg-background/80 flex items-start justify-between gap-4 rounded-lg px-4 py-2.5 transition-colors">
            <div>
              <Label className="text-sm">Shared referrals</Label>
              <p className="text-muted-foreground text-xs">
                New customers from either referral link join both businesses.
              </p>
            </div>
            <Switch
              checked={partnership.sharedReferrals}
              onCheckedChange={(v) => handleToggle("sharedReferrals", v)}
              disabled={update.isPending}
            />
          </div>
          {partnership.sharedReferrals && (
            <div className="bg-background/60 hover:bg-background/80 flex items-start justify-between gap-4 rounded-lg px-4 py-2.5 transition-colors">
              <div>
                <Label className="text-sm">Share referral rewards</Label>
                <p className="text-muted-foreground text-xs">
                  <AlertTriangle className="mr-1 inline h-3.5 w-3.5 text-amber-500" />
                  Rewards trigger from both programs (doubles cost per
                  referral).
                </p>
              </div>
              <Switch
                checked={partnership.shareReferralRewards}
                onCheckedChange={(v) => handleToggle("shareReferralRewards", v)}
                disabled={update.isPending}
              />
            </div>
          )}
          <div className="bg-background/60 hover:bg-background/80 flex items-start justify-between gap-4 rounded-lg px-4 py-2.5 transition-colors">
            <div>
              <Label className="text-sm">Shared campaigns</Label>
              <p className="text-muted-foreground text-xs">
                Joint campaigns visible in both dashboards.
              </p>
            </div>
            <Switch
              checked={partnership.sharedCampaigns}
              onCheckedChange={(v) => handleToggle("sharedCampaigns", v)}
              disabled={update.isPending}
            />
          </div>
        </div>
      </div>

      {partnership.sharedCampaigns && (
        <div className="bg-muted/30 flex flex-wrap items-center justify-between gap-3 rounded-lg px-4 py-2.5">
          <p className="text-muted-foreground text-sm">
            Create a partner campaign for this partnership.
          </p>
          <Button
            size="sm"
            variant="outline"
            className="rounded-lg"
            onClick={handleCreateCampaign}
            disabled={createCampaign.isPending}
            icon={<Plus className="h-3.5 w-3.5" />}
          >
            New campaign
          </Button>
        </div>
      )}

      {/* Dissolve */}
      <div className="bg-muted/30 rounded-lg px-4 py-2.5">
        {confirmDissolve ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-destructive mr-auto text-sm font-medium">
              Are you sure? This can&apos;t be undone easily.
            </span>
            <Button
              size="sm"
              variant="outline"
              className="rounded-lg"
              onClick={() => setConfirmDissolve(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="rounded-lg"
              onClick={handleDissolve}
              disabled={dissolve.isPending}
            >
              Confirm dissolve
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <p className="text-muted-foreground text-sm">
              Dissolve this partnership
            </p>
            <Button
              size="sm"
              variant="destructive"
              className="rounded-lg"
              onClick={() => setConfirmDissolve(true)}
              icon={<Trash2 className="h-3.5 w-3.5" />}
            >
              Dissolve
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Active partnerships
// ---------------------------------------------------------------------------
function ActivePartnerships({ myBusinessId }: { myBusinessId: string }) {
  const { data, isLoading } = usePartnerships();
  const partnerships = data?.items ?? [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  if (partnerships.length === 0) {
    return (
      <div className="flex flex-col items-center py-10 text-center">
        <div className="bg-muted/50 flex h-12 w-12 items-center justify-center rounded-xl">
          <Handshake className="text-muted-foreground/50 h-6 w-6" />
        </div>
        <p className="text-muted-foreground mt-3 text-sm font-semibold">
          No partnerships yet
        </p>
        <p className="text-muted-foreground mt-1 max-w-sm text-xs">
          Send a request to get started. When they accept, you can set exchange
          rates and features here.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-border/30 divide-y">
      {partnerships.map((p) => (
        <PartnershipBlock
          key={p.id}
          partnership={p}
          myBusinessId={myBusinessId}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Partner campaigns list
// ---------------------------------------------------------------------------
function PartnerCampaignsList() {
  const { data, isLoading } = usePartnerCampaigns();
  const items = data?.items ?? [];

  if (isLoading || items.length === 0) return null;

  return (
    <ul className="space-y-2">
      {items.map((c) => (
        <li
          key={c.id}
          className="border-border/60 bg-background/80 hover:bg-muted/30 flex items-center justify-between rounded-xl border px-4 py-3 transition-colors"
        >
          <div>
            <p className="font-medium">{c.title || "Untitled campaign"}</p>
            <p className="text-muted-foreground text-xs">
              {c.createdByBusiness.name} · {formatStatusLabel(c.status)}
            </p>
          </div>
          <Badge
            variant={c.status === "DRAFT" ? "secondary" : "default"}
            className="rounded-full font-medium"
          >
            {formatStatusLabel(c.status)}
          </Badge>
        </li>
      ))}
    </ul>
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
      <div className="space-y-4 pb-6">
        {/* Setup */}
        <section className="grid gap-4 xl:grid-cols-2">
          <div>
            <GeneralSettings />
          </div>
          <SendRequest />
        </section>

        {/* Requests */}
        <section className="grid gap-4 xl:grid-cols-2">
          <IncomingRequests />
          <SentRequests />
        </section>

        <PermanentlyRejected />

        {/* Active partnerships */}
        <section>
          <SettingsPanel
            title="Active partnerships"
            description="Exchange rates and features per partner."
            contentClassName="py-4 sm:p-4"
          >
            <ActivePartnerships myBusinessId={myBusinessId} />
          </SettingsPanel>
        </section>

        <SettingsPanel
          title="Partner campaigns"
          description="Joint campaigns with your partners."
          contentClassName="py-4 sm:p-4"
        >
          <PartnerCampaignsList />
        </SettingsPanel>
      </div>
    </DashboardPageShell>
  );
}
