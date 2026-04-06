"use client";

import { fetcher } from "@/lib/fetcher";
import { DateDisplay, Separator, Skeleton } from "@reelo/ui/components";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { CashierLogoutButton } from "../../../_components/CashierLogoutButton";
import { CashierMobileLayout } from "../../../_components/CashierMobileLayout";
import { useCashierContext } from "../../../_context/CashierContext";

interface CashierBillDetailContentProps {
  billId: string;
}

interface BillDetailResponse {
  bill: {
    id: string;
    billNumber: string;
    amount: number | null;
    notes: string | null;
    customerName: string;
    customerPhone: string | null;
    customerEmail: string;
    lineItems: Array<{
      id: string;
      skuId: string;
      qty: number;
      unitPrice: number | null;
      sku: {
        id: string;
        sku: string;
        name: string;
        price: number | null;
        unit: string | null;
      };
    }>;
    createdAt: string;
  };
}

export function CashierBillDetailContent({
  billId,
}: CashierBillDetailContentProps) {
  const { businessSlug, cashierSlug } = useCashierContext();
  const basePath = `/cashier/${businessSlug}/${cashierSlug}/home`;
  const billsPath = `${basePath}/bills`;

  const { data, isLoading, isError, error } = useQuery<
    BillDetailResponse,
    Error
  >({
    queryKey: ["cashier", "bill", billId],
    queryFn: () => fetcher<BillDetailResponse>(`/api/cashier/bills/${billId}`),
  });

  const bill = data?.bill;

  return (
    <CashierMobileLayout>
      <header className="bg-background/95 sticky top-0 z-10 border-b backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <Link
              href={billsPath}
              className="text-muted-foreground hover:text-foreground -ml-1 rounded-full p-1 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="truncate text-base font-semibold tracking-tight">
              Bill Details
            </h1>
          </div>
          <CashierLogoutButton
            businessSlug={businessSlug}
            cashierSlug={cashierSlug}
          />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        {isError ? (
          <div className="px-4 py-12 text-center">
            <p className="text-destructive text-sm">
              {error?.message ?? "Failed to load bill"}
            </p>
            <Link
              href={billsPath}
              className="text-primary mt-3 inline-block text-sm font-medium"
            >
              Back to My Bills
            </Link>
          </div>
        ) : isLoading || !bill ? (
          <div className="space-y-6 p-4">
            <div className="space-y-2 py-4 text-center">
              <Skeleton className="mx-auto h-9 w-36" />
              <Skeleton className="mx-auto h-4 w-24" />
              <Skeleton className="mx-auto h-3 w-40" />
            </div>
            <Skeleton className="h-px w-full" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>
        ) : (
          <div className="pb-8">
            <div className="space-y-1.5 px-4 py-8 text-center">
              <p className="font-mono text-3xl font-bold tracking-tight tabular-nums">
                {bill.amount != null ? `₹${bill.amount.toFixed(2)}` : "—"}
              </p>
              <p className="text-muted-foreground text-sm font-medium">
                Bill #{bill.billNumber}
              </p>
              <p className="text-muted-foreground/70 text-xs">
                <DateDisplay
                  date={bill.createdAt}
                  relative={false}
                  formatOptions={{
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }}
                />
              </p>
            </div>

            <Separator />

            <div className="space-y-1.5 px-4 py-4">
              <p className="text-muted-foreground text-[10px] font-semibold tracking-widest uppercase">
                Customer
              </p>
              <p className="text-sm font-medium">{bill.customerName}</p>
              {bill.customerPhone && (
                <p className="text-muted-foreground text-xs">
                  {bill.customerPhone}
                </p>
              )}
              {bill.customerEmail && (
                <p className="text-muted-foreground text-xs">
                  {bill.customerEmail}
                </p>
              )}
            </div>

            {bill.lineItems.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3 px-4 py-4">
                  <p className="text-muted-foreground text-[10px] font-semibold tracking-widest uppercase">
                    Items
                  </p>
                  <div className="space-y-2">
                    {bill.lineItems.map((li) => (
                      <div
                        key={li.id}
                        className="flex items-baseline justify-between text-sm"
                      >
                        <div className="min-w-0 flex-1">
                          <span>{li.sku.name}</span>
                          <span className="text-muted-foreground ml-1.5">
                            × {li.qty}
                          </span>
                        </div>
                        {li.unitPrice != null && (
                          <span className="shrink-0 pl-3 font-mono tabular-nums">
                            ₹{(li.unitPrice * li.qty).toFixed(2)}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {bill.notes && (
              <>
                <Separator />
                <div className="space-y-1.5 px-4 py-4">
                  <p className="text-muted-foreground text-[10px] font-semibold tracking-widest uppercase">
                    Notes
                  </p>
                  <p className="text-muted-foreground text-sm">{bill.notes}</p>
                </div>
              </>
            )}
          </div>
        )}
      </main>
    </CashierMobileLayout>
  );
}
