"use client";

import { useBreadcrumbOverride } from "@/components/layouts/context/breadcrumb-override";
import {
  useCustomerQuery,
  type CustomerActivityItem,
} from "@/hooks/customers/useCustomerQuery";
import type { FreeItemEntry } from "@/lib/utils/free-items";
import { isServiceEnabled } from "@/lib/utils/service-enabled";
import {
  Badge,
  Button,
  ButtonGroup,
  buttonVariants,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DateDisplay,
  Separator,
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
  ChevronLeft,
  ChevronRight,
  Eye,
  Receipt,
  User,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect } from "react";

interface CustomerDetailPageClientProps {
  slugId: string;
}

/** Format unclaimed free items for display (API returns parsed FreeItemEntry[]). */
function formatUnclaimedFreeItems(
  entries: FreeItemEntry[] | undefined,
): string {
  if (!entries?.length) return "—";
  return entries
    .map((e) =>
      e.expiresAt
        ? `${e.skuName} (expires ${new Date(e.expiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })})`
        : e.skuName,
    )
    .join(", ");
}

const BILLS_PER_PAGE = 5;
const ACTIVITY_PER_PAGE = 5;

function PaginationRow({
  page,
  total,
  perPage,
  onPrev,
  onNext,
  label,
}: {
  page: number;
  total: number;
  perPage: number;
  onPrev: () => void;
  onNext: () => void;
  label: string;
}) {
  const pageCount = Math.max(1, Math.ceil(total / perPage));
  const start = total === 0 ? 0 : (page - 1) * perPage + 1;
  const end = Math.min(page * perPage, total);
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
      <p className="text-muted-foreground text-sm">
        {label}: {total === 0 ? "0" : `${start}–${end} of ${total}`}
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={onPrev}
          disabled={page <= 1}
          aria-label="Previous page"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <span className="text-muted-foreground min-w-[4rem] text-center text-sm">
          Page {page} of {pageCount}
        </span>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={onNext}
          disabled={page >= pageCount}
          aria-label="Next page"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

export function CustomerDetailPageClient({
  slugId,
}: CustomerDetailPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const billsPage = Math.max(1, Number(searchParams.get("billsPage")) || 1);
  const activityPage = Math.max(
    1,
    Number(searchParams.get("activityPage")) || 1,
  );

  const { data, isLoading, isError, error } = useCustomerQuery(slugId, {
    billsPage,
    billsPerPage: BILLS_PER_PAGE,
    activityPage,
    activityPerPage: ACTIVITY_PER_PAGE,
  });
  const setSegmentLabel = useBreadcrumbOverride()?.setSegmentLabel;
  const customer = data?.customer ?? null;

  const setBillsPage = useCallback(
    (p: number) => {
      const next = new URLSearchParams(searchParams.toString());
      next.set("billsPage", String(p));
      router.push(`?${next.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );
  const setActivityPage = useCallback(
    (p: number) => {
      const next = new URLSearchParams(searchParams.toString());
      next.set("activityPage", String(p));
      router.push(`?${next.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

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

  const hasLoyaltyLink = Boolean(customer?.phone && customer?.businessSlug);
  const hasReferralLink = Boolean(
    isServiceEnabled(customer?.isServiceEnabled, "referral") &&
    customer?.businessSlug &&
    customer?.referralSlug,
  );
  const billsTotal = customer?.billsTotal ?? 0;
  const activityTotal = customer?.activityTotal ?? 0;
  const activityItems = customer?.activityItems ?? [];
  const hasActivity = activityTotal > 0 || Boolean(customer?.referredBy);

  const loyaltyUrl =
    typeof window !== "undefined" && customer?.phone && customer?.businessSlug
      ? `${window.location.origin}/loyalty/${encodeURIComponent(customer.businessSlug)}/login?phone=${encodeURIComponent(customer.phone)}`
      : "";
  const referralUrl =
    typeof window !== "undefined" &&
    customer?.businessSlug &&
    customer?.referralSlug
      ? `${window.location.origin}/referral/${customer.businessSlug}/${customer.referralSlug}`
      : "";

  const unclaimedFreeItemsDisplay =
    !isLoading && customer?.freeItems != null
      ? formatUnclaimedFreeItems(customer.freeItems)
      : null;

  return (
    <div className="space-y-6">
      {/* Single panel: name, email, number, then loyalty; link buttons in ButtonGroup */}
      <div className="bg-muted/20 flex flex-col gap-4 rounded-xl border px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <div className="min-w-0 flex-1 space-y-3">
          {isLoading && !customer ? (
            <Skeleton className="h-6 w-64" />
          ) : (
            <div className="flex flex-wrap items-center gap-x-2 text-sm">
              <span className="font-semibold">{customer?.name ?? "—"}</span>
              <Separator orientation="vertical" className="h-4" />
              <span className="text-muted-foreground truncate">
                {customer?.email ?? "—"}
              </span>
              <Separator orientation="vertical" className="h-4" />
              <span className="text-muted-foreground tabular-nums">
                {customer?.phone ?? "—"}
              </span>
            </div>
          )}
          <Separator />
          {isLoading && !customer ? (
            <Skeleton className="h-5 w-72" />
          ) : (
            <div className="text-muted-foreground text-sm">
              Cashback{" "}
              <span className="text-foreground font-medium tabular-nums">
                {customer?.cashbackBalance != null
                  ? `₹${customer.cashbackBalance.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : "—"}
              </span>
              {" · "}
              Points{" "}
              <span className="text-foreground font-medium tabular-nums">
                {customer?.pointsBalance != null
                  ? customer.pointsBalance.toLocaleString("en-IN")
                  : "—"}
              </span>
              {" · "}
              Free (unclaimed): {unclaimedFreeItemsDisplay ?? "—"}
            </div>
          )}
        </div>
        {(hasLoyaltyLink || hasReferralLink) && !isLoading && (
          <ButtonGroup className="shrink-0">
            {hasLoyaltyLink && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  window.open(loyaltyUrl, "_blank", "noopener,noreferrer")
                }
              >
                Loyalty
              </Button>
            )}
            {hasReferralLink && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  window.open(referralUrl, "_blank", "noopener,noreferrer")
                }
              >
                Referral
              </Button>
            )}
          </ButtonGroup>
        )}
      </div>

      {/* Activity: merged list (partner redemptions + referral logs), paginated */}
      {hasActivity && !isLoading && customer && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {customer.referredBy && (
              <div>
                <p className="text-muted-foreground mb-1 text-xs font-medium tracking-wide uppercase">
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
            {activityItems.length > 0 ? (
              <>
                <div className="overflow-hidden rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="text-xs">Type</TableHead>
                        <TableHead className="text-xs">Date</TableHead>
                        <TableHead className="text-xs">Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activityItems.map((item: CustomerActivityItem) => {
                        if (item.type === "partner") {
                          return (
                            <TableRow key={`p-${item.id}`}>
                              <TableCell className="text-xs font-medium">
                                Partner
                              </TableCell>
                              <TableCell className="text-muted-foreground text-sm">
                                <DateDisplay date={item.createdAt} />
                              </TableCell>
                              <TableCell className="text-sm">
                                {item.valueKind === "CASHBACK"
                                  ? `₹${item.amount.toFixed(2)}`
                                  : `${Math.abs(Math.floor(item.amount))} pts`}{" "}
                                at{" "}
                                {item.redeemedAtBusinessName ??
                                  item.redeemedAtBusinessId}
                              </TableCell>
                            </TableRow>
                          );
                        }
                        if (item.type === "referral") {
                          return (
                            <TableRow key={`r-${item.id}`}>
                              <TableCell className="text-xs font-medium">
                                Referral
                              </TableCell>
                              <TableCell className="text-muted-foreground text-sm">
                                <DateDisplay date={item.createdAt} />
                              </TableCell>
                              <TableCell className="text-sm">
                                {item.newCustomerName || "—"} (
                                {item.newCustomerPhone})
                                {item.becameCustomer && (
                                  <Badge
                                    variant="secondary"
                                    size="xs"
                                    className="ml-2"
                                  >
                                    Claimed
                                  </Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        }
                        const isFreeItem = item.valueKind === "FREE_ITEM";
                        const isCashback = item.valueKind === "CASHBACK";
                        const sourceLabel =
                          item.source === "CAMPAIGN"
                            ? item.campaignTitle
                              ? `Campaign: ${item.campaignTitle}`
                              : "Campaign"
                            : item.source === "REFERRAL"
                              ? "Referral"
                              : item.source;
                        const itemName = isFreeItem
                          ? (item.freeItemName ?? "Free item")
                          : null;
                        const typeLabel = isFreeItem
                          ? item.txType === "EARNED"
                            ? `${itemName} Earned`
                            : `${itemName} Claimed`
                          : isCashback
                            ? item.txType === "EARNED"
                              ? "Cashback Earned"
                              : "Cashback Redeemed"
                            : item.txType;
                        const amountLabel = isFreeItem
                          ? itemName!
                          : isCashback
                            ? `${item.amount > 0 ? "+" : "−"}₹${Math.abs(item.amount).toFixed(2)}`
                            : `${item.amount > 0 ? "+" : "−"}${Math.abs(item.amount)} pts`;
                        return (
                          <TableRow key={`tx-${item.id}`}>
                            <TableCell className="text-xs font-medium">
                              {typeLabel}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              <DateDisplay date={item.createdAt} />
                            </TableCell>
                            <TableCell className="text-sm">
                              {amountLabel}{" "}
                              <span className="text-muted-foreground">
                                ({sourceLabel})
                              </span>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
                <PaginationRow
                  label="Activity"
                  page={activityPage}
                  total={activityTotal}
                  perPage={ACTIVITY_PER_PAGE}
                  onPrev={() => setActivityPage(activityPage - 1)}
                  onNext={() => setActivityPage(activityPage + 1)}
                />
              </>
            ) : activityTotal === 0 && !customer.referredBy ? null : (
              <p className="text-muted-foreground text-sm">
                No activity on this page.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Bills */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Receipt className="text-muted-foreground size-4" />
            Bills
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {showBillsSkeleton ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : bills.length === 0 ? (
            <div className="bg-muted/20 flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
              <div className="text-muted-foreground bg-muted flex size-10 items-center justify-center rounded-full">
                <Receipt className="size-5" />
              </div>
              <p className="text-foreground mt-3 text-sm font-medium">
                No bills yet
              </p>
              <p className="text-muted-foreground mt-1 max-w-[240px] text-xs">
                Bills will appear here after purchases.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-hidden rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b hover:bg-transparent">
                      <TableHead className="font-medium">Bill #</TableHead>
                      <TableHead className="text-right font-medium">
                        Amount
                      </TableHead>
                      <TableHead className="text-right font-medium">
                        Cashback
                      </TableHead>
                      <TableHead className="font-medium">Date</TableHead>
                      <TableHead className="w-12" />
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
                      const hasCashback =
                        hasCashbackEarned || hasCashbackRedeemed;
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
                                buttonVariants({
                                  variant: "ghost",
                                  size: "xs",
                                }),
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
              </div>
              {bills.length > 0 && (
                <PaginationRow
                  label="Bills"
                  page={billsPage}
                  total={billsTotal}
                  perPage={BILLS_PER_PAGE}
                  onPrev={() => setBillsPage(billsPage - 1)}
                  onNext={() => setBillsPage(billsPage + 1)}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
