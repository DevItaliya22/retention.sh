"use client";

import {
  type ReferralStatRow,
  useReferralStatsQuery,
} from "@/hooks/referral/useReferralProgram";
import { useReferralLogsByReferrer } from "@/hooks/referral/useReferralLogs";
import { getDataTableConfig } from "@/lib/utils/data-table-params";
import {
  Badge,
  buttonVariants,
  DataTable,
  DataTableColumnHeader,
  DataTableToolbar,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@reelo/ui/components";
import { useDataTable } from "@reelo/ui/hooks";
import { cn } from "@reelo/ui/lib/utils";
import type { ColumnDef } from "@tanstack/react-table";
import { ChevronDown, ChevronRight, Eye } from "lucide-react";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";

function ReferredCustomersExpandedContent({
  referrerSlugId,
}: {
  referrerSlugId: string;
}) {
  const { data, isLoading, isError } =
    useReferralLogsByReferrer(referrerSlugId);
  const items = data?.items ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-2">
        <Skeleton className="h-4 w-4 shrink animate-pulse" />
        <span className="text-muted-foreground text-sm">Loading referred…</span>
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-destructive text-sm">
        Failed to load referred customers. Try again.
      </p>
    );
  }

  if (items.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No referred customers yet.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-md border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/60 hover:bg-muted/60">
            <TableHead className="w-[180px]">Name</TableHead>
            <TableHead className="w-[140px]">Phone</TableHead>
            <TableHead className="w-[120px]">Status</TableHead>
            <TableHead className="w-[80px] text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((log) => (
            <TableRow key={log.id}>
              <TableCell className="font-medium">
                {log.newCustomerName ?? "—"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {log.newCustomerPhone}
              </TableCell>
              <TableCell>
                {log.becameCustomer ? (
                  <Badge variant="default" size="xs">
                    New customer
                  </Badge>
                ) : (
                  <Badge variant="secondary" size="xs">
                    Pending
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                {log.becameCustomer && log.referredCustomerSlugId ? (
                  <Link
                    href={`/customers/${log.referredCustomerSlugId}`}
                    aria-label={`View customer ${log.newCustomerName ?? log.newCustomerPhone}`}
                    className={cn(
                      buttonVariants({ variant: "ghost", size: "xs" }),
                      "h-8 w-8 p-0",
                    )}
                  >
                    <Eye className="h-4 w-4" />
                  </Link>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function ReferralStatsTable() {
  const { data, isLoading, isError, error } = useReferralStatsQuery();
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleExpanded = useCallback((rowId: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(rowId)) next.delete(rowId);
      else next.add(rowId);
      return next;
    });
  }, []);

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-destructive text-sm font-medium">
          Failed to load referral stats
        </p>
        <p className="text-muted-foreground mt-1 text-sm">
          {error?.message || "Please try again later"}
        </p>
      </div>
    );
  }

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const perPage = data?.perPage ?? 10;
  const pageCount = Math.max(1, Math.ceil(total / perPage));
  const isEmpty = !isLoading && items.length === 0;

  const displayItems = useMemo(() => {
    if (isLoading && items.length === 0) {
      return Array.from({ length: perPage }, (_, i) => ({
        id: `skeleton-${i}`,
        referrerName: "",
        referrerSlugId: "",
        referredCount: 0,
      })) as ReferralStatRow[];
    }
    if (isEmpty) {
      return [
        {
          id: "empty-state",
          referrerName: "",
          referrerSlugId: "",
          referredCount: 0,
        },
      ] as ReferralStatRow[];
    }
    return items;
  }, [items, isLoading, perPage, isEmpty]);

  const columns = useMemo<ColumnDef<ReferralStatRow>[]>(
    () => [
      {
        id: "expand",
        size: 48,
        minSize: 48,
        maxSize: 48,
        header: () => <span className="sr-only">Expand</span>,
        cell: ({ row }) => {
          const item = row.original;
          if (item.id === "empty-state" || item.id.startsWith("skeleton-")) {
            return null;
          }
          const rowId = item.id;
          const isExpanded = expandedRows.has(rowId);
          return (
            <button
              type="button"
              onClick={() => toggleExpanded(rowId)}
              aria-expanded={isExpanded}
              aria-label={isExpanded ? "Collapse row" : "Expand row"}
              className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          );
        },
        enableSorting: false,
        enableHiding: false,
      },
      {
        id: "referrerName",
        accessorKey: "referrerName",
        size: 250,
        minSize: 200,
        maxSize: 350,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Referrer" />
        ),
        cell: ({ row }) => {
          const item = row.original;
          if (item.id === "empty-state") {
            return <div className="sr-only">Empty state</div>;
          }
          if (isLoading && item.id.startsWith("skeleton-")) {
            return <Skeleton className="h-4 w-32" />;
          }
          return <div className="font-medium">{item.referrerName}</div>;
        },
        enableColumnFilter: true,
        enableSorting: true,
        meta: {
          label: "Referrer",
          variant: "text" as const,
          placeholder: "Filter by name...",
          maxLength: 255,
        },
      },
      {
        id: "referredCount",
        accessorKey: "referredCount",
        size: 150,
        minSize: 120,
        maxSize: 200,
        header: ({ column }) => (
          <div className="flex w-full justify-end">
            <DataTableColumnHeader column={column} label="Referred" />
          </div>
        ),
        cell: ({ row }) => {
          const item = row.original;
          if (item.id === "empty-state") {
            return null;
          }
          if (isLoading && item.id.startsWith("skeleton-")) {
            return (
              <div className="flex justify-end">
                <Skeleton className="h-4 w-12" />
              </div>
            );
          }
          return (
            <div className="flex justify-end">
              <div className="font-medium">
                {item.referredCount.toLocaleString("en-IN")}
              </div>
            </div>
          );
        },
        enableSorting: true,
      },
      {
        id: "actions",
        size: 80,
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => {
          const item = row.original;
          if (item.id === "empty-state") {
            return null;
          }
          if (isLoading && item.id.startsWith("skeleton-")) {
            return (
              <div className="flex justify-end">
                <Skeleton className="h-4 w-12" />
              </div>
            );
          }
          return (
            <div className="flex justify-end">
              <Link
                href={`/customers/${item.referrerSlugId}`}
                aria-label={`View referrer ${item.referrerName}`}
                className={cn(
                  buttonVariants({ variant: "ghost", size: "xs" }),
                  "h-8 w-8 p-0",
                )}
              >
                <Eye className="h-4 w-4" />
              </Link>
            </div>
          );
        },
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [isLoading, expandedRows, toggleExpanded],
  );

  const { table } = useDataTable({
    data: displayItems,
    columns,
    pageCount: isLoading && items.length === 0 ? 1 : pageCount,
    shallow: false,
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: perPage,
      },
      sorting: [{ id: "referredCount", desc: true }],
      columnPinning: { left: ["expand"], right: ["actions"] },
    },
    prefix: getDataTableConfig("referralStats").prefix,
  });

  return (
    <DataTable
      table={table}
      enableExpanding
      expandedRows={expandedRows}
      onExpandedRowsChange={setExpandedRows}
      getRowId={(row) => row.id}
      renderExpandedRow={(row) => {
        const item = row.original;
        if (
          item.id === "empty-state" ||
          item.id.startsWith("skeleton-") ||
          !item.referrerSlugId
        ) {
          return null;
        }
        return (
          <ReferredCustomersExpandedContent
            referrerSlugId={item.referrerSlugId}
          />
        );
      }}
      renderRowFooter={(row) => {
        if (isEmpty && row.original.id === "empty-state") {
          return (
            <div className="flex flex-col items-center justify-center px-4 py-12">
              <p className="text-muted-foreground text-sm font-medium">
                No referrers yet
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                Referral stats will appear when customers refer others
              </p>
            </div>
          );
        }
        return null;
      }}
    >
      <DataTableToolbar table={table} />
    </DataTable>
  );
}
