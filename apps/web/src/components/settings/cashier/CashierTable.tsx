"use client";

import type { Cashier } from "@/hooks/cashier/useCashiersQuery";
import type { Cashier as ManageCashier } from "@/hooks/cashier/useManageCashier";
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
  EmptyTitle,
  Skeleton,
} from "@reelo/ui/components";
import { useDataTable } from "@reelo/ui/hooks";
import type { ColumnDef } from "@tanstack/react-table";
import { Eye } from "lucide-react";
import { useMemo, useState } from "react";
import { CashierDetailSheet } from "./CashierDetailSheet";
import { DeleteCashierButton } from "./DeleteCashierButton";
import { EditCashierButton } from "./EditCashierButton";
import { OpenCashierPortalButton } from "./OpenCashierPortalButton";

interface CashierTableProps {
  cashiers: Cashier[];
  total: number;
  perPage: number;
  isLoading?: boolean;
}

export function CashierTable({
  cashiers,
  total,
  perPage,
  isLoading = false,
}: CashierTableProps) {
  const [detailCashierId, setDetailCashierId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const pageCount = Math.max(1, Math.ceil(total / perPage));
  const isEmpty = !isLoading && cashiers.length === 0;

  const displayCashiers = useMemo(() => {
    if (isLoading && cashiers.length === 0) {
      return Array.from({ length: perPage }, (_, i) => ({
        id: `skeleton-${i}`,
        userId: "",
        name: "",
        email: null,
        cashierLinkSlug: "",
        isActive: true,
        createdAt: "",
        updatedAt: "",
      })) as Cashier[];
    }
    if (isEmpty) return [] as Cashier[];
    return cashiers;
  }, [cashiers, isLoading, perPage, isEmpty]);
  const columns = useMemo<ColumnDef<Cashier>[]>(
    () => [
      {
        id: "name",
        accessorKey: "name",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Name" />
        ),
        cell: ({ row }) => {
          const cashier = row.original;
          if (cashier.id === "empty-state") {
            return <div className="sr-only">Empty state</div>;
          }
          if (isLoading && cashier.id.startsWith("skeleton-")) {
            return <Skeleton className="h-4 w-32" />;
          }
          return <div className="font-medium">{cashier.name}</div>;
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
        id: "email",
        accessorKey: "email",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Email" />
        ),
        cell: ({ row }) => {
          const cashier = row.original;
          if (cashier.id === "empty-state") {
            return null;
          }
          if (isLoading && cashier.id.startsWith("skeleton-")) {
            return <Skeleton className="h-4 w-40" />;
          }
          return <div>{cashier.email || "-"}</div>;
        },
        enableColumnFilter: true,
        enableSorting: true,
        meta: {
          label: "Email",
          variant: "text" as const,
          placeholder: "Filter by email...",
          maxLength: 254,
        },
      },
      {
        id: "cashierLinkSlug",
        accessorKey: "cashierLinkSlug",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Link Slug" />
        ),
        cell: ({ row }) => {
          const cashier = row.original;
          if (cashier.id === "empty-state") {
            return null;
          }
          if (isLoading && cashier.id.startsWith("skeleton-")) {
            return <Skeleton className="h-4 w-24" />;
          }
          return (
            <div className="font-mono text-sm">{cashier.cashierLinkSlug}</div>
          );
        },
      },
      {
        id: "isActive",
        accessorKey: "isActive",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Status" />
        ),
        cell: ({ row }) => {
          const cashier = row.original;
          if (cashier.id === "empty-state") {
            return null;
          }
          if (isLoading && cashier.id.startsWith("skeleton-")) {
            return <Skeleton className="h-5 w-16" />;
          }
          return (
            <Badge
              variant={cashier.isActive ? "default" : "secondary"}
              className={
                cashier.isActive
                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                  : "bg-destructive/15 text-destructive"
              }
            >
              {cashier.isActive ? "Active" : "Inactive"}
            </Badge>
          );
        },
        enableColumnFilter: true,
        meta: {
          label: "Status",
          variant: "select" as const,
          placeholder: "Filter by status...",
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
          const cashier = row.original;
          if (cashier.id === "empty-state") {
            return null;
          }
          if (isLoading && cashier.id.startsWith("skeleton-")) {
            return <Skeleton className="h-4 w-20" />;
          }
          return (
            <div className="text-muted-foreground text-sm">
              <DateDisplay
                date={cashier.createdAt}
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
          const cashier = row.original;
          if (cashier.id === "empty-state") {
            return null;
          }
          if (isLoading && cashier.id.startsWith("skeleton-")) {
            return (
              <div className="flex justify-end gap-1">
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
              </div>
            );
          }
          const cashierForButtons: ManageCashier = {
            ...cashier,
            isActive: cashier.isActive ?? true,
            createdAt: new Date(cashier.createdAt),
            updatedAt: new Date(cashier.updatedAt),
          };
          return (
            <div className="flex justify-end gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  setDetailCashierId(cashier.id);
                  setDetailOpen(true);
                }}
                aria-label="View cashier details"
              >
                <Eye className="h-4 w-4" />
              </Button>
              <OpenCashierPortalButton cashier={cashierForButtons} />
              <EditCashierButton cashier={cashierForButtons} />
              <DeleteCashierButton cashierId={cashier.id} />
            </div>
          );
        },
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [],
  );

  const { table } = useDataTable({
    data: displayCashiers,
    columns,
    pageCount: isLoading && cashiers.length === 0 ? 1 : pageCount,
    shallow: false,
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: perPage,
      },
      sorting: [{ id: "createdAt", desc: true }],
      columnPinning: {
        right: ["actions"],
      },
    },
    prefix: getDataTableConfig("cashiers").prefix,
  });

  return (
    <>
      <DataTable
        table={table}
        renderEmpty={() => (
          <Empty className="py-12">
            <EmptyHeader>
              <EmptyTitle>No cashiers found</EmptyTitle>
              <EmptyDescription>
                Try adjusting your filters or add a new cashier
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      >
        <DataTableToolbar table={table} />
      </DataTable>
      <CashierDetailSheet
        cashierId={detailCashierId}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </>
  );
}
