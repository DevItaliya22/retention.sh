"use client";

import { useBillsQuery, type Bill } from "@/hooks/bills/useBillsQuery";
import { getDataTableConfig } from "@/lib/utils/data-table-params";
import {
  buttonVariants,
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
  Skeleton,
} from "@reelo/ui/components";
import { useDataTable } from "@reelo/ui/hooks";
import { cn } from "@reelo/ui/lib/utils";
import type { ColumnDef } from "@tanstack/react-table";
import { Eye, MessageSquare } from "lucide-react";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";

function BillFeedbackPopover({
  bill,
  businessSlug,
}: {
  bill: Bill;
  businessSlug: string;
}) {
  const [open, setOpen] = useState(false);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearCloseTimeout = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  const handleOpen = () => {
    clearCloseTimeout();
    setOpen(true);
  };

  const handleClose = () => {
    closeTimeoutRef.current = setTimeout(() => setOpen(false), 150);
  };

  const hasFeedback = !!bill.feedback;
  const rating = bill.feedback?.rating ?? null;
  const isNegative = rating !== null && rating <= 2;

  if (!bill.feedbackLink || !hasFeedback) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          tabIndex={-1}
          onClick={(e) => e.stopPropagation()}
          onMouseEnter={handleOpen}
          onMouseLeave={(e) => {
            handleClose();
            e.currentTarget.blur();
          }}
          aria-label={`Feedback for bill ${bill.billNumber}`}
          className={cn(
            buttonVariants({ variant: "ghost", size: "xs" }),
            "h-8 w-8 p-0",
            isNegative ? "text-red-600 dark:text-red-400" : "text-primary",
          )}
        >
          <MessageSquare className="h-4 w-4" fill="currentColor" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="z-[100] w-72 p-4"
        align="end"
        side="top"
        onMouseEnter={clearCloseTimeout}
        onMouseLeave={handleClose}
      >
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              Feedback
            </p>
            {rating !== null && (
              <p className="text-sm font-medium">
                {rating}
                <span className="text-muted-foreground text-xs">/5</span>
              </p>
            )}
          </div>
          {bill.feedback?.selectionOptions &&
            bill.feedback.selectionOptions.length > 0 && (
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs font-medium">
                  Selection options
                </p>
                <div className="flex flex-wrap gap-1">
                  {bill.feedback.selectionOptions.map((opt) => (
                    <span
                      key={opt.id}
                      className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs"
                    >
                      {opt.label}
                    </span>
                  ))}
                </div>
              </div>
            )}
          {bill.feedback?.howDidYouHear && (
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs font-medium">
                How did they hear?
              </p>
              <p className="text-xs">{bill.feedback.howDidYouHear}</p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function BillsTable() {
  const { data, isLoading, isError, error } = useBillsQuery();

  const bills = data?.bills ?? [];
  const businessSlug = data?.businessSlug ?? "";
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
        feedbackLink: null,
        feedback: null,
        lineItems: [],
        createdAt: "",
        updatedAt: "",
      })) as Bill[];
    }
    if (isEmpty) return [] as Bill[];
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
        id: "amount",
        accessorKey: "amount",
        size: 120,
        minSize: 100,
        maxSize: 160,
        header: ({ column }) => (
          <div className="flex w-full justify-end">
            <DataTableColumnHeader column={column} label="Amount paid" />
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
          const amount =
            bill.amount ?? bill.userPaidAmount ?? bill.finalAmount ?? null;
          return (
            <div className="flex justify-end">
              {amount !== null ? (
                <div className="font-medium tabular-nums">
                  ₹
                  {amount.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </div>
          );
        },
        enableColumnFilter: true,
        enableSorting: true,
        meta: {
          label: "Amount paid",
          variant: "range" as const,
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
            <div className="text-muted-foreground flex justify-center text-sm tabular-nums">
              {count === 0 ? "—" : totalQty}
            </div>
          );
        },
        enableSorting: false,
      },
      {
        id: "redeemed",
        size: 130,
        minSize: 100,
        maxSize: 180,
        header: () => (
          <div className="flex w-full justify-end">
            <span className="text-xs font-medium">Redeemed</span>
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
                <Skeleton className="h-4 w-14" />
              </div>
            );
          }
          const cashbackRedeemed = bill.cashbackRedeemedAmount ?? 0;
          const pointsRedeemed = bill.loyaltyPointsRedeemed ?? 0;
          const hasCashback = cashbackRedeemed > 0;
          const hasPoints = pointsRedeemed > 0;
          if (!hasCashback && !hasPoints) {
            return (
              <div className="text-muted-foreground flex justify-end text-sm">
                —
              </div>
            );
          }
          return (
            <div className="flex justify-end text-sm tabular-nums">
              {hasCashback ? (
                <span className="text-blue-600 dark:text-blue-400">
                  −₹
                  {cashbackRedeemed.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              ) : (
                <span className="text-blue-600 dark:text-blue-400">
                  −{pointsRedeemed} pts
                </span>
              )}
            </div>
          );
        },
        enableSorting: false,
      },
      {
        id: "earned",
        size: 130,
        minSize: 100,
        maxSize: 180,
        header: () => (
          <div className="flex w-full justify-end">
            <span className="text-xs font-medium">Earned</span>
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
                <Skeleton className="h-4 w-14" />
              </div>
            );
          }
          const cashbackEarned = bill.cashbackAmount ?? 0;
          const pointsEarned = bill.loyaltyPointsEarned ?? 0;
          const hasCashback = cashbackEarned > 0;
          const hasPoints = pointsEarned > 0;
          if (!hasCashback && !hasPoints) {
            return (
              <div className="text-muted-foreground flex justify-end text-sm">
                —
              </div>
            );
          }
          return (
            <div className="flex justify-end text-sm tabular-nums">
              {hasCashback ? (
                <span className="text-emerald-600 dark:text-emerald-400">
                  +₹
                  {cashbackEarned.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              ) : (
                <span className="text-emerald-600 dark:text-emerald-400">
                  +{pointsEarned} pts
                </span>
              )}
            </div>
          );
        },
        enableSorting: false,
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
            <div className="flex justify-end gap-1">
              {bill.feedbackLink && businessSlug && (
                <>
                  <BillFeedbackPopover
                    bill={bill}
                    businessSlug={businessSlug}
                  />
                  {!bill.feedback && (
                    <Link
                      href={`/feedback/${businessSlug}/${bill.feedbackLink!.token}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Feedback link for bill ${bill.billNumber}`}
                      className={cn(
                        buttonVariants({ variant: "ghost", size: "xs" }),
                        "h-8 w-8 p-0",
                      )}
                      title="Feedback link"
                    >
                      <MessageSquare className="h-4 w-4" />
                    </Link>
                  )}
                </>
              )}
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
    [businessSlug],
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
    prefix: getDataTableConfig("bills").prefix,
  });

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

  return (
    <DataTable
      table={table}
      renderEmpty={() => (
        <Empty className="py-12">
          <EmptyHeader>
            <EmptyTitle>No bills found</EmptyTitle>
            <EmptyDescription>
              Try adjusting your filters or create a new bill
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    >
      <DataTableToolbar table={table} maxTextFilters={1} />
    </DataTable>
  );
}
