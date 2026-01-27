"use client";

import { useBillQuery } from "@/hooks/bills/useBillQuery";
import { useBreadcrumbOverride } from "@/lib/contexts/breadcrumb-override";
import {
  buttonVariants,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DateDisplay,
  Skeleton,
} from "@reelo/ui/components";
import { cn } from "@reelo/ui/lib/utils";
import Link from "next/link";
import { useEffect } from "react";
import { User } from "lucide-react";

interface BillDetailPageClientProps {
  billId: string;
}

export function BillDetailPageClient({ billId }: BillDetailPageClientProps) {
  const { data, isLoading, isError, error } = useBillQuery(billId);
  const setSegmentLabel = useBreadcrumbOverride()?.setSegmentLabel;
  const bill = data?.bill ?? null;

  useEffect(() => {
    if (bill?.billNumber) {
      setSegmentLabel?.(bill.billNumber);
    }
    return () => {
      setSegmentLabel?.(null);
    };
  }, [bill?.billNumber, setSegmentLabel]);

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-destructive text-sm font-medium">
          Failed to load bill
        </p>
        <p className="text-muted-foreground mt-1 text-sm">
          {error?.message ?? "Please try again later"}
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Bill</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-muted-foreground text-sm">Bill number</p>
            {isLoading && !bill ? (
              <Skeleton className="mt-1 h-5 w-32" />
            ) : (
              <p className="font-mono font-medium">{bill?.billNumber}</p>
            )}
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Amount</p>
            {isLoading && !bill ? (
              <Skeleton className="mt-1 h-5 w-24" />
            ) : bill?.amount != null ? (
              <p className="font-medium">
                ₹
                {bill.amount.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            ) : (
              <p className="text-muted-foreground">-</p>
            )}
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Created</p>
            {isLoading && !bill ? (
              <Skeleton className="mt-1 h-4 w-28" />
            ) : bill?.createdAt ? (
              <DateDisplay date={bill.createdAt} className="text-sm" />
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <CardTitle>Customer</CardTitle>
          {!isLoading && bill && (
            <Link
              href={`/customers/${bill.businessCustomerId}`}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "inline-flex items-center gap-2",
              )}
            >
              <User className="h-4 w-4" />
              View customer
            </Link>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-muted-foreground text-sm">Name</p>
            {isLoading && !bill ? (
              <Skeleton className="mt-1 h-5 w-40" />
            ) : (
              <p className="font-medium">{bill?.customerName ?? "-"}</p>
            )}
          </div>
          {bill?.customerPhone ? (
            <div>
              <p className="text-muted-foreground text-sm">Phone</p>
              {isLoading && !bill ? (
                <Skeleton className="mt-1 h-5 w-28" />
              ) : (
                <p className="text-sm">{bill.customerPhone}</p>
              )}
            </div>
          ) : null}
          {bill?.customerEmail ? (
            <div>
              <p className="text-muted-foreground text-sm">Email</p>
              {isLoading && !bill ? (
                <Skeleton className="mt-1 h-5 w-48" />
              ) : (
                <p className="text-sm">{bill.customerEmail}</p>
              )}
            </div>
          ) : null}
          {!bill?.customerPhone && !bill?.customerEmail && !isLoading && (
            <p className="text-muted-foreground text-sm">
              No contact details on file
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
