"use client";

import { useCashierBillsQuery } from "@/hooks/cashier/useCashierBillsQuery";
import { buttonVariants, DateDisplay, Skeleton } from "@reelo/ui/components";
import { cn } from "@reelo/ui/lib/utils";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCashierContext } from "../_context/CashierContext";

export function CashierBillsList() {
  useCashierContext();
  const pathname = usePathname();
  const billsPath = pathname.replace(/\/bills.*$/, "") + "/bills";
  const { data, isLoading, isError, error } = useCashierBillsQuery();

  if (isError) {
    return (
      <div className="border-destructive/30 bg-destructive/5 rounded-lg border px-4 py-3">
        <p className="text-destructive text-sm">
          {error?.message ?? "Failed to load bills"}
        </p>
      </div>
    );
  }

  const bills = data?.bills ?? [];
  const total = data?.total ?? 0;
  const page = data?.page ?? 1;
  const perPage = data?.perPage ?? 20;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const isEmpty = !isLoading && bills.length === 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">My Bills</h2>
        {total > 0 && (
          <p className="text-muted-foreground text-sm">
            {total} bill{total !== 1 ? "s" : ""} total
          </p>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : isEmpty ? (
        <div className="rounded-lg border border-dashed py-12 text-center">
          <p className="text-muted-foreground text-sm">
            No bills yet. Create your first bill to see it here.
          </p>
        </div>
      ) : (
        <>
          <ul className="space-y-2">
            {bills.map((bill) => (
              <li key={bill.id}>
                <button
                  type="button"
                  onClick={() =>
                    window.open(
                      `${billsPath}/${bill.id}`,
                      "_blank",
                      "noopener,noreferrer",
                    )
                  }
                  className="bg-muted/30 hover:bg-muted/50 flex w-full items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <span className="font-mono font-medium">
                      {bill.billNumber}
                    </span>
                    <span className="text-muted-foreground ml-2 text-xs">
                      <DateDisplay date={bill.createdAt} relative />
                    </span>
                    {bill.customerName && (
                      <p className="text-muted-foreground mt-0.5 truncate text-sm">
                        {bill.customerName}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-muted-foreground text-sm tabular-nums">
                      {bill.amount != null ? `₹${bill.amount.toFixed(2)}` : "—"}
                    </span>
                    <ExternalLink className="text-muted-foreground h-4 w-4 shrink-0" />
                  </div>
                </button>
              </li>
            ))}
          </ul>

          {totalPages > 1 && (
            <nav className="flex items-center justify-center gap-2 pt-2">
              {page > 1 ? (
                <Link
                  href={`?page=${page - 1}&perPage=${perPage}`}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                  )}
                >
                  Previous
                </Link>
              ) : (
                <span
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "cursor-not-allowed opacity-50",
                  )}
                >
                  Previous
                </span>
              )}
              <span className="text-muted-foreground text-sm">
                Page {page} of {totalPages}
              </span>
              {page < totalPages ? (
                <Link
                  href={`?page=${page + 1}&perPage=${perPage}`}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                  )}
                >
                  Next
                </Link>
              ) : (
                <span
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "cursor-not-allowed opacity-50",
                  )}
                >
                  Next
                </span>
              )}
            </nav>
          )}
        </>
      )}
    </div>
  );
}
