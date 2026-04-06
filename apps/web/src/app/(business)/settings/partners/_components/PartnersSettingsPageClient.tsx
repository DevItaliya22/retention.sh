"use client";

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
  useAllPartnershipLogs,
  useDissolvePartnership,
  useLockPartnership,
  usePartnerships,
  useRequestUnlock,
  useRespondUnlockRequest,
  useUpdatePartnership,
  type Partnership,
} from "@/hooks/partnership/usePartnerships";
import {
  usePartnershipSettings,
  useUpdatePartnershipSettings,
} from "@/hooks/partnership/usePartnershipSettings";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  DataTable,
  DataTableColumnHeader,
  DateDisplay,
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
import {
  ArrowRight,
  Check,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

const PARTNER_LABEL = "Partner";

function formatStatusLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
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
  const partnerships = (partnershipsData?.items ?? []).filter(
    (p) => p.status !== "DISSOLVED",
  );

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
      <>
        <SettingsSection
          title="Partnership settings"
          description="Control whether other businesses can send you partnership requests."
        >
          <Skeleton className="h-32 w-full" />
        </SettingsSection>
        <SettingsSection
          title="Active partnerships"
          description="Manage your current active partnerships."
        >
          <Skeleton className="h-40 w-full" />
        </SettingsSection>
      </>
    );
  }

  return (
    <>
      <SettingsSection
        title="Partnership settings"
        description="Control whether other businesses can send you partnership requests."
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
                    e instanceof Error
                      ? e.message
                      : "Failed to update settings.",
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
            <Label className="text-sm">Send partnership request</Label>
            <p className="text-muted-foreground text-xs">
              Enter the business slug to invite them as a partner.
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
      </SettingsSection>

      <SettingsSection
        title="Active partnerships"
        description="Manage your current active partnerships and their exchange rates."
        contentClassName="flex flex-col gap-4"
      >
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
              />
            ))}
          </div>
        )}
      </SettingsSection>
    </>
  );
}

// ---------------------------------------------------------------------------
// Unified partnership activity feed
// ---------------------------------------------------------------------------
const ACTIVITY_PAGE_SIZE = 10;

type ActivityRequestItem = {
  kind: "request";
  id: string;
  createdAt: string;
  isPendingIncoming: boolean;
  direction: "incoming" | "outgoing";
  request: PartnerRequestItem;
};

type ActivityEventItem = {
  kind: "event";
  id: string;
  createdAt: string;
  isPendingIncoming: false;
  event: import("@/hooks/partnership/usePartnerships").PartnershipEventLog;
};

type ActivityItem = ActivityRequestItem | ActivityEventItem;

function eventLabel(
  event: import("@/hooks/partnership/usePartnerships").PartnershipEventLog,
  myBusinessId: string,
): string {
  const byMe = event.actorBusinessId === myBusinessId;
  const actor = byMe ? "You" : event.actorBusiness.name;
  switch (event.event) {
    case "PARTNERSHIP_DISSOLVED":
      return `${actor} dissolved the partnership`;
    case "SETTINGS_LOCKED":
      return `${actor} locked partnership settings`;
    case "SETTINGS_UNLOCK_REQUESTED":
      return `${actor} requested to unlock settings`;
    case "SETTINGS_UNLOCK_ACCEPTED":
      return `${actor} accepted the unlock request`;
    case "SETTINGS_UNLOCK_REJECTED":
      return `${actor} rejected the unlock request`;
    case "SETTINGS_UPDATED":
      return `${actor} updated partnership settings`;
    case "REQUEST_ACCEPTED":
      return `${actor} accepted the partnership request`;
    case "REQUEST_REJECTED":
      return `${actor} rejected the partnership request`;
    case "REQUEST_PERMANENTLY_REJECTED":
      return `${actor} permanently rejected the request`;
    case "REQUEST_UN_PERMANENTLY_REJECTED":
      return `${actor} moved a request back to rejected`;
    case "REQUEST_SENT":
      return `${actor} sent a partnership request`;
    default:
      return `${actor} — ${String(event.event).toLowerCase().replace(/_/g, " ")}`;
  }
}

