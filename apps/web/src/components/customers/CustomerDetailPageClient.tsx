"use client";

import { useCustomerQuery } from "@/hooks/customers/useCustomerQuery";
import { useBreadcrumbOverride } from "@/lib/contexts/breadcrumb-override";
import {
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  buttonVariants,
  Card,
  CardContent,
  CardDescription,
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
import {
  CalendarDays,
  Copy,
  Eye,
  Gift,
  Link2,
  Mail,
  Phone,
  Receipt,
  User,
  UserPlus,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { toast } from "sonner";

interface CustomerDetailPageClientProps {
  slugId: string;
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
      <div className="flex min-h-[280px] flex-col items-center justify-center rounded-xl border border-dashed bg-muted/30 px-6 py-16 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <User className="size-6" />
        </div>
        <p className="mt-4 font-medium text-foreground">
          Failed to load customer
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {error?.message ?? "Please try again later"}
        </p>
      </div>
    );
  }

  const bills = customer?.bills ?? [];
  const showBillsSkeleton = isLoading && !customer;
  const initials =
    customer?.name
      ?.split(/\s+/)
      .map((s) => s[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() ?? "—";

  return (
    <div className="space-y-8">
      {/* Profile header */}
      <Card className="overflow-hidden border-0 bg-muted/30 shadow-none">
        <CardContent className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:gap-8">
          <Avatar className="size-16 shrink-0 border-2 border-background text-lg font-semibold shadow-sm">
            <AvatarFallback className="bg-primary/10 text-primary">
              {isLoading && !customer ? (
                <Skeleton className="size-8 rounded-full" />
              ) : (
                initials
              )}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 space-y-1">
            {isLoading && !customer ? (
              <Skeleton className="h-7 w-48" />
            ) : (
              <h2 className="truncate text-xl font-semibold tracking-tight">
                {customer?.name ?? "—"}
              </h2>
            )}
            <div className="flex flex-wrap items-center gap-2">
              {!isLoading && customer?.createdAt && (
                <Badge variant="secondary" size="xs" className="font-normal">
                  <CalendarDays className="mr-1 size-3" />
                  Member since{" "}
                  <DateDisplay
                    date={customer.createdAt}
                    className="ml-0.5 inline"
                    formatOptions={{ month: "short", year: "numeric" }}
                  />
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Contact & details */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="size-4 text-muted-foreground" />
              Contact & details
            </CardTitle>
            <CardDescription>Email, phone and basic info</CardDescription>
          </CardHeader>
          <CardContent className="space-y-0">
            <DetailRow
              label="Name"
              value={customer?.name ?? "—"}
              icon={User}
              isLoading={isLoading && !customer}
              skeletonWidth="w-40"
            />
            <DetailRow
              label="Email"
              value={customer?.email ?? "—"}
              icon={Mail}
              isLoading={isLoading && !customer}
              skeletonWidth="w-48"
            />
            <DetailRow
              label="Phone"
              value={customer?.phone ?? "—"}
              icon={Phone}
              isLoading={isLoading && !customer}
              skeletonWidth="w-28"
            />
          </CardContent>
        </Card>

        {/* Loyalty */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Gift className="size-4 text-muted-foreground" />
              Loyalty
            </CardTitle>
            <CardDescription>Points and membership</CardDescription>
          </CardHeader>
          <CardContent className="space-y-0">
            <DetailRow
              label="Points balance"
              value={
                customer?.pointsBalance != null
                  ? customer.pointsBalance.toLocaleString("en-IN")
                  : "—"
              }
              icon={Gift}
              isLoading={isLoading && !customer}
              skeletonWidth="w-16"
            />
            <DetailRow
              label="Member since"
              value={
                customer?.createdAt ? (
                  <DateDisplay date={customer.createdAt} />
                ) : (
                  "—"
                )
              }
              icon={CalendarDays}
              isLoading={isLoading && !customer}
              skeletonWidth="w-28"
            />
          </CardContent>
        </Card>
      </div>

      {/* Loyalty link (when customer has phone and business slug) */}
      {customer?.phone &&
        customer?.businessSlug &&
        !isLoading &&
        (() => {
          const phone = customer.phone ?? "";
          const businessSlug = customer.businessSlug ?? "";
          const loyaltyUrl =
            typeof window !== "undefined"
              ? `${window.location.origin}/loyalty/${encodeURIComponent(businessSlug)}/login?phone=${encodeURIComponent(phone)}`
              : `/loyalty/${encodeURIComponent(businessSlug)}/login?phone=${encodeURIComponent(phone)}`;
          return (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Link2 className="size-4 text-muted-foreground" />
                  Loyalty link
                </CardTitle>
                <CardDescription>
                  Share this link so the customer can view their loyalty points
                  and history
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <code className="flex-1 truncate rounded-md border bg-muted/50 px-3 py-2 text-sm font-mono">
                    {loyaltyUrl}
                  </code>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="shrink-0"
                    onClick={() => {
                      if (
                        typeof window !== "undefined" &&
                        navigator.clipboard?.writeText
                      ) {
                        navigator.clipboard.writeText(loyaltyUrl);
                        toast.success("Link copied to clipboard");
                      }
                    }}
                    aria-label="Copy loyalty link"
                  >
                    <Copy className="size-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })()}

      {/* Referral link (when referral is enabled) */}
      {customer?.referralEnabled &&
        customer?.businessSlug &&
        customer?.referralSlug && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Link2 className="size-4 text-muted-foreground" />
                Referral link
              </CardTitle>
              <CardDescription>
                Share this link with friends so they can join and you both get
                rewards
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading && !customer ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <div className="flex items-center gap-2">
                  <code className="flex-1 truncate rounded-md border bg-muted/50 px-3 py-2 text-sm font-mono">
                    {typeof window !== "undefined"
                      ? `${window.location.origin}/referral/${customer.businessSlug}/${customer.referralSlug}`
                      : `/referral/${customer.businessSlug}/${customer.referralSlug}`}
                  </code>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="shrink-0"
                    onClick={() => {
                      const url =
                        typeof window !== "undefined"
                          ? `${window.location.origin}/referral/${customer.businessSlug}/${customer.referralSlug}`
                          : "";
                      if (url && navigator.clipboard?.writeText) {
                        navigator.clipboard.writeText(url);
                        toast.success("Link copied to clipboard");
                      }
                    }}
                    aria-label="Copy referral link"
                  >
                    <Copy className="size-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

      {/* Referral success: referred by + people they referred */}
      {(customer?.referredBy ||
        (customer?.referralLogs && customer.referralLogs.length > 0)) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="size-4 text-muted-foreground" />
              Referral details
            </CardTitle>
            <CardDescription>
              Who referred this customer and who they have referred
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {customer?.referredBy && (
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Referred by
                </p>
                <Link
                  href={`/customers/${customer.referredBy.slugId}`}
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "sm" }),
                    "h-auto justify-start gap-2 font-medium",
                  )}
                >
                  <UserPlus className="size-4 text-muted-foreground" />
                  {customer.referredBy.name}
                </Link>
              </div>
            )}
            {customer?.referralLogs && customer.referralLogs.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  People they referred ({customer.referralLogs.length})
                </p>
                <ul className="space-y-2 rounded-lg border bg-muted/20 p-3">
                  {customer.referralLogs.map((log) => (
                    <li
                      key={log.id}
                      className="flex flex-wrap items-center justify-between gap-2 text-sm"
                    >
                      <span className="font-medium">
                        {log.newCustomerName || "—"}
                      </span>
                      <span className="text-muted-foreground font-mono text-xs">
                        {log.newCustomerPhone}
                      </span>
                      {log.becameCustomer && (
                        <Badge variant="secondary" size="xs">
                          Claimed
                        </Badge>
                      )}
                      <span className="w-full text-xs text-muted-foreground">
                        <DateDisplay date={log.createdAt} />
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Bills */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Receipt className="size-4 text-muted-foreground" />
            Bills
          </CardTitle>
          <CardDescription>
            {bills.length > 0
              ? `${bills.length} bill${bills.length === 1 ? "" : "s"} for this customer`
              : "Transaction history"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {showBillsSkeleton ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : bills.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/20 py-12 text-center">
              <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Receipt className="size-5" />
              </div>
              <p className="mt-3 text-sm font-medium text-foreground">
                No bills yet
              </p>
              <p className="mt-1 max-w-[240px] text-xs text-muted-foreground">
                Bills for this customer will show up here once they make a
                purchase.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b">
                  <TableHead className="font-medium">Bill number</TableHead>
                  <TableHead className="text-right font-medium">
                    Amount
                  </TableHead>
                  <TableHead className="font-medium">Date</TableHead>
                  <TableHead className="w-[72px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {bills.map((bill) => (
                  <TableRow key={bill.id} className="group">
                    <TableCell className="font-mono text-sm font-medium">
                      {bill.billNumber}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {bill.amount != null
                        ? `₹${bill.amount.toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}`
                        : "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      <DateDisplay date={bill.createdAt} />
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/bills/${bill.id}`}
                        aria-label={`View bill ${bill.billNumber}`}
                        className={cn(
                          buttonVariants({ variant: "ghost", size: "xs" }),
                          "h-8 w-8 p-0 opacity-70 transition-opacity hover:opacity-100",
                        )}
                      >
                        <Eye className="size-4" />
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
