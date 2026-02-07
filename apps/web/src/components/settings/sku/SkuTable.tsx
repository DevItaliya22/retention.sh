"use client";

import type { SkuItem } from "@/hooks/sku/useSkusQuery";
import { getDataTableConfig } from "@/lib/utils/data-table-params";
import {
  DataTable,
  DataTableColumnHeader,
  DataTableToolbar,
  DateDisplay,
  InfoTooltip,
  Skeleton,
  Switch,
} from "@reelo/ui/components";
import { useDataTable } from "@reelo/ui/hooks";
import type { ColumnDef } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { DeleteSkuButton } from "./DeleteSkuButton";
import { EditSkuButton } from "./EditSkuButton";

interface SkuTableProps {
  skus: SkuItem[];
  total: number;
  perPage: number;
  isLoading?: boolean;
}

export function SkuTable({
  skus,
  total,
  perPage,
  isLoading = false,
}: SkuTableProps) {
  const pageCount = Math.max(1, Math.ceil(total / perPage));
  const isEmpty = !isLoading && skus.length === 0;
  const [scrollMode, setScrollMode] = useState<"table" | "page">("table");

  const displaySkus = useMemo(() => {
    if (isLoading && skus.length === 0) {
      return Array.from({ length: perPage }, (_, i) => ({
        id: `skeleton-${i}`,
        sku: "",
        name: "",
        description: null,
        price: null,
        unit: null,
        categoryId: null,
        categoryName: null,
        isActive: true,
        createdAt: "",
        updatedAt: "",
      })) as SkuItem[];
    }
    if (isEmpty) {
      return [
        {
          id: "empty-state",
          sku: "",
          name: "",
          description: null,
          price: null,
          unit: null,
          categoryId: null,
          categoryName: null,
          isActive: true,
          createdAt: "",
          updatedAt: "",
        },
      ] as SkuItem[];
    }
    return skus;
  }, [skus, isLoading, perPage, isEmpty]);

  const columns = useMemo<ColumnDef<SkuItem>[]>(
    () => [
      {
        id: "sku",
        accessorKey: "sku",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="SKU" />
        ),
        cell: ({ row }) => {
          const item = row.original;
          if (item.id === "empty-state") return null;
          if (isLoading && item.id.startsWith("skeleton-")) {
            return <Skeleton className="h-4 w-24" />;
          }
          return (
            <div className="font-mono text-sm font-medium">{item.sku}</div>
          );
        },
        enableColumnFilter: true,
        enableSorting: true,
        meta: {
          label: "SKU",
          variant: "text" as const,
          placeholder: "Filter by SKU...",
          maxLength: 100,
        },
      },
      {
        id: "name",
        accessorKey: "name",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Name" />
        ),
        cell: ({ row }) => {
          const item = row.original;
          if (item.id === "empty-state") return null;
          if (isLoading && item.id.startsWith("skeleton-")) {
            return <Skeleton className="h-4 w-32" />;
          }
          return <div className="font-medium">{item.name}</div>;
        },
        enableColumnFilter: true,
        enableSorting: true,
        meta: {
          label: "Name",
          variant: "text" as const,
          placeholder: "Filter by name...",
          maxLength: 255,
        },
      },
      {
        id: "categoryName",
        accessorKey: "categoryName",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Category" />
        ),
        cell: ({ row }) => {
          const item = row.original;
          if (item.id === "empty-state") return null;
          if (isLoading && item.id.startsWith("skeleton-")) {
            return <Skeleton className="h-4 w-20" />;
          }
          return (
            <div className="text-muted-foreground text-sm">
              {item.categoryName ?? "—"}
            </div>
          );
        },
      },
      {
        id: "price",
        accessorKey: "price",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Price" />
        ),
        cell: ({ row }) => {
          const item = row.original;
          if (item.id === "empty-state") return null;
          if (isLoading && item.id.startsWith("skeleton-")) {
            return <Skeleton className="h-4 w-16" />;
          }
          return (
            <div className="text-sm">
              {item.price != null
                ? `${item.price}${item.unit ? ` / ${item.unit}` : ""}`
                : "—"}
            </div>
          );
        },
        enableSorting: true,
      },
      {
        id: "isActive",
        accessorKey: "isActive",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Status" />
        ),
        cell: ({ row }) => {
          const item = row.original;
          if (item.id === "empty-state") return null;
          if (isLoading && item.id.startsWith("skeleton-")) {
            return <Skeleton className="h-5 w-14" />;
          }
          return (
            <span
              className={
                item.isActive
                  ? "text-muted-foreground text-xs"
                  : "text-muted-foreground/70 text-xs"
              }
            >
              {item.isActive ? "Active" : "Inactive"}
            </span>
          );
        },
        enableColumnFilter: true,
        meta: {
          label: "Status",
          variant: "select" as const,
          options: [
            { label: "Active", value: "true" },
            { label: "Inactive", value: "false" },
          ],
        },
      },
      {
        id: "createdAt",
        accessorKey: "createdAt",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Created" />
        ),
        enableSorting: true,
        cell: ({ row }) => {
          const item = row.original;
          if (item.id === "empty-state") return null;
          if (isLoading && item.id.startsWith("skeleton-")) {
            return <Skeleton className="h-4 w-20" />;
          }
          return (
            <div className="text-muted-foreground text-sm">
              <DateDisplay
                date={item.createdAt}
                relative={false}
                formatOptions={{
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                }}
              />
            </div>
          );
        },
      },
      {
        id: "actions",
        size: 100,
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => {
          const item = row.original;
          if (item.id === "empty-state") return null;
          if (isLoading && item.id.startsWith("skeleton-")) {
            return (
              <div className="flex justify-end gap-1">
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
              </div>
            );
          }
          return (
            <div className="flex justify-end gap-1">
              <EditSkuButton sku={item} />
              <DeleteSkuButton skuId={item.id} skuName={item.name} />
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
    data: displaySkus,
    columns,
    pageCount: isLoading && skus.length === 0 ? 1 : pageCount,
    shallow: false,
    initialState: {
      pagination: { pageIndex: 0, pageSize: perPage },
      sorting: [{ id: "createdAt", desc: true }],
      columnPinning: { right: ["actions"] },
    },
    prefix: getDataTableConfig("skus").prefix,
  });

  return (
    <DataTable
      table={table}
      scrollMode={scrollMode}
      tableMaxHeight="70vh"
      renderRowFooter={(row) => {
        if (isEmpty && row.original.id === "empty-state") {
          return (
            <div className="flex flex-col items-center justify-center px-4 py-12">
              <p className="text-muted-foreground text-sm font-medium">
                No SKUs found
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                Add your first SKU or adjust your filters
              </p>
            </div>
          );
        }
        return null;
      }}
    >
      <DataTableToolbar table={table}>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs">
            Scroll inside table
          </span>
          <Switch
            checked={scrollMode === "table"}
            onCheckedChange={(checked) =>
              setScrollMode(checked ? "table" : "page")
            }
            aria-label="Toggle table internal scroll"
          />
          <InfoTooltip content="For convenience, enable table scroll to reach pagination faster without scrolling the whole page." />
        </div>
      </DataTableToolbar>
    </DataTable>
  );
}