function PartnershipActivity({ myBusinessId }: { myBusinessId: string }) {
  const { data: incomingData, isLoading: loadingIn } =
    usePartnerRequests("incoming");
  const { data: outgoingData, isLoading: loadingOut } =
    usePartnerRequests("outgoing");
  const { data: logsData, isLoading: loadingLogs } = useAllPartnershipLogs();

  const respond = useRespondPartnerRequest();
  const unReject = useUnPermanentReject();
  const sendRequest = useSendPartnerRequest();

  const isLoading = loadingIn || loadingOut || loadingLogs;

  const handleRespond = useCallback(
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

  const handleUnReject = useCallback(
    async (id: string) => {
      try {
        await unReject.mutateAsync(id);
        toast.success("Moved to rejected.");
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Failed to update.");
      }
    },
    [unReject],
  );

  const handleSendFromYourSide = useCallback(
    async (req: PartnerRequestItem) => {
      const targetSlug = req.senderBusiness?.slug;
      if (!targetSlug) return;
      try {
        await sendRequest.mutateAsync({ targetBusinessSlug: targetSlug });
        toast.success("Request sent from your side.");
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Failed to send request.");
      }
    },
    [sendRequest],
  );

  const allItems = useMemo<ActivityItem[]>(() => {
    const items: ActivityItem[] = [];

    for (const req of incomingData?.items ?? []) {
      items.push({
        kind: "request",
        id: `req-in-${req.id}`,
        createdAt: req.createdAt,
        isPendingIncoming: req.status === "PENDING",
        direction: "incoming",
        request: req,
      });
    }

    for (const req of outgoingData?.items ?? []) {
      items.push({
        kind: "request",
        id: `req-out-${req.id}`,
        createdAt: req.createdAt,
        isPendingIncoming: false,
        direction: "outgoing",
        request: req,
      });
    }

    for (const log of logsData?.items ?? []) {
      const eventKey = String(log.event);
      if (eventKey.startsWith("REQUEST_")) {
        continue;
      }
      items.push({
        kind: "event",
        id: `log-${log.id}`,
        createdAt: log.createdAt,
        isPendingIncoming: false,
        event: log,
      });
    }

    return items.sort((a, b) => {
      if (a.isPendingIncoming && !b.isPendingIncoming) return -1;
      if (!a.isPendingIncoming && b.isPendingIncoming) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [incomingData, outgoingData, logsData]);

  const skeletonCount =
    isLoading && allItems.length === 0 ? ACTIVITY_PAGE_SIZE : 0;

  type ActivityTone = "success" | "danger" | "warning" | "neutral";

  type ActivityRow = {
    id: string;
    kind: ActivityItem["kind"];
    createdAt: string;
    descriptionTitle: string;
    descriptionSubtitle?: string;
    statusLabel: string;
    tone: ActivityTone;
    request?: PartnerRequestItem;
    direction?: "incoming" | "outgoing";
  };

  const isEmpty = !isLoading && allItems.length === 0;

  const displayRows = useMemo<ActivityRow[]>(() => {
    if (skeletonCount > 0) {
      return Array.from({ length: skeletonCount }, (_, i) => ({
        id: `skeleton-${i}`,
        kind: "event" as const,
        createdAt: "",
        descriptionTitle: "",
        statusLabel: "",
        tone: "neutral" as const,
      }));
    }

    if (isEmpty) return [];

    return allItems.map((item) => {
      if (item.kind === "event") {
        const eventType = String(item.event.event);
        let tone: ActivityTone = "neutral";
        if (eventType.includes("DISSOLVED") || eventType.includes("REJECTED")) {
          tone = "danger";
        } else if (eventType.includes("ACCEPTED")) {
          tone = "success";
        } else if (
          eventType.includes("LOCKED") ||
          eventType.includes("UNLOCK_REQUESTED")
        ) {
          tone = "warning";
        }

        return {
          id: item.id,
          kind: "event",
          createdAt: item.createdAt,
          descriptionTitle: eventLabel(item.event, myBusinessId),
          statusLabel: formatStatusLabel(eventType),
          tone,
        };
      }

      const req = item.request;
      const otherBusiness =
        item.direction === "incoming"
          ? req.senderBusiness
          : req.receiverBusiness;
      const businessName = otherBusiness?.name ?? "Unknown";

      const statusLabelMap: Record<string, string> = {
        PENDING: "Pending",
        ACCEPTED: "Accepted",
        REJECTED: "Rejected",
        PERMANENTLY_REJECTED: "Permanently rejected",
      };
      const statusLabel =
        statusLabelMap[req.status] ?? formatStatusLabel(req.status);

      let tone: ActivityTone = "neutral";
      if (req.status === "ACCEPTED") tone = "success";
      else if (
        req.status === "REJECTED" ||
        req.status === "PERMANENTLY_REJECTED"
      )
        tone = "danger";
      else if (req.status === "PENDING") tone = "warning";

      const subtitle =
        item.direction === "incoming"
          ? req.status === "PENDING"
            ? "Sent you a partnership request"
            : req.status === "ACCEPTED"
              ? "Partnership accepted"
              : req.status === "REJECTED"
                ? "Request rejected"
                : "Permanently rejected your request"
          : req.status === "PENDING"
            ? "You sent a partnership request"
            : req.status === "ACCEPTED"
              ? "Partnership accepted"
              : `Request ${formatStatusLabel(req.status).toLowerCase()}`;

      return {
        id: item.id,
        kind: "request",
        createdAt: item.createdAt,
        descriptionTitle: businessName,
        descriptionSubtitle: subtitle,
        statusLabel,
        tone,
        request: req,
        direction: item.direction,
      };
    });
  }, [allItems, isEmpty, myBusinessId, skeletonCount]);

  const columns = useMemo<ColumnDef<ActivityRow>[]>(
    () => [
      {
        id: "description",
        accessorKey: "descriptionTitle",
        enableHiding: false,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Description" />
        ),
        cell: ({ row }) => {
          const item = row.original;
          if (isLoading && item.id.startsWith("skeleton-")) {
            return (
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-64" />
                <Skeleton className="h-3 w-40" />
              </div>
            );
          }

          return (
            <div className="flex flex-col gap-0.5">
              <span className="text-foreground text-sm font-medium">
                {item.descriptionTitle}
              </span>
              {item.descriptionSubtitle && (
                <span className="text-muted-foreground text-xs">
                  {item.descriptionSubtitle}
                </span>
              )}
            </div>
          );
        },
        enableSorting: false,
      },
      {
        id: "createdAt",
        accessorKey: "createdAt",
        enableHiding: false,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Date" />
        ),
        cell: ({ row }) => {
          const item = row.original;
          if (isLoading && item.id.startsWith("skeleton-")) {
            return <Skeleton className="h-4 w-24" />;
          }
          return (
            <DateDisplay
              date={item.createdAt}
              className="text-muted-foreground text-sm"
            />
          );
        },
        enableSorting: false,
      },
      {
        id: "status",
        accessorKey: "statusLabel",
        enableHiding: false,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Status / Actions" />
        ),
        cell: ({ row }) => {
          const item = row.original;

          if (isLoading && item.id.startsWith("skeleton-")) {
            return <Skeleton className="h-5 w-24" />;
          }

          if (
            item.kind === "request" &&
            item.request &&
            item.direction === "incoming" &&
            item.request.status === "PENDING"
          ) {
            return (
              <div className="flex flex-wrap items-center justify-end gap-1.5">
                <Button
                  size="sm"
                  className="h-7 rounded px-2 text-xs"
                  onClick={() => void handleRespond(item.request!.id, "accept")}
                  disabled={respond.isPending}
                  icon={<Check className="h-3 w-3" />}
                >
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 rounded px-2 text-xs"
                  onClick={() => void handleRespond(item.request!.id, "reject")}
                  disabled={respond.isPending}
                  icon={<X className="h-3 w-3" />}
                >
                  Reject
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-7 rounded px-2 text-xs"
                  onClick={() =>
                    void handleRespond(item.request!.id, "permanently_reject")
                  }
                  disabled={respond.isPending}
                  icon={<Trash2 className="h-3 w-3" />}
                >
                  Permanent
                </Button>
              </div>
            );
          }

          if (
            item.kind === "request" &&
            item.request &&
            item.direction === "incoming" &&
            item.request.status === "PERMANENTLY_REJECTED"
          ) {
            return (
              <div className="flex flex-wrap items-center justify-end gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 rounded px-2 text-xs"
                  onClick={() => void handleUnReject(item.request!.id)}
                  disabled={unReject.isPending}
                  icon={<Undo2 className="h-3 w-3" />}
                >
                  Move to rejected
                </Button>
                <Button
                  size="sm"
                  className="h-7 rounded px-2 text-xs"
                  onClick={() => void handleSendFromYourSide(item.request!)}
                  disabled={sendRequest.isPending}
                  icon={<ArrowRight className="h-3 w-3" />}
                >
                  Send from your side
                </Button>
              </div>
            );
          }

          let textColor = "text-muted-foreground";
          if (item.tone === "success") textColor = "text-emerald-700";
          else if (item.tone === "danger") textColor = "text-red-700";
          else if (item.tone === "warning") textColor = "text-amber-700";

          return (
            <div className="flex items-center justify-end">
              <span className={`${textColor} text-xs font-medium`}>
                {item.statusLabel}
              </span>
            </div>
          );
        },
        enableSorting: false,
      },
    ],
    [
      handleRespond,
      handleSendFromYourSide,
      handleUnReject,
      isLoading,
      respond.isPending,
      sendRequest.isPending,
      unReject.isPending,
    ],
  );

  const pageCount = Math.max(
    1,
    Math.ceil(displayRows.length / ACTIVITY_PAGE_SIZE),
  );

  const { table } = useDataTable<ActivityRow>({
    data: displayRows,
    columns,
    pageCount,
    manualPagination: false,
    manualSorting: false,
    manualFiltering: false,
    disableUrlSync: true,
    initialState: {
      pagination: { pageIndex: 0, pageSize: ACTIVITY_PAGE_SIZE },
    },
  });

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <h2 className="text-base leading-none font-semibold tracking-tight">
          Activity
        </h2>
        <p className="text-muted-foreground text-sm">
          Partnership requests, events, and history.
        </p>
      </div>
      <DataTable
        table={table}
        getRowId={(row) => row.id}
        getRowClassName={(row) => {
          const tone = row.original.tone;
          if (tone === "success")
            return "bg-emerald-50 hover:bg-emerald-100/80";
          if (tone === "danger") return "bg-red-50 hover:bg-red-100/80";
          if (tone === "warning") return "bg-amber-50 hover:bg-amber-100/80";
          return "";
        }}
        renderEmpty={() => (
          <div className="text-muted-foreground flex items-center justify-center py-10 text-sm">
            No activity yet.
          </div>
        )}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Partner block: inline form inside the active partnerships section
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
  const lockSettings = useLockPartnership(partnership.id);
  const requestUnlock = useRequestUnlock(partnership.id);
  const respondUnlock = useRespondUnlockRequest(partnership.id);
  const [confirmDissolve, setConfirmDissolve] = useState(false);

  const isLocked = partnership.settingsLocked;
  const iLockedIt = partnership.settingsLockedByBusinessId === myBusinessId;
  const iRequestedUnlock =
    partnership.unlockRequestByBusinessId === myBusinessId;
  const partnerRequestedUnlock =
    !!partnership.unlockRequestByBusinessId &&
    partnership.unlockRequestByBusinessId !== myBusinessId;

  const handleLock = async () => {
    try {
      await lockSettings.mutateAsync();
      toast.success("Settings locked.");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to lock.");
    }
  };

  const handleRequestUnlock = async () => {
    try {
      await requestUnlock.mutateAsync();
      toast.success("Unlock request sent to your partner.");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to request unlock.");
    }
  };

  const handleRespondUnlock = async (action: "accept" | "reject") => {
    try {
      await respondUnlock.mutateAsync(action);
      toast.success(
        action === "accept" ? "Settings unlocked." : "Unlock request rejected.",
      );
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to respond.");
    }
  };

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
        name: "partnerName",
        label: "Partner name",
        disabled: true,
      },
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
        type: "switch" as const,
        description:
          "New customers from either referral link join both businesses.",
      },
      {
        name: "shareReferralRewards",
        label: "Share referral rewards",
        type: "switch" as const,
        description:
          "Rewards trigger from both programs (doubles cost per referral).",
        dependsOn: "sharedReferrals",
      },
    ];
    return base;
  }, [showPointRate]);

  const defaultValues = useMemo(
    () => ({
      partnerName: partnerBusinessName,
      exchangeRate: String(myMember?.exchangeRate ?? 1),
      pointToCurrencyRate: String(myMember?.pointToCurrencyRate ?? 1),
      partnerRate: String(partnerRateNum),
      sharedReferrals: partnership.sharedReferrals ? "true" : "false",
      shareReferralRewards: partnership.shareReferralRewards ? "true" : "false",
    }),
    [
      partnerBusinessName,
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

  return (
    <PartnershipBlockEmbedded
      partnerBusinessName={partnerBusinessName}
      fields={fields}
      defaultValues={defaultValues}
      handleSubmit={handleSubmit}
      updatePending={update.isPending}
      footerActions={footerActions}
      isLocked={isLocked}
      iLockedIt={iLockedIt}
      iRequestedUnlock={iRequestedUnlock}
      partnerRequestedUnlock={partnerRequestedUnlock}
      lockPending={lockSettings.isPending}
      requestUnlockPending={requestUnlock.isPending}
      respondUnlockPending={respondUnlock.isPending}
      onLock={handleLock}
      onRequestUnlock={handleRequestUnlock}
      onRespondUnlock={handleRespondUnlock}
    />
  );
}

// Inline form (no card) for use inside single section
function PartnershipBlockEmbedded({
  partnerBusinessName,
  fields,
  defaultValues,
  handleSubmit,
  updatePending,
  footerActions,
  isLocked,
  iLockedIt,
  iRequestedUnlock,
  partnerRequestedUnlock,
  lockPending,
  requestUnlockPending,
  respondUnlockPending,
  onLock,
  onRequestUnlock,
  onRespondUnlock,
}: {
  partnerBusinessName: string;
  fields: Array<{
    name: string;
    label: string;
    type?: "number" | "switch";
    optional?: boolean;
    disabled?: boolean;
    description?: string;
    dependsOn?: string;
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
  isLocked: boolean;
  iLockedIt: boolean;
  iRequestedUnlock: boolean;
  partnerRequestedUnlock: boolean;
  lockPending: boolean;
  requestUnlockPending: boolean;
  respondUnlockPending: boolean;
  onLock: () => Promise<void>;
  onRequestUnlock: () => Promise<void>;
  onRespondUnlock: (action: "accept" | "reject") => Promise<void>;
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

  const sharedReferralsValue = form.watch("sharedReferrals");

  useEffect(() => {
    if (sharedReferralsValue !== "true") {
      form.setValue("shareReferralRewards", "false");
    }
  }, [sharedReferralsValue, form]);

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
    <div className="flex flex-col gap-y-3 py-2">
      <Form {...form}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void runSubmit();
          }}
          className="flex flex-col gap-y-3"
        >
          {fields.map((field) => {
            const dependencyUnmet =
              field.dependsOn === "sharedReferrals"
                ? sharedReferralsValue !== "true"
                : false;
            const isDisabled = field.disabled || isLocked || dependencyUnmet;

            return (
              <FormField
                key={field.name}
                control={form.control}
                name={field.name}
                render={({ field: formField }) => (
                  <FormItem className="flex flex-col gap-2 md:grid md:grid-cols-12">
                    <div className="col-span-4 flex flex-col gap-0.5">
                      <FormLabel
                        className={
                          isDisabled
                            ? "text-muted-foreground text-sm"
                            : "text-sm"
                        }
                      >
                        {field.label}
                      </FormLabel>
                      {field.description && (
                        <p className="text-muted-foreground text-xs">
                          {field.description}
                        </p>
                      )}
                    </div>
                    <div className="col-span-8 flex items-center">
                      <FormControl>
                        {field.type === "switch" ? (
                          <Switch
                            checked={formField.value === "true"}
                            onCheckedChange={(v) =>
                              formField.onChange(v ? "true" : "false")
                            }
                            disabled={isDisabled}
                          />
                        ) : (
                          <Input
                            variant="underline"
                            type={field.type === "number" ? "number" : "text"}
                            value={formField.value || ""}
                            onChange={formField.onChange}
                            onBlur={formField.onBlur}
                            disabled={isDisabled}
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
            );
          })}

          {/* Lock settings row */}
          <div className="flex flex-col gap-2 md:grid md:grid-cols-12">
            <div className="col-span-4 flex flex-col gap-0.5">
              <Label className="text-sm">Lock settings</Label>
              <p className="text-muted-foreground text-xs">
                {isLocked
                  ? "Settings are locked. An unlock request must be accepted by your partner to make changes."
                  : "Lock rates and referral settings so neither partner can change them without mutual agreement."}
              </p>
            </div>
            <div className="col-span-8 flex flex-wrap items-center gap-2">
              {!isLocked && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={lockPending}
                  loading={lockPending}
                  icon={<LockIcon className="h-3.5 w-3.5" />}
                  onClick={() => void onLock()}
                >
                  Lock settings
                </Button>
              )}
              {isLocked && !iRequestedUnlock && !partnerRequestedUnlock && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={requestUnlockPending}
                  loading={requestUnlockPending}
                  icon={<LockOpenIcon className="h-3.5 w-3.5" />}
                  onClick={() => void onRequestUnlock()}
                >
                  Request unlock
                </Button>
              )}
              {isLocked && iRequestedUnlock && (
                <p className="text-muted-foreground text-xs">
                  Unlock request sent — waiting for your partner to accept.
                </p>
              )}
              {isLocked && partnerRequestedUnlock && (
                <>
                  <p className="text-muted-foreground text-xs">
                    Your partner requested to unlock settings.
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    disabled={respondUnlockPending}
                    loading={respondUnlockPending}
                    icon={<Check className="h-3.5 w-3.5" />}
                    onClick={() => void onRespondUnlock("accept")}
                  >
                    Accept
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={respondUnlockPending}
                    icon={<X className="h-3.5 w-3.5" />}
                    onClick={() => void onRespondUnlock("reject")}
                  >
                    Reject
                  </Button>
                </>
              )}
              {isLocked &&
                iLockedIt &&
                !iRequestedUnlock &&
                !partnerRequestedUnlock && (
                  <p className="text-muted-foreground text-xs">
                    You locked these settings.
                  </p>
                )}
            </div>
          </div>

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
              disabled={isLocked || updatePending || !form.formState.isDirty}
              labels={{
                idle: isLocked ? "Settings locked" : "Save changes",
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

const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export function PartnersSettingsPageClient() {
  const { data: businessData } = useCurrentBusiness();
  const myBusinessId: string = businessData?.business?.id ?? "";
  const isHydrated = useSyncExternalStore(
    emptySubscribe,
    getClientSnapshot,
    getServerSnapshot,
  );

  return (
    <DashboardPageShell
      title="Partners"
      subtitle={PAGE_SUBTITLE}
      contentVariant="contained"
    >
      <div className="space-y-6 pb-6">
        {!isHydrated ? (
          <div className="space-y-6">
            <Skeleton className="h-44 w-full rounded-2xl" />
            <Skeleton className="h-80 w-full rounded-2xl" />
          </div>
        ) : (
          <>
            <PartnershipSettingsSingleSection myBusinessId={myBusinessId} />
            <PartnershipActivity myBusinessId={myBusinessId} />
          </>
        )}
      </div>
    </DashboardPageShell>
  );
}
