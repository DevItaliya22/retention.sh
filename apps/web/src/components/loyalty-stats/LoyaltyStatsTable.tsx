"use client";

import {
  type LoyaltyStatRow,
  useLoyaltyStatsQuery,
} from "@/hooks/loyalty/useLoyaltyStatsQuery";
import { getDataTableConfig } from "@/lib/utils/data-table-params";
import {
  buttonVariants,
  DataTable,
  DataTableColumnHeader,
  DataTableToolbar,
  Skeleton,
} from "@reelo/ui/components";
import { useDataTable } from "@reelo/ui/hooks";
import { cn } from "@reelo/ui/lib/utils";
import type { ColumnDef } from "@tanstack/react-table";
import { ExternalLink, User } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

function formatType(type: string) {
  const t = type as LoyaltyStatRow["type"];
  if (t === "EARNED") return "Earned";
  if (t === "REDEEMED") return "Redeemed";
  if (t === "EXPIRED") return "Expired";
  if (t === "ADJUSTMENT") return "Adjustment";
  if (t === "REFUNDED") return "Refunded";
  if (t === "GIFTED") return "Gifted";
  return type;
}

export function LoyaltyStatsTable() {
  const { data, isLoading, isError, error } = useLoyaltyStatsQuery();

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-destructive text-sm font-medium">
          Failed to load loyalty stats
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
        type: "",
        source: "",
        valueKind: "",
        amount: 0,
        createdAt: "",
        customerSlugId: "",
        customerName: "",
        customerPhone: null as string | null,
        billId: null as string | null,
        billNumber: null as string | null,
      })) as LoyaltyStatRow[];
    }
    if (isEmpty) {
      return [
        {
          id: "empty-state",
          type: "",
          source: "",
          valueKind: "",
          amount: 0,
          createdAt: "",
          customerSlugId: "",
          customerName: "",
          customerPhone: null,
          billId: null,
          billNumber: null,
        },
      ] as LoyaltyStatRow[];
    }
    return items;
  }, [items, isLoading, perPage, isEmpty]);

  const columns = useMemo<ColumnDef<LoyaltyStatRow>[]>(
    () => [
      {
        id: "customerName",
        accessorKey: "customerName",
        size: 220,
        minSize: 180,
        maxSize: 300,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Customer" />
        ),
        cell: ({ row }) => {
          const item = row.original;
          if (item.id === "empty-state") return null;
          if (isLoading && item.id.startsWith("skeleton-")) {
            return <Skeleton className="h-4 w-28" />;
          }
          if (!item.customerSlugId) {
            return (
              <span className="text-muted-foreground">{item.customerName}</span>
            );
          }
          return (
            <Link
              href={`/customers/${item.customerSlugId}`}
              className={cn(
                buttonVariants({ variant: "link", size: "sm" }),
                "h-auto p-0 font-medium",
              )}
            >
              <User className="mr-1.5 inline size-3.5" />
              {item.customerName}
            </Link>
          );
        },
        enableColumnFilter: true,
        meta: {
          label: "Customer",
          variant: "text" as const,
          placeholder: "Filter by name...",
          maxLength: 255,
        },
      },
      {
        id: "amount",
        accessorKey: "amount",
        size: 100,
        minSize: 80,
        maxSize: 140,
        header: ({ column }) => (
          <div className="flex w-full justify-end">
            <DataTableColumnHeader column={column} label="Points" />
          </div>
        ),
        cell: ({ row }) => {
          const item = row.original;
          if (item.id === "empty-state") return null;
          if (isLoading && item.id.startsWith("skeleton-")) {
            return (
              <div className="flex justify-end">
                <Skeleton className="h-4 w-10" />
              </div>
            );
          }
          const sign =
            item.type === "REDEEMED" || item.type === "EXPIRED" ? "-" : "+";
          const absAmount = Math.abs(item.amount);
          const isCashback = item.valueKind === "CASHBACK";
          return (
            <div className="flex justify-end font-medium tabular-nums">
              {sign}
              {isCashback ? `₹${absAmount.toFixed(2)}` : absAmount}
            </div>
          );
        },
        enableSorting: true,
      },
      {
        id: "valueKind",
        accessorKey: "valueKind",
        size: 100,
        minSize: 80,
        maxSize: 140,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Kind" />
        ),
        cell: ({ row }) => {
          const item = row.original;
          if (item.id === "empty-state") return null;
          if (isLoading && item.id.startsWith("skeleton-")) {
            return <Skeleton className="h-4 w-16" />;
          }
          return (
            <span className="text-muted-foreground font-mono text-xs">
              {item.valueKind ?? "—"}
            </span>
          );
        },
        enableColumnFilter: true,
        meta: {
          label: "Kind",
          variant: "select" as const,
          placeholder: "All kinds",
          options: [
            { value: "CASHBACK", label: "Cashback" },
            { value: "AMOUNT_SPENT_POINTS", label: "Amount Spent Pts" },
            { value: "VISIT_POINTS", label: "Visit Pts" },
          ],
        },
      },
      {
        id: "type",
        accessorKey: "type",
        size: 120,
        minSize: 100,
        maxSize: 160,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Type" />
        ),
        cell: ({ row }) => {
          const item = row.original;
          if (item.id === "empty-state") return null;
          if (isLoading && item.id.startsWith("skeleton-")) {
            return <Skeleton className="h-4 w-16" />;
          }
          return <span className="font-medium">{formatType(item.type)}</span>;
        },
        enableColumnFilter: true,
        meta: {
          label: "Type",
          variant: "select" as const,
          placeholder: "All types",
          options: [
            { value: "EARNED", label: "Earned" },
            { value: "REDEEMED", label: "Redeemed" },
            { value: "EXPIRED", label: "Expired" },
            { value: "ADJUSTMENT", label: "Adjustment" },
          ],
        },
      },
      {
        id: "source",
        accessorKey: "source",
        size: 120,
        minSize: 80,
        maxSize: 160,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Source" />
        ),
        cell: ({ row }) => {
          const item = row.original;
          if (item.id === "empty-state") return null;
          if (isLoading && item.id.startsWith("skeleton-")) {
            return <Skeleton className="h-4 w-12" />;
          }
          return (
            <span className="text-muted-foreground">{item.source ?? "—"}</span>
          );
        },
        enableColumnFilter: true,
        meta: {
          label: "Source",
          variant: "text" as const,
          placeholder: "Filter source...",
          maxLength: 50,
        },
      },
      {
        id: "createdAt",
        accessorKey: "createdAt",
        size: 160,
        minSize: 140,
        maxSize: 200,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Date" />
        ),
        cell: ({ row }) => {
          const item = row.original;
          if (item.id === "empty-state") {
            return <div className="sr-only">Empty state</div>;
          }
          if (isLoading && item.id.startsWith("skeleton-")) {
            return <Skeleton className="h-4 w-28" />;
          }
          const dateStr = item.createdAt
            ? new Date(item.createdAt).toLocaleString("en-IN", {
                dateStyle: "short",
                timeStyle: "short",
              })
            : "—";
          return <span className="tabular-nums">{dateStr}</span>;
        },
        enableSorting: true,
      },
      {
        id: "billNumber",
        accessorKey: "billNumber",
        size: 160,
        minSize: 120,
        maxSize: 220,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Bill" />
        ),
        cell: ({ row }) => {
          const item = row.original;
          if (item.id === "empty-state") return null;
          if (isLoading && item.id.startsWith("skeleton-")) {
            return <Skeleton className="h-4 w-20" />;
          }
          if (!item.billId || !item.billNumber) {
            return <span className="text-muted-foreground">—</span>;
          }
          return (
            <Link
              href={`/bills/${item.billId}`}
              className={cn(
                buttonVariants({ variant: "link", size: "sm" }),
                "h-auto p-0 font-mono text-sm",
              )}
            >
              <ExternalLink className="mr-1.5 inline size-3.5" />
              {item.billNumber}
            </Link>
          );
        },
        enableColumnFilter: true,
        meta: {
          label: "Bill number",
          variant: "text" as const,
          placeholder: "Filter by bill...",
          maxLength: 255,
        },
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
      columnPinning: { right: [] },
    },
    prefix: getDataTableConfig("loyaltyStats").prefix,
  });

  return (
    <DataTable
      table={table}
      renderRowFooter={(row) => {
        if (isEmpty && row.original.id === "empty-state") {
          return (
            <div className="flex flex-col items-center justify-center px-4 py-12">
              <p className="text-muted-foreground text-sm font-medium">
                No loyalty transactions yet
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                Transactions will appear when customers earn or redeem points
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
