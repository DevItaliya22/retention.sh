"use client";

import { useCustomerQuery } from "@/hooks/customers/useCustomerQuery";
import { useBreadcrumbOverride } from "@/lib/contexts/breadcrumb-override";
import {
  buttonVariants,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DateDisplay,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@reelo/ui/components";
import { cn } from "@reelo/ui/lib/utils";
import { Eye } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

interface CustomerDetailPageClientProps {
  slugId: string;
}

export function CustomerDetailPageClient({
  slugId,
}: CustomerDetailPageClientProps) {
  const { data, isLoading, isError, error } = useCustomerQuery(slugId);
  const setSegmentLabel = useBreadcrumbOverride()?.setSegmentLabel;
  const customer = data?.customer ?? null;

  useEffect(() => {
    if (customer?.name) {
      setSegmentLabel?.(customer.name);
    }
    return () => {
      setSegmentLabel?.(null);
    };
  }, [customer?.name, setSegmentLabel]);

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-destructive text-sm font-medium">
          Failed to load customer
        </p>
        <p className="text-muted-foreground mt-1 text-sm">
          {error?.message ?? "Please try again later"}
        </p>
      </div>
    );
  }

  const bills = customer?.bills ?? [];
  const showBillsSkeleton = isLoading && !customer;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Customer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-muted-foreground text-sm">Name</p>
              {isLoading && !customer ? (
                <Skeleton className="mt-1 h-5 w-40" />
              ) : (
                <p className="font-medium">{customer?.name ?? "-"}</p>
              )}
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Email</p>
              {isLoading && !customer ? (
                <Skeleton className="mt-1 h-5 w-48" />
              ) : (
                <p className="text-sm">{customer?.email ?? "-"}</p>
              )}
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Phone</p>
              {isLoading && !customer ? (
                <Skeleton className="mt-1 h-5 w-28" />
              ) : (
                <p className="text-sm">{customer?.phone ?? "-"}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Loyalty</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-muted-foreground text-sm">Points balance</p>
              {isLoading && !customer ? (
                <Skeleton className="mt-1 h-5 w-16" />
              ) : (
                <p className="font-medium">
                  {customer?.pointsBalance != null
                    ? customer.pointsBalance.toLocaleString("en-IN")
                    : "-"}
                </p>
              )}
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Member since</p>
              {isLoading && !customer ? (
                <Skeleton className="mt-1 h-4 w-28" />
              ) : customer?.createdAt ? (
                <DateDisplay date={customer.createdAt} className="text-sm" />
              ) : (
                <span className="text-muted-foreground">-</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bills</CardTitle>
        </CardHeader>
        <CardContent>
          {showBillsSkeleton ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : bills.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No bills for this customer yet
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bill number</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-[80px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {bills.map((bill) => (
                  <TableRow key={bill.id}>
                    <TableCell className="font-mono font-medium">
                      {bill.billNumber}
                    </TableCell>
                    <TableCell className="text-right">
                      {bill.amount != null
                        ? `₹${bill.amount.toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}`
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <DateDisplay
                        date={bill.createdAt}
                        className="text-muted-foreground text-sm"
                      />
                    </TableCell>
                    <TableCell>
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
