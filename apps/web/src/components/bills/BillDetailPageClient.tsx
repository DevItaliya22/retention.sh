"use client";

import { useBillQuery } from "@/hooks/bills/useBillQuery";
import { useBreadcrumbOverride } from "@/lib/contexts/breadcrumb-override";
import {
  buttonVariants,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DateDisplay,
  Skeleton,
} from "@reelo/ui/components";
import { cn } from "@reelo/ui/lib/utils";
import { CalendarDays, Mail, Phone, Receipt, User } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

interface BillDetailPageClientProps {
  billId: string;
}

function DetailRow({
  label,
  value,
  icon: Icon,
  isLoading,
  skeletonWidth = "w-32",
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  isLoading?: boolean;
  skeletonWidth?: string;
}) {
  return (
    <div className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
      {Icon && (
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground">
          <Icon className="size-4" />
        </div>
      )}
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        {isLoading ? (
          <Skeleton className={cn("h-5", skeletonWidth)} />
        ) : (
          <div className="text-sm font-medium leading-tight">{value}</div>
        )}
      </div>
    </div>
  );
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
      <div className="flex min-h-[280px] flex-col items-center justify-center rounded-xl border border-dashed bg-muted/30 px-6 py-16 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <Receipt className="size-6" />
        </div>
        <p className="mt-4 font-medium text-foreground">Failed to load bill</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {error?.message ?? "Please try again later"}
        </p>
      </div>
    );
  }

  const amountFormatted =
    bill?.amount != null
      ? `₹${bill.amount.toLocaleString("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`
      : "—";

  return (
    <div className="space-y-8">
      {/* Bill header */}
      <Card className="overflow-hidden border-0 bg-muted/30 shadow-none">
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Bill number
            </p>
            {isLoading && !bill ? (
              <Skeleton className="h-7 w-36" />
            ) : (
              <p className="font-mono text-xl font-semibold tracking-tight">
                {bill?.billNumber ?? "—"}
              </p>
            )}
          </div>
          <div className="flex items-baseline gap-2 sm:text-right">
            {isLoading && !bill ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <span className="text-2xl font-semibold tabular-nums text-foreground">
                {amountFormatted}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Bill info */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Receipt className="size-4 text-muted-foreground" />
              Bill details
            </CardTitle>
            <CardDescription>Number, amount and date</CardDescription>
          </CardHeader>
          <CardContent className="space-y-0">
            <DetailRow
              label="Bill number"
              value={bill?.billNumber ?? "—"}
              icon={Receipt}
              isLoading={isLoading && !bill}
              skeletonWidth="w-32"
            />
            <DetailRow
              label="Amount"
              value={amountFormatted}
              icon={Receipt}
              isLoading={isLoading && !bill}
              skeletonWidth="w-24"
            />
            <DetailRow
              label="Created"
              value={
                bill?.createdAt ? <DateDisplay date={bill.createdAt} /> : "—"
              }
              icon={CalendarDays}
              isLoading={isLoading && !bill}
              skeletonWidth="w-28"
            />
          </CardContent>
        </Card>

        {/* Customer */}
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4 pb-2">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="size-4 text-muted-foreground" />
                Customer
              </CardTitle>
              <CardDescription>Linked customer for this bill</CardDescription>
            </div>
            {!isLoading && bill && (
              <Link
                href={`/customers/${bill.businessCustomerId}`}
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "shrink-0 gap-2",
                )}
              >
                <User className="size-4" />
                View customer
              </Link>
            )}
          </CardHeader>
          <CardContent className="space-y-0">
            <DetailRow
              label="Name"
              value={bill?.customerName ?? "—"}
              icon={User}
              isLoading={isLoading && !bill}
              skeletonWidth="w-40"
            />
            {(bill?.customerPhone ?? isLoading) && (
              <DetailRow
                label="Phone"
                value={bill?.customerPhone ?? "—"}
                icon={Phone}
                isLoading={isLoading && !bill}
                skeletonWidth="w-28"
              />
            )}
            {(bill?.customerEmail ?? isLoading) && (
              <DetailRow
                label="Email"
                value={bill?.customerEmail ?? "—"}
                icon={Mail}
                isLoading={isLoading && !bill}
                skeletonWidth="w-48"
              />
            )}
            {!isLoading && !bill?.customerPhone && !bill?.customerEmail && (
              <div className="flex items-start gap-3 py-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground">
                  <Mail className="size-4" />
                </div>
                <div className="min-w-0 flex-1 space-y-0.5">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Contact
                  </p>
                  <p className="text-sm text-muted-foreground">
                    No contact details on file for this bill
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
