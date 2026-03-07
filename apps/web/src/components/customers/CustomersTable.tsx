"use client";

import { useCustomerSegmentsQuery } from "@/hooks/analytics/useAnalyticsQuery";
import {
  useCustomersQuery,
  type Customer,
} from "@/hooks/customers/useCustomersQuery";
import { getDataTableConfig } from "@/lib/utils/data-table-params";
import {
  Badge,
  Button,
  buttonVariants,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  DataTable,
  DataTableColumnHeader,
  DataTableToolbar,
  DateDisplay,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Separator,
  Skeleton,
} from "@reelo/ui/components";
import { useDataTable } from "@reelo/ui/hooks";
import { cn } from "@reelo/ui/lib/utils";
import type { ColumnDef } from "@tanstack/react-table";
import { Check, Eye, PlusCircle, XCircle } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

function CustomersSegmentFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const { data } = useCustomerSegmentsQuery();

  const segmentParam = searchParams.get("segment") ?? "";
  const selectedSlugs = useMemo(
    () =>
      segmentParam
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    [segmentParam],
  );
  const selectedSet = useMemo(() => new Set(selectedSlugs), [selectedSlugs]);

  const options = useMemo(
    () =>
      (data?.segments ?? [])
        .filter((s) => s.slug !== "other")
        .sort((a, b) => b.percentage - a.percentage)
        .map((s) => ({ label: s.name, value: s.slug })),
    [data?.segments],
  );

  const updateSegment = useCallback(
    (slugs: string[]) => {
      const params = new URLSearchParams(searchParams);
      if (slugs.length === 0) {
        params.delete("segment");
      } else {
        params.set("segment", slugs.join(","));
      }
      params.set("customersPage", "1");
      router.push(`/customers?${params.toString()}`);
    },
    [router, searchParams],
  );

  const onItemSelect = useCallback(
    (value: string, isSelected: boolean) => {
      const newSet = new Set(selectedSlugs);
      if (isSelected) {
        newSet.delete(value);
      } else {
        newSet.add(value);
      }
      updateSegment(Array.from(newSet));
    },
    [selectedSlugs, updateSegment],
  );

  const onReset = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      updateSegment([]);
    },
    [updateSegment],
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="border-border/60 bg-background/50 h-10 rounded-lg font-normal"
          icon={
            selectedSet.size > 0 ? (
              <div
                role="button"
                aria-label="Clear segment filter"
                tabIndex={0}
                className="focus-visible:ring-ring rounded-sm opacity-70 transition-opacity hover:opacity-100 focus-visible:ring-1 focus-visible:outline-none"
                onClick={onReset}
              >
                <XCircle />
              </div>
            ) : (
              <PlusCircle />
            )
          }
        >
          Segment
          {selectedSet.size > 0 && (
            <>
              <Separator
                orientation="vertical"
                className="mx-0.5 data-[orientation=vertical]:h-4"
              />
              <Badge
                variant="secondary"
                className="rounded-sm px-1 font-normal lg:hidden"
              >
                {selectedSet.size}
              </Badge>
              <div className="hidden items-center gap-1 lg:flex">
                {selectedSet.size > 2 ? (
                  <Badge
                    variant="secondary"
                    className="rounded-sm px-1 font-normal"
                  >
                    {selectedSet.size} selected
                  </Badge>
                ) : (
                  options
                    .filter((o) => selectedSet.has(o.value))
                    .map((o) => (
                      <Badge
                        variant="secondary"
                        key={o.value}
                        className="rounded-sm px-1 font-normal"
                      >
                        {o.label}
                      </Badge>
                    ))
                )}
              </div>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-50 p-0" align="start">
        <Command>
          <CommandInput placeholder="Filter by segment..." />
          <CommandList className="max-h-full">
            <CommandEmpty>No segments found.</CommandEmpty>
            <CommandGroup className="max-h-[300px] scroll-py-1 overflow-x-hidden overflow-y-auto">
              {options.map((option) => {
                const isSelected = selectedSet.has(option.value);
                return (
                  <CommandItem
                    key={option.value}
                    onSelect={() => onItemSelect(option.value, isSelected)}
                  >
                    <div
                      className={cn(
                        "border-primary flex size-4 items-center justify-center rounded-sm border",
                        isSelected
                          ? "bg-primary"
                          : "opacity-50 [&_svg]:invisible",
                      )}
                    >
                      <Check />
                    </div>
                    <span className="truncate">{option.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
            {selectedSet.size > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={() => onReset()}
                    className="justify-center text-center"
                  >
                    Clear filters
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function CustomersTable() {
  const { data, isLoading, isError, error } = useCustomersQuery();

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
        cashbackBalance: 0,
        visitCount: 0,
        totalSpent: 0,
        createdAt: "",
        updatedAt: "",
      })) as Customer[];
    }
    if (isEmpty) return [] as Customer[];
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
        id: "visitCount",
        accessorKey: "visitCount",
        size: 120,
        minSize: 100,
        maxSize: 140,
        header: ({ column }) => (
          <div className="flex w-full justify-center">
            <DataTableColumnHeader column={column} label="Visits" />
          </div>
        ),
        cell: ({ row }) => {
          const customer = row.original;
          if (customer.id === "empty-state") return null;
          if (isLoading && customer.id.startsWith("skeleton-")) {
            return (
              <div className="flex justify-center">
                <Skeleton className="h-4 w-8" />
              </div>
            );
          }
          return (
            <div className="flex justify-center font-medium tabular-nums">
              {customer.visitCount}
            </div>
          );
        },
        enableSorting: true,
      },
      {
        id: "totalSpent",
        accessorKey: "totalSpent",
        size: 120,
        minSize: 100,
        maxSize: 160,
        header: ({ column }) => (
          <div className="flex w-full justify-end">
            <DataTableColumnHeader column={column} label="Total Spent" />
          </div>
        ),
        cell: ({ row }) => {
          const customer = row.original;
          if (customer.id === "empty-state") return null;
          if (isLoading && customer.id.startsWith("skeleton-")) {
            return (
              <div className="flex justify-end">
                <Skeleton className="h-4 w-16" />
              </div>
            );
          }
          return (
            <div className="flex justify-end font-medium tabular-nums">
              ₹
              {(customer.totalSpent ?? 0).toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
          );
        },
        enableSorting: true,
      },
      {
        id: "cashbackBalance",
        accessorKey: "cashbackBalance",
        size: 120,
        minSize: 100,
        maxSize: 160,
        header: ({ column }) => (
          <div className="flex w-full justify-end">
            <DataTableColumnHeader column={column} label="Cashback (₹)" />
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
          const cashback = customer.cashbackBalance ?? 0;
          return (
            <div className="flex justify-end font-medium tabular-nums">
              ₹
              {cashback.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
          );
        },
        enableSorting: true,
      },
      {
        id: "pointsBalance",
        accessorKey: "pointsBalance",
        size: 120,
        minSize: 100,
        maxSize: 160,
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
            <div className="flex justify-end font-medium tabular-nums">
              {customer.pointsBalance.toLocaleString("en-IN")}
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
      {
        id: "actions",
        size: 80,
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => {
          const customer = row.original;
          if (customer.id === "empty-state") {
            return null;
          }
          if (isLoading && customer.id.startsWith("skeleton-")) {
            return (
              <div className="flex justify-end">
                <Skeleton className="h-4 w-12" />
              </div>
            );
          }
          return (
            <div className="flex justify-end">
              <Link
                href={`/customers/${customer.id}`}
                aria-label={`View customer ${customer.name}`}
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
      columnPinning: { right: ["actions"] },
    },
    prefix: getDataTableConfig("customers").prefix,
  });

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

  return (
    <DataTable
      table={table}
      renderEmpty={() => (
        <Empty className="py-12">
          <EmptyHeader>
            <EmptyTitle>No customers found</EmptyTitle>
            <EmptyDescription>Try adjusting your filters</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    >
      <div className="flex w-full flex-nowrap items-center gap-2">
        <CustomersSegmentFilter />
        <div className="min-w-0 flex-1">
          <DataTableToolbar table={table} maxTextFilters={1} />
        </div>
      </div>
    </DataTable>
  );
}
