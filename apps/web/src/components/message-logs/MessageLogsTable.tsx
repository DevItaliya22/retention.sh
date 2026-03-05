"use client";

import { EmailLinkButton } from "@/components/common/EmailLinkButton";
import { WhatsAppLinkButton } from "@/components/common/WhatsAppLinkButton";
import {
  useMessageLogsQuery,
  type MessageLogItem,
} from "@/hooks/messaging/useMessageLogsQuery";
import { getDataTableConfig } from "@/lib/utils/data-table-params";
import {
  Badge,
  DataTable,
  DataTableColumnHeader,
  DataTableToolbar,
  DateDisplay,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
  Skeleton,
} from "@reelo/ui/components";
import { useDataTable } from "@reelo/ui/hooks";
import type { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";

const CHANNEL_LABELS: Record<string, string> = {
  EMAIL: "Email",
  WHATSAPP: "WhatsApp",
  SMS: "SMS",
};

const SOURCE_LABELS: Record<string, string> = {
  LOYALTY_OTP: "Loyalty OTP",
  LOYALTY_REMINDER: "Loyalty Reminder",
  LOYALTY_EARN: "Loyalty Earn",
  LOYALTY_EXPIRE: "Loyalty Expire",
  FEEDBACK_LINK: "Feedback Link",
  NEGATIVE_FEEDBACK_ALERT: "Negative Feedback",
  REFERRAL_REMINDER: "Referral Reminder",
  REFERRAL_CLAIM: "Referral Claim",
  MEMBERSHIP_ENROLLMENT: "Membership",
  CAMPAIGN_APPLIED: "Campaign",
  QR_REWARD_EXPIRE: "QR Reward",
};

export function MessageLogsTable() {
  const { data, isLoading, isError, error } = useMessageLogsQuery();

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const perPage = data?.perPage ?? 10;
  const pageCount = Math.max(1, Math.ceil(total / perPage));
  const isEmpty = !isLoading && items.length === 0;

  const displayItems = useMemo(() => {
    if (isLoading && items.length === 0) {
      return Array.from({ length: perPage }, (_, i) => ({
        id: `skeleton-${i}`,
        channel: "EMAIL" as const,
        recipient: "",
        subject: null,
        body: "",
        source: "",
        sourceId: null,
        status: "PENDING",
        createdAt: "",
      })) as MessageLogItem[];
    }
    if (isEmpty) return [] as MessageLogItem[];
    return items;
  }, [items, isLoading, perPage, isEmpty]);

  const columns = useMemo<ColumnDef<MessageLogItem>[]>(
    () => [
      {
        id: "recipient",
        accessorKey: "recipient",
        size: 180,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Recipient" />
        ),
        cell: ({ row }) => {
          const item = row.original;
          if (isLoading && item.id.startsWith("skeleton-")) {
            return <Skeleton className="h-4 w-28" />;
          }
          return (
            <span className="truncate font-mono text-sm">{item.recipient}</span>
          );
        },
      },
      {
        id: "channel",
        accessorKey: "channel",
        size: 120,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Channel" />
        ),
        cell: ({ row }) => {
          const item = row.original;
          if (isLoading && item.id.startsWith("skeleton-")) {
            return <Skeleton className="h-5 w-16" />;
          }
          const label = CHANNEL_LABELS[item.channel] ?? item.channel;
          return (
            <Badge variant="secondary" className="font-normal">
              {label}
            </Badge>
          );
        },
        meta: {
          label: "Channel",
          variant: "select" as const,
          options: [
            { value: "EMAIL", label: "Email" },
            { value: "WHATSAPP", label: "WhatsApp" },
            { value: "SMS", label: "SMS" },
          ],
        },
      },
      {
        id: "subject",
        accessorKey: "subject",
        size: 160,
        header: "Subject",
        cell: ({ row }) => {
          const item = row.original;
          if (isLoading && item.id.startsWith("skeleton-")) {
            return <Skeleton className="h-4 w-20" />;
          }
          return (
            <span className="text-muted-foreground truncate text-sm">
              {item.subject ?? "—"}
            </span>
          );
        },
      },
      {
        id: "body",
        accessorKey: "body",
        size: 220,
        header: "Body",
        cell: ({ row }) => {
          const item = row.original;
          if (isLoading && item.id.startsWith("skeleton-")) {
            return <Skeleton className="h-4 w-32" />;
          }
          const truncated =
            item.body.length > 60 ? `${item.body.slice(0, 60)}…` : item.body;
          return (
            <span className="text-muted-foreground truncate text-sm">
              {truncated}
            </span>
          );
        },
      },
      {
        id: "status",
        accessorKey: "status",
        size: 100,
        header: "Status",
        cell: ({ row }) => {
          const item = row.original;
          if (isLoading && item.id.startsWith("skeleton-")) {
            return <Skeleton className="h-5 w-14" />;
          }
          return (
            <Badge
              variant={
                item.status === "SENT"
                  ? "default"
                  : item.status === "FAILED"
                    ? "destructive"
                    : "outline"
              }
              className="font-normal"
            >
              {item.status}
            </Badge>
          );
        },
      },
      {
        id: "createdAt",
        accessorKey: "createdAt",
        size: 160,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Created" />
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
        meta: {
          label: "Created",
          variant: "dateRange" as const,
        },
      },
      {
        id: "source",
        accessorKey: "source",
        size: 140,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Source" />
        ),
        cell: ({ row }) => {
          const item = row.original;
          if (isLoading && item.id.startsWith("skeleton-")) {
            return <Skeleton className="h-4 w-20" />;
          }
          const label = SOURCE_LABELS[item.source] ?? item.source;
          return <span className="text-sm">{label}</span>;
        },
        meta: {
          label: "Source",
          variant: "text" as const,
          placeholder: "Filter by source...",
        },
      },
      {
        id: "actions",
        size: 100,
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => {
          const item = row.original;
          if (isLoading && item.id.startsWith("skeleton-")) {
            return <Skeleton className="h-8 w-16" />;
          }
          const isEmail = item.channel === "EMAIL";
          const isWhatsApp = item.channel === "WHATSAPP";
          const message = item.subject
            ? `${item.subject}\n\n${item.body}`
            : item.body;

          return (
            <div className="flex justify-end gap-1">
              {isWhatsApp && (
                <WhatsAppLinkButton
                  phoneNumber={item.recipient}
                  message={message}
                  title="Open in WhatsApp"
                />
              )}
              {isEmail && (
                <EmailLinkButton
                  email={item.recipient}
                  subject={item.subject ?? undefined}
                  body={item.body}
                  title="Open in email client"
                />
              )}
              {item.channel === "SMS" && (
                <WhatsAppLinkButton
                  phoneNumber={item.recipient}
                  message={message}
                  title="Open in WhatsApp (fallback)"
                />
              )}
            </div>
          );
        },
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [isLoading],
  );

  const { table } = useDataTable({
    data: displayItems,
    columns,
    pageCount: isLoading && items.length === 0 ? 1 : pageCount,
    shallow: false,
    initialState: {
      pagination: { pageIndex: 0, pageSize: perPage },
      sorting: [{ id: "createdAt", desc: true }],
      columnPinning: { right: ["actions"] },
    },
    prefix: getDataTableConfig("messageLogs").prefix,
  });

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-destructive text-sm font-medium">
          Failed to load message logs
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
            <EmptyTitle>No message logs</EmptyTitle>
            <EmptyDescription>
              Messages will appear here when loyalty, feedback, campaigns, or
              other features trigger notifications
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    >
      <DataTableToolbar table={table} maxTextFilters={1} />
    </DataTable>
  );
}
