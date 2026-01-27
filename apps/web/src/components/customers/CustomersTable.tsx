"use client";

import { useCustomersQuery, type Customer } from "@/hooks/customers/useCustomersQuery";
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

export function CustomersTable() {
  const { data, isLoading, isError, error } = useCustomersQuery();

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-destructive text-sm font-medium">
          Failed to load customers
        </p>
        <p className="text-muted-foreground mt-1 text-sm">
          {error?.message || "Please try again later"}
        </p>
      </div>
    );
  }

  const customers = data?.items ?? [];
  const total = data?.total ?? 0;
  const perPage = data?.perPage ?? 10;
  const pageCount = Math.max(1, Math.ceil(total / perPage));
  const isEmpty = !isLoading && customers.length === 0;

  const displayCustomers = useMemo(() => {
    if (isLoading && customers.length === 0) {
      return Array.from({ length: perPage }, (_, i) => ({
        id: `skeleton-${i}`,
        slugId: "",
        customerId: "",
        name: "",
        email: "",
        phone: null,
        pointsBalance: 0,
        createdAt: "",
        updatedAt: "",
      })) as Customer[];
    }
    if (isEmpty) {
      return [
        {
          id: "empty-state",
          slugId: "",
          customerId: "",
          name: "",
          email: "",
          phone: null,
          pointsBalance: 0,
          createdAt: "",
          updatedAt: "",
        },
      ] as Customer[];
    }
    return customers;
  }, [customers, isLoading, perPage, isEmpty]);

  const columns = useMemo<ColumnDef<Customer>[]>(
    () => [
      {
        id: "name",
        accessorKey: "name",
        size: 250,
        minSize: 200,
        maxSize: 350,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Name" />
        ),
        cell: ({ row }) => {
          const customer = row.original;
          if (customer.id === "empty-state") {
            return <div className="sr-only">Empty state</div>;
          }
          if (isLoading && customer.id.startsWith("skeleton-")) {
            return <Skeleton className="h-4 w-32" />;
          }
          return <div className="font-medium">{customer.name}</div>;
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
        size: 250,
        minSize: 200,
        maxSize: 350,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Email" />
        ),
        cell: ({ row }) => {
          const customer = row.original;
          if (customer.id === "empty-state") {
            return null;
          }
          if (isLoading && customer.id.startsWith("skeleton-")) {
            return <Skeleton className="h-4 w-40" />;
          }
          return (
            <div className="text-muted-foreground text-sm">
              {customer.email}
            </div>
          );
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
        id: "phone",
        accessorKey: "phone",
        size: 180,
        minSize: 150,
        maxSize: 220,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Phone" />
        ),
        cell: ({ row }) => {
          const customer = row.original;
          if (customer.id === "empty-state") {
            return null;
          }
          if (isLoading && customer.id.startsWith("skeleton-")) {
            return <Skeleton className="h-4 w-24" />;
          }
          return (
            <div className="text-muted-foreground text-sm">
              {customer.phone || "-"}
            </div>
          );
        },
        enableColumnFilter: true,
        meta: {
          label: "Phone",
          variant: "text" as const,
          placeholder: "Filter by phone...",
          maxLength: 20,
        },
      },
      {
        id: "pointsBalance",
        accessorKey: "pointsBalance",
        size: 150,
        minSize: 120,
        maxSize: 200,
        header: ({ column }) => (
          <div className="flex w-full justify-end">
            <DataTableColumnHeader column={column} label="Points" />
          </div>
        ),
        cell: ({ row }) => {
          const customer = row.original;
          if (customer.id === "empty-state") {
            return null;
          }
          if (isLoading && customer.id.startsWith("skeleton-")) {
            return (
              <div className="flex justify-end">
                <Skeleton className="h-4 w-16" />
              </div>
            );
          }
          return (
            <div className="flex justify-end">
              <div className="font-medium">
                {customer.pointsBalance.toLocaleString("en-IN")}
              </div>
            </div>
          );
        },
        enableSorting: true,
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
          const customer = row.original;
          if (customer.id === "empty-state") {
            return null;
          }
          if (isLoading && customer.id.startsWith("skeleton-")) {
            return (
              <div className="flex justify-center">
                <Skeleton className="h-4 w-20" />
              </div>
            );
          }
          return (
            <div className="flex justify-center">
              <DateDisplay
                date={customer.createdAt}
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
    ],
    [isLoading],
  );

  const { table } = useDataTable({
    data: displayCustomers,
    columns,
    pageCount: isLoading && customers.length === 0 ? 1 : pageCount,
    shallow: false,
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: perPage,
      },
      sorting: [{ id: "createdAt", desc: true }],
    },
    queryKeys: {
      page: "customersPage",
      perPage: "customersPerPage",
      sort: "customersSort",
      filters: "customersFilters",
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
                No customers found
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                Try adjusting your filters
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
