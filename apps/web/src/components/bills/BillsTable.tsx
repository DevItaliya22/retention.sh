"use client";

import { useBillsQuery, type Bill } from "@/hooks/bills/useBillsQuery";
import {
  buttonVariants,
  DataTable,
  DataTableColumnHeader,
  DataTableToolbar,
  DateDisplay,
  Skeleton,
} from "@reelo/ui/components";
import { useDataTable } from "@reelo/ui/hooks";
import { cn } from "@reelo/ui/lib/utils";
import type { ColumnDef } from "@tanstack/react-table";
import { Eye } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

export function BillsTable() {
  const { data, isLoading, isError, error } = useBillsQuery();

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-destructive text-sm font-medium">
          Failed to load bills
        </p>
        <p className="text-muted-foreground mt-1 text-sm">
          {error?.message || "Please try again later"}
        </p>
      </div>
    );
  }

  const bills = data?.bills ?? [];
  const total = data?.total ?? 0;
  const perPage = data?.perPage ?? 10;
  const pageCount = Math.max(1, Math.ceil(total / perPage));
  const isEmpty = !isLoading && bills.length === 0;

  const displayBills = useMemo(() => {
    if (isLoading && bills.length === 0) {
      return Array.from({ length: perPage }, (_, i) => ({
        id: `skeleton-${i}`,
        billNumber: "",
        amount: null,
        customerName: "",
        customerPhone: null,
        customerEmail: "",
        lineItems: [],
        createdAt: "",
        updatedAt: "",
      })) as Bill[];
    }
    if (isEmpty) {
      return [
        {
          id: "empty-state",
          billNumber: "",
          amount: null,
          customerName: "",
          customerPhone: null,
          customerEmail: "",
          lineItems: [],
          createdAt: "",
          updatedAt: "",
        },
      ] as Bill[];
    }
    return bills;
  }, [bills, isLoading, perPage, isEmpty]);

  const columns = useMemo<ColumnDef<Bill>[]>(
    () => [
      {
        id: "billNumber",
        accessorKey: "billNumber",
        size: 200,
        minSize: 150,
        maxSize: 300,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Bill Number" />
        ),
        cell: ({ row }) => {
          const bill = row.original;
          if (bill.id === "empty-state") {
            return <div className="sr-only">Empty state</div>;
          }
          if (isLoading && bill.id.startsWith("skeleton-")) {
            return <Skeleton className="h-4 w-32" />;
          }
          return <div className="font-mono font-medium">{bill.billNumber}</div>;
        },
        enableColumnFilter: true,
        meta: {
          label: "Bill Number",
          variant: "text" as const,
          placeholder: "Filter by bill number...",
          maxLength: 255,
        },
      },
      {
        id: "customerName",
        accessorKey: "customerName",
        size: 250,
        minSize: 200,
        maxSize: 350,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Customer" />
        ),
        cell: ({ row }) => {
          const bill = row.original;
          if (bill.id === "empty-state") {
            return null;
          }
          if (isLoading && bill.id.startsWith("skeleton-")) {
            return (
              <div className="flex flex-col gap-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-20" />
              </div>
            );
          }
          return (
            <div className="flex flex-col">
              <div className="font-medium">{bill.customerName}</div>
              {bill.customerPhone && (
                <div className="text-muted-foreground text-sm">
                  {bill.customerPhone}
                </div>
              )}
            </div>
          );
        },
        enableColumnFilter: true,
        meta: {
          label: "Customer",
          variant: "text" as const,
          placeholder: "Filter by customer name...",
          maxLength: 255,
        },
      },
      {
        id: "items",
        accessorKey: "lineItems",
        size: 100,
        minSize: 80,
        maxSize: 120,
        header: () => (
          <div className="text-center">
            <span>Items</span>
          </div>
        ),
        cell: ({ row }) => {
          const bill = row.original;
          if (bill.id === "empty-state") {
            return null;
          }
          if (isLoading && bill.id.startsWith("skeleton-")) {
            return (
              <div className="flex justify-center">
                <Skeleton className="h-4 w-8" />
              </div>
            );
          }
          const count = bill.lineItems?.length ?? 0;
          const totalQty =
            bill.lineItems?.reduce((s, li) => s + li.qty, 0) ?? 0;
          return (
            <div className="flex justify-center text-muted-foreground text-sm tabular-nums">
              {count === 0 ? "—" : totalQty}
            </div>
          );
        },
        enableSorting: false,
      },
      {
        id: "amount",
        accessorKey: "amount",
        size: 150,
        minSize: 120,
        maxSize: 200,
        header: ({ column }) => (
          <div className="flex w-full justify-end">
            <DataTableColumnHeader column={column} label="Amount" />
          </div>
        ),
        cell: ({ row }) => {
          const bill = row.original;
          if (bill.id === "empty-state") {
            return null;
          }
          if (isLoading && bill.id.startsWith("skeleton-")) {
            return (
              <div className="flex justify-end">
                <Skeleton className="h-4 w-16" />
              </div>
            );
          }
          const amount = bill.amount;
          return (
            <div className="flex justify-end">
              {amount !== null ? (
                <div className="font-medium">
                  ₹
                  {amount.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
              ) : (
                <span className="text-muted-foreground">-</span>
              )}
            </div>
          );
        },
        enableColumnFilter: true,
        enableSorting: true,
        meta: {
          label: "Amount",
          variant: "range" as const,
        },
      },
      {
        id: "createdAt",
        accessorKey: "createdAt",
        size: 180,
        minSize: 150,
        maxSize: 220,
        header: ({ column }) => (
          <div className="flex w-full justify-center">
            <DataTableColumnHeader column={column} label="Created At" />
          </div>
        ),
        cell: ({ row }) => {
          const bill = row.original;
          if (bill.id === "empty-state") {
            return null;
          }
          if (isLoading && bill.id.startsWith("skeleton-")) {
            return (
              <div className="flex justify-center">
                <Skeleton className="h-4 w-20" />
              </div>
            );
          }
          return (
            <div className="flex justify-center">
              <DateDisplay
                date={bill.createdAt}
                className="text-muted-foreground text-sm"
              />
            </div>
          );
        },
        enableSorting: true,
        meta: {
          label: "Created At",
          variant: "dateRange" as const,
        },
      },
      {
        id: "actions",
        size: 80,
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => {
          const bill = row.original;
          if (bill.id === "empty-state") {
            return null;
          }
          if (isLoading && bill.id.startsWith("skeleton-")) {
            return (
              <div className="flex justify-end">
                <Skeleton className="h-4 w-12" />
              </div>
            );
          }
          return (
            <div className="flex justify-end">
              <Link
                href={`/bills/${bill.id}`}
                aria-label={`View bill ${bill.billNumber}`}
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
    [],
  );

  const { table } = useDataTable({
    data: displayBills,
    columns,
    pageCount: isLoading && bills.length === 0 ? 1 : pageCount,
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
    queryKeys: {
      page: "billsPage",
      perPage: "billsPerPage",
      sort: "billsSort",
      filters: "billsFilters",
    },
  });

  return (
    <DataTable
      table={table}
      renderRowFooter={(row) => {
        if (isEmpty && row.original.id === "empty-state") {
          return (
            <div className="flex flex-col items-center justify-center px-4 py-12">
              <p className="text-muted-foreground text-sm font-medium">
                No bills found
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                Try adjusting your filters or create a new bill
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
