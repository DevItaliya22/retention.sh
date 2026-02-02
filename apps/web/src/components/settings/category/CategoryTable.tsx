"use client";

import type { CategoryItem } from "@/hooks/category/useCategoriesQuery";
import { getDataTableConfig } from "@/lib/utils/data-table-params";
import {
  DataTable,
  DataTableColumnHeader,
  DataTableToolbar,
  DateDisplay,
  Skeleton,
} from "@reelo/ui/components";
import { useDataTable } from "@reelo/ui/hooks";
import type { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";
import { DeleteCategoryButton } from "./DeleteCategoryButton";
import { EditCategoryButton } from "./EditCategoryButton";

interface CategoryTableProps {
  categories: CategoryItem[];
  total: number;
  perPage: number;
  isLoading?: boolean;
}

export function CategoryTable({
  categories,
  total,
  perPage,
  isLoading = false,
}: CategoryTableProps) {
  const pageCount = Math.max(1, Math.ceil(total / perPage));
  const isEmpty = !isLoading && categories.length === 0;

  const displayCategories = useMemo(() => {
    if (isLoading && categories.length === 0) {
      return Array.from({ length: perPage }, (_, i) => ({
        id: `skeleton-${i}`,
        parentId: null,
        parentName: null,
        name: "",
        description: null,
        sortOrder: 0,
        skuCount: 0,
        subcategoryCount: 0,
        createdAt: "",
        updatedAt: "",
      })) as CategoryItem[];
    }
    if (isEmpty) {
      return [
        {
          id: "empty-state",
          parentId: null,
          parentName: null,
          name: "",
          description: null,
          sortOrder: 0,
          skuCount: 0,
          subcategoryCount: 0,
          createdAt: "",
          updatedAt: "",
        },
      ] as CategoryItem[];
    }
    return categories;
  }, [categories, isLoading, perPage, isEmpty]);

  const columns = useMemo<ColumnDef<CategoryItem>[]>(
    () => [
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
          const isSubcategory = !!item.parentId;
          return (
            <div
              className={
                isSubcategory ? "flex items-center gap-2 pl-6" : "font-medium"
              }
            >
              {isSubcategory && (
                <span className="text-muted-foreground text-xs">↳</span>
              )}
              <span
                className={
                  isSubcategory
                    ? "text-muted-foreground font-normal"
                    : "font-medium"
                }
              >
                {item.name}
              </span>
            </div>
          );
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
        id: "description",
        accessorKey: "description",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Description" />
        ),
        cell: ({ row }) => {
          const item = row.original;
          if (item.id === "empty-state") return null;
          if (isLoading && item.id.startsWith("skeleton-")) {
            return <Skeleton className="h-4 w-40" />;
          }
          return (
            <div className="text-muted-foreground max-w-[200px] truncate text-sm">
              {item.description ?? "—"}
            </div>
          );
        },
      },
      {
        id: "sortOrder",
        accessorKey: "sortOrder",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Order" />
        ),
        cell: ({ row }) => {
          const item = row.original;
          if (item.id === "empty-state") return null;
          if (isLoading && item.id.startsWith("skeleton-")) {
            return <Skeleton className="h-4 w-8" />;
          }
          return (
            <div className="text-muted-foreground text-sm">
              {item.sortOrder}
            </div>
          );
        },
        enableSorting: true,
      },
      {
        id: "skuCount",
        accessorKey: "skuCount",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="SKUs" />
        ),
        cell: ({ row }) => {
          const item = row.original;
          if (item.id === "empty-state") return null;
          if (isLoading && item.id.startsWith("skeleton-")) {
            return <Skeleton className="h-4 w-8" />;
          }
          return (
            <div className="text-muted-foreground text-sm">{item.skuCount}</div>
          );
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
              <EditCategoryButton category={item} />
              <DeleteCategoryButton
                categoryId={item.id}
                categoryName={item.name}
                skuCount={item.skuCount}
                subcategoryCount={item.subcategoryCount}
              />
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
    data: displayCategories,
    columns,
    pageCount: isLoading && categories.length === 0 ? 1 : pageCount,
    shallow: false,
    initialState: {
      pagination: { pageIndex: 0, pageSize: perPage },
      sorting: [{ id: "sortOrder", desc: false }],
      columnPinning: { right: ["actions"] },
    },
    prefix: getDataTableConfig("categories").prefix,
  });

  return (
    <DataTable
      table={table}
      renderRowFooter={(row) => {
        if (isEmpty && row.original.id === "empty-state") {
          return (
            <div className="flex flex-col items-center justify-center px-4 py-12">
              <p className="text-muted-foreground text-sm font-medium">
                No categories found
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                Add your first category or adjust your filters
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
