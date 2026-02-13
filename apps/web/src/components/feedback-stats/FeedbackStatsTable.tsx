"use client";

import {
  type FeedbackStatRow,
  useFeedbackStatsQuery,
} from "@/hooks/feedback/useFeedbackConfig";
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
import { User } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

export function FeedbackStatsTable() {
  const { data, isLoading, isError, error } = useFeedbackStatsQuery();

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-destructive text-sm font-medium">
          Failed to load feedback stats
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
        rating: null as number | null,
        comment: null as string | null,
        howDidYouHear: null as string | null,
        selectedCategories: [] as string[],
        createdAt: "",
        customerName: "",
        customerPhone: null as string | null,
        customerSlugId: "",
      })) as FeedbackStatRow[];
    }
    if (isEmpty) {
      return [
        {
          id: "empty-state",
          rating: null,
          comment: null,
          howDidYouHear: null,
          selectedCategories: [],
          createdAt: "",
          customerName: "",
          customerPhone: null,
          customerSlugId: "",
        },
      ] as FeedbackStatRow[];
    }
    return items;
  }, [items, isLoading, perPage, isEmpty]);

  const columns = useMemo<ColumnDef<FeedbackStatRow>[]>(
    () => [
      {
        id: "customerName",
        accessorKey: "customerName",
        size: 200,
        minSize: 160,
        maxSize: 280,
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
        id: "rating",
        accessorKey: "rating",
        size: 90,
        minSize: 70,
        maxSize: 120,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Rating" />
        ),
        cell: ({ row }) => {
          const item = row.original;
          if (item.id === "empty-state") return null;
          if (isLoading && item.id.startsWith("skeleton-")) {
            return <Skeleton className="h-4 w-8" />;
          }
          return (
            <span className="font-medium tabular-nums">
              {item.rating != null ? `${item.rating}/5` : "—"}
            </span>
          );
        },
        enableColumnFilter: true,
        enableSorting: true,
        meta: {
          label: "Rating",
          variant: "select" as const,
          placeholder: "All ratings",
          options: [
            { value: "1", label: "1" },
            { value: "2", label: "2" },
            { value: "3", label: "3" },
            { value: "4", label: "4" },
            { value: "5", label: "5" },
          ],
        },
      },
      {
        id: "comment",
        accessorKey: "comment",
        size: 240,
        minSize: 180,
        maxSize: 360,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Comment" />
        ),
        cell: ({ row }) => {
          const item = row.original;
          if (item.id === "empty-state") return null;
          if (isLoading && item.id.startsWith("skeleton-")) {
            return <Skeleton className="h-4 w-40" />;
          }
          const text = item.comment ?? "—";
          return (
            <span className="text-muted-foreground line-clamp-2 text-sm">
              {text}
            </span>
          );
        },
      },
      {
        id: "selectedCategories",
        accessorKey: "selectedCategories",
        size: 160,
        minSize: 120,
        maxSize: 220,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Categories" />
        ),
        cell: ({ row }) => {
          const item = row.original;
          if (item.id === "empty-state") return null;
          if (isLoading && item.id.startsWith("skeleton-")) {
            return <Skeleton className="h-4 w-24" />;
          }
          const cats = item.selectedCategories?.length
            ? item.selectedCategories.join(", ")
            : "—";
          return <span className="text-muted-foreground text-xs">{cats}</span>;
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
    prefix: getDataTableConfig("feedbackStats").prefix,
  });

  return (
    <DataTable
      table={table}
      renderRowFooter={(row) => {
        if (isEmpty && row.original.id === "empty-state") {
          return (
            <div className="flex flex-col items-center justify-center px-4 py-12">
              <p className="text-muted-foreground text-sm font-medium">
                No feedback yet
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                Responses will appear when customers submit feedback from their
                bill link
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
