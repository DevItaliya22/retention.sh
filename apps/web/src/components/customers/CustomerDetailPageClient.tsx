"use client";

import { useBreadcrumbOverride } from "@/components/layouts/context/breadcrumb-override";
import { useCustomerQuery } from "@/hooks/customers/useCustomerQuery";
import { isServiceEnabled } from "@/lib/utils/service-enabled";
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
  ExternalLink,
  Eye,
  Gift,
  Link2,
  Mail,
  Phone,
  Receipt,
  Store,
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
        <div className="bg-muted/60 text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-lg">
          <Icon className="size-4" />
        </div>
      )}
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
          {label}
        </p>
        {isLoading ? (
          <Skeleton className={cn("h-5", skeletonWidth)} />
        ) : (
          <div className="text-sm leading-tight font-medium">{value}</div>
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
      <div className="bg-muted/30 flex min-h-[280px] flex-col items-center justify-center rounded-xl border border-dashed px-6 py-16 text-center">
        <div className="bg-destructive/10 text-destructive flex size-12 items-center justify-center rounded-full">
          <User className="size-6" />
        </div>
        <p className="text-foreground mt-4 font-medium">
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
      <Card className="bg-muted/30 overflow-hidden border-0 shadow-none">
        <CardContent className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:gap-8">
          <Avatar className="border-background size-16 shrink-0 border-2 text-lg font-semibold shadow-sm">
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
                {customer?.name || "—"}
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
              <User className="text-muted-foreground size-4" />
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
              <Gift className="text-muted-foreground size-4" />
              Loyalty
            </CardTitle>
            <CardDescription>Points and membership</CardDescription>
          </CardHeader>
          <CardContent className="space-y-0">
            <DetailRow
              label="Cashback balance (₹)"
              value={
                customer?.cashbackBalance != null
                  ? `₹${customer.cashbackBalance.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : "—"
              }
              icon={Gift}
              isLoading={isLoading && !customer}
              skeletonWidth="w-20"
            />
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
              label="Free items (not claimed yet)"
              value={
                customer?.freeItems != null && customer.freeItems.length > 0
                  ? `${customer.freeItems.length} item${customer.freeItems.length !== 1 ? "s" : ""}: ${customer.freeItems.map((i) => i.skuName).join(", ")}`
                  : "—"
              }
              icon={Gift}
              isLoading={isLoading && !customer}
              skeletonWidth="w-24"
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
                  <Link2 className="text-muted-foreground size-4" />
                  Loyalty link
                </CardTitle>
                <CardDescription>
                  Share this link so the customer can view their loyalty points
                  and history
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <code className="bg-muted/50 flex-1 truncate rounded-md border px-3 py-2 font-mono text-sm">
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
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="shrink-0"
                    aria-label="Open loyalty link in new tab"
                    onClick={() => {
                      if (typeof window !== "undefined") {
                        window.open(
                          loyaltyUrl,
                          "_blank",
                          "noopener,noreferrer",
                        );
                      }
                    }}
                  >
                    <ExternalLink className="size-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })()}

      {/* Referral link (when referral is enabled) */}
      {isServiceEnabled(customer?.isServiceEnabled, "referral") &&
        customer?.businessSlug &&
        customer?.referralSlug && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Link2 className="text-muted-foreground size-4" />
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
                  <code className="bg-muted/50 flex-1 truncate rounded-md border px-3 py-2 font-mono text-sm">
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

      {/* Partner redemptions: this customer used our balance at a partner store */}
      {customer?.partnerRedemptions &&
        customer.partnerRedemptions.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Store className="text-muted-foreground size-4" />
                Redeemed at partner stores
              </CardTitle>
              <CardDescription>
                This customer used your balance (cashback/points) when shopping
                at these partner stores. Useful for analytics.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Used at</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customer.partnerRedemptions.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-muted-foreground text-sm">
                        <DateDisplay date={r.createdAt} />
                      </TableCell>
                      <TableCell className="font-medium">
                        {r.valueKind === "CASHBACK"
                          ? `₹${r.amount.toFixed(2)}`
                          : `${Math.abs(Math.floor(r.amount))} pts`}
                      </TableCell>
                      <TableCell>
                        {r.redeemedAtBusinessName ?? r.redeemedAtBusinessId}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

      {/* Referral success: referred by + people they referred */}
      {(customer?.referredBy ||
        (customer?.referralLogs && customer.referralLogs.length > 0)) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="text-muted-foreground size-4" />
              Referral details
            </CardTitle>
            <CardDescription>
              Who referred this customer and who they have referred
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {customer?.referredBy && (
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                  Referred by
                </p>
                <Link
                  href={`/customers/${customer.referredBy.slugId}`}
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "sm" }),
                    "h-auto justify-start gap-2 font-medium",
                  )}
                >
                  <UserPlus className="text-muted-foreground size-4" />
                  {customer.referredBy.name}
                </Link>
              </div>
            )}
            {customer?.referralLogs && customer.referralLogs.length > 0 && (
              <div className="space-y-2">
                <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                  People they referred ({customer.referralLogs.length})
                </p>
                <ul className="bg-muted/20 space-y-2 rounded-lg border p-3">
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
                      <span className="text-muted-foreground w-full text-xs">
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
            <Receipt className="text-muted-foreground size-4" />
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
            <div className="bg-muted/20 flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
              <div className="bg-muted text-muted-foreground flex size-10 items-center justify-center rounded-full">
                <Receipt className="size-5" />
              </div>
              <p className="text-foreground mt-3 text-sm font-medium">
                No bills yet
              </p>
              <p className="text-muted-foreground mt-1 max-w-[240px] text-xs">
                Bills for this customer will show up here once they make a
                purchase.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-b hover:bg-transparent">
                  <TableHead className="font-medium">Bill number</TableHead>
                  <TableHead className="text-right font-medium">
                    Amount paid
                  </TableHead>
                  <TableHead className="text-right font-medium">
                    Cashback
                  </TableHead>
                  <TableHead className="font-medium">Date</TableHead>
                  <TableHead className="w-[72px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {bills.map((bill) => {
                  const amount =
                    bill.amount ??
                    bill.userPaidAmount ??
                    bill.finalAmount ??
                    null;
                  const hasCashbackEarned = (bill.cashbackAmount ?? 0) > 0;
                  const hasCashbackRedeemed =
                    (bill.cashbackRedeemedAmount ?? 0) > 0;
                  const hasCashback = hasCashbackEarned || hasCashbackRedeemed;
                  return (
                    <TableRow key={bill.id} className="group">
                      <TableCell className="font-mono text-sm font-medium">
                        {bill.billNumber}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {amount != null
                          ? `₹${amount.toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}`
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right text-sm tabular-nums">
                        {hasCashback ? (
                          <span className="text-muted-foreground flex flex-col items-end gap-0.5">
                            {hasCashbackEarned && (
                              <span className="text-emerald-600 dark:text-emerald-400">
                                +₹
                                {(bill.cashbackAmount ?? 0).toLocaleString(
                                  "en-IN",
                                  {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  },
                                )}{" "}
                                earned
                              </span>
                            )}
                            {hasCashbackRedeemed && (
                              <span className="text-blue-600 dark:text-blue-400">
                                −₹
                                {(
                                  bill.cashbackRedeemedAmount ?? 0
                                ).toLocaleString("en-IN", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}{" "}
                                redeemed
                              </span>
                            )}
                          </span>
                        ) : (
                          "—"
                        )}
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
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
