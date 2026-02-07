"use client";

import { fetcher } from "@/lib/fetcher";
import { buttonVariants, DateDisplay, Skeleton } from "@reelo/ui/components";
import { cn } from "@reelo/ui/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { CashierNav } from "../../../_components/CashierNav";
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

  if (isError) {
    return (
      <div className="bg-background flex min-h-screen flex-col items-center p-4">
        <div className="w-full max-w-2xl space-y-6">
          <div className="flex justify-center">
            <CashierNav />
          </div>
          <div className="border-destructive/30 bg-destructive/5 rounded-lg border px-4 py-3">
            <p className="text-destructive text-sm">
              {error?.message ?? "Failed to load bill"}
            </p>
          </div>
          <Link
            href={billsPath}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to My Bills
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading || !bill) {
    return (
      <div className="bg-background flex min-h-screen flex-col items-center p-4">
        <div className="w-full max-w-2xl space-y-6">
          <div className="flex justify-center">
            <CashierNav />
          </div>
          <div className="w-full space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background flex min-h-screen flex-col items-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="flex justify-center">
          <CashierNav />
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={billsPath}
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back
          </Link>
        </div>

        <div className="space-y-6 rounded-lg border p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-semibold">Bill #{bill.billNumber}</h2>
              <p className="text-muted-foreground mt-1 text-sm">
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
            <div className="text-right">
              <p className="text-muted-foreground text-sm">Amount</p>
              <p className="font-mono text-lg font-semibold">
                {bill.amount != null ? `₹${bill.amount.toFixed(2)}` : "—"}
              </p>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-muted-foreground mb-2 text-xs font-medium uppercase">
              Customer
            </h3>
            <p className="font-medium">{bill.customerName}</p>
            {bill.customerPhone && (
              <p className="text-muted-foreground text-sm">
                {bill.customerPhone}
              </p>
            )}
            {bill.customerEmail && (
              <p className="text-muted-foreground text-sm">
                {bill.customerEmail}
              </p>
            )}
          </div>

          {bill.lineItems.length > 0 && (
            <div className="border-t pt-4">
              <h3 className="text-muted-foreground mb-2 text-xs font-medium uppercase">
                Line Items
              </h3>
              <ul className="space-y-2">
                {bill.lineItems.map((li) => (
                  <li
                    key={li.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span>
                      {li.sku.name} × {li.qty}
                    </span>
                    {li.unitPrice != null && (
                      <span className="font-mono">
                        ₹{(li.unitPrice * li.qty).toFixed(2)}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {bill.notes && (
            <div className="border-t pt-4">
              <h3 className="text-muted-foreground mb-2 text-xs font-medium uppercase">
                Notes
              </h3>
              <p className="text-sm">{bill.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
