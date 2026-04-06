"use client";

import { useCashierBillsQuery } from "@/hooks/cashier/useCashierBillsQuery";
import { buttonVariants, DateDisplay, Skeleton } from "@reelo/ui/components";
import { cn } from "@reelo/ui/lib/utils";
import { ReceiptText } from "lucide-react";
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
      <div className="bg-destructive/5 rounded-lg px-4 py-3">
        <p className="text-destructive text-sm">
          {error?.message ?? "Failed to load bills"}
        </p>
      </div>
    );
  }

  const bills = data?.bills ?? [];
  const total = data?.total ?? 0;
  const page = data?.page ?? 1;
  const perPage = data?.perPage ?? 10;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const isEmpty = !isLoading && bills.length === 0;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between pb-2">
        <h2 className="text-sm font-semibold">Recent Bills</h2>
        {total > 0 && (
          <span className="text-muted-foreground text-xs tabular-nums">
            {total} bill{total !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="divide-y">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-3.5">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-36" />
              </div>
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      ) : isEmpty ? (
        <div className="py-16 text-center">
          <ReceiptText className="text-muted-foreground/30 mx-auto mb-3 h-12 w-12" />
          <p className="text-muted-foreground text-sm font-medium">
            No bills yet
          </p>
          <p className="text-muted-foreground/70 mt-1 text-xs">
            Bills you create will appear here.
          </p>
        </div>
      ) : (
        <>
          <div className="divide-y">
            {bills.map((bill) => (
              <Link
                key={bill.id}
                href={`${billsPath}/${bill.id}`}
                className="active:bg-muted/50 flex items-center justify-between py-3.5 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-sm leading-tight font-semibold">
                    {bill.billNumber}
                  </p>
                  <div className="text-muted-foreground mt-1 flex items-center gap-1.5 text-xs">
                    {bill.customerName && (
                      <>
                        <span className="max-w-[140px] truncate">
                          {bill.customerName}
                        </span>
                        <span className="text-muted-foreground/40">·</span>
                      </>
                    )}
                    <DateDisplay date={bill.createdAt} relative />
                  </div>
                </div>
                <span className="shrink-0 pl-4 font-mono text-sm font-semibold tabular-nums">
                  {bill.amount != null ? `₹${bill.amount.toFixed(2)}` : "—"}
                </span>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <nav className="flex items-center justify-center gap-3 pt-4">
              {page > 1 ? (
                <Link
                  href={`?page=${page - 1}&perPage=${perPage}`}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "h-8 text-xs",
                  )}
                >
                  Previous
                </Link>
              ) : (
                <span
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "h-8 cursor-not-allowed text-xs opacity-40",
                  )}
                >
                  Previous
                </span>
              )}
              <span className="text-muted-foreground text-xs tabular-nums">
                {page} / {totalPages}
              </span>
              {page < totalPages ? (
                <Link
                  href={`?page=${page + 1}&perPage=${perPage}`}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "h-8 text-xs",
                  )}
                >
                  Next
                </Link>
              ) : (
                <span
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "h-8 cursor-not-allowed text-xs opacity-40",
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
