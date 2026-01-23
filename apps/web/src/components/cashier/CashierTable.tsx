"use client";

import { DataTable, DataTableColumnHeader, DataTableToolbar } from "@reelo/ui/components";
import { useDataTable } from "@reelo/ui/hooks";
import type { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";
import type { Cashier } from "@/hooks/cashier/useManageCashier";
import { EditCashierButton } from "./EditCashierButton";
import { DeleteCashierButton } from "./DeleteCashierButton";

interface CashierTableProps {
  cashiers: Cashier[];
}

export function CashierTable({ cashiers }: CashierTableProps) {
  const columns = useMemo<ColumnDef<Cashier>[]>(
    () => [
      {
        id: "name",
        accessorKey: "name",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Name" />
        ),
        cell: ({ row }) => {
          return <div className="font-medium">{row.original.name}</div>;
        },
        enableColumnFilter: true,
        meta: {
          label: "Name",
          variant: "text" as const,
          placeholder: "Filter by name...",
        },
      },
      {
        id: "email",
        accessorKey: "email",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Email" />
        ),
        cell: ({ row }) => {
          return <div>{row.original.email || "-"}</div>;
        },
        enableColumnFilter: true,
        meta: {
          label: "Email",
          variant: "text" as const,
          placeholder: "Filter by email...",
        },
      },
      {
        id: "cashierLinkSlug",
        accessorKey: "cashierLinkSlug",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Link Slug" />
        ),
        cell: ({ row }) => {
          return <div className="font-mono text-sm">{row.original.cashierLinkSlug}</div>;
        },
      },
      {
        id: "createdAt",
        accessorKey: "createdAt",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Created" />
        ),
        cell: ({ row }) => {
          return (
            <div className="text-sm text-muted-foreground">
              {new Date(row.original.createdAt).toLocaleDateString()}
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
          return (
            <div className="flex justify-end gap-1">
              <EditCashierButton cashier={cashier} />
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
    data: cashiers,
    columns,
    pageCount: -1,
    queryKeys: {
      page: "cashiersPage",
      perPage: "cashiersPerPage",
      sort: "cashiersSort",
      filters: "cashiersFilters",
    },
  });

  return (
    <DataTable table={table}>
      <DataTableToolbar table={table} />
    </DataTable>
  );
}
