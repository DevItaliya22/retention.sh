"use client";

import { useBreadcrumbOverride } from "@/components/layouts/context/breadcrumb-override";
import {
  useCustomerActivityQuery,
  useCustomerBillsQuery,
  useCustomerProfileQuery,
  type CustomerActivityItem,
} from "@/hooks/customers/useCustomerQuery";
import type { FreeItemEntry } from "@/lib/utils/free-items";
import { isServiceEnabled } from "@/lib/utils/service-enabled";
import {
  Badge,
  Button,
  ButtonGroup,
  buttonVariants,
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
  ExternalLink,
  Eye,
  Gift,
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

const BILLS_PER_PAGE = 10;
const ACTIVITY_PER_PAGE = 10;

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
    <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 sm:px-6 sm:py-4">
      <p className="text-muted-foreground text-xs sm:text-sm">
        {label}: {total === 0 ? "0" : `${start}–${end} of ${total}`}
      </p>
      <div className="flex items-center gap-2">
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
        <span className="text-muted-foreground min-w-[4.5rem] text-center text-xs tabular-nums sm:text-sm">
          {page} / {pageCount}
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

function CustomerHeaderSection({ slugId }: { slugId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const profile = useCustomerProfileQuery(slugId);
  const setSegmentLabel = useBreadcrumbOverride()?.setSegmentLabel;
  const customer = profile.data?.customer ?? null;

  const hasLoyaltyLink = Boolean(customer?.phone && customer?.businessSlug);
  const hasReferralLink = Boolean(
    isServiceEnabled(customer?.isServiceEnabled, "referral") &&
    customer?.businessSlug &&
    customer?.referralSlug,
  );

  const loyaltyUrl =
    typeof window !== "undefined" && customer?.phone && customer?.businessSlug
      ? `${window.location.origin}/loyalty/${encodeURIComponent(
          customer.businessSlug,
        )}/login?phone=${encodeURIComponent(customer.phone)}`
      : "";

  const referralUrl =
    typeof window !== "undefined" &&
    customer?.businessSlug &&
    customer?.referralSlug
      ? `${window.location.origin}/referral/${customer.businessSlug}/${customer.referralSlug}`
      : "";

  const unclaimedFreeItemsDisplay =
    !profile.isLoading && customer?.freeItems != null
      ? formatUnclaimedFreeItems(customer.freeItems)
      : null;

  useEffect(() => {
    if (customer?.name) {
      setSegmentLabel?.(customer.name);
    }
    return () => {
      setSegmentLabel?.(null);
    };
  }, [customer?.name, setSegmentLabel]);

  if (profile.isError) {
    return (
      <div className="bg-muted/20 min-height-[320px] flex flex-col items-center justify-center rounded-2xl border border-dashed px-8 py-20 text-center">
        <div className="bg-destructive/10 text-destructive flex size-14 items-center justify-center rounded-2xl">
          <User className="size-7" />
        </div>
        <p className="text-foreground mt-5 text-base font-semibold">
          Failed to load customer
        </p>
        <p className="text-muted-foreground mt-1.5 text-sm">
          {profile.error?.message ?? "Please try again later"}
        </p>
      </div>
    );
  }

  return (
    <section className="bg-card/80 relative overflow-hidden rounded-2xl border px-4 py-5 shadow-sm sm:px-6 sm:py-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.08),transparent_55%)]" />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <p className="text-muted-foreground text-[11px] font-medium tracking-[0.16em] uppercase">
              Customer
            </p>
            {profile.isLoading && !customer ? (
              <Skeleton className="mt-1 h-7 w-44 sm:h-8 sm:w-56" />
            ) : (
              <p className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">
                {customer?.name ?? "—"}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm">
            {profile.isLoading && !customer ? (
              <Skeleton className="h-5 w-40" />
            ) : (
              <>
                <span className="text-muted-foreground truncate">
                  {customer?.email ?? "—"}
                </span>
                <Separator
                  orientation="vertical"
                  className="hidden h-4 sm:inline-flex"
                />
                <span className="text-muted-foreground tabular-nums">
                  {customer?.phone ?? "—"}
                </span>
              </>
            )}
          </div>

          <Separator className="my-3" />

          {profile.isLoading && !customer ? (
            <Skeleton className="h-6 w-64" />
          ) : (
            <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm">
              <span>
                Cashback{" "}
                <span className="text-foreground font-mono font-medium tabular-nums">
                  {customer?.cashbackBalance != null
                    ? `₹${customer.cashbackBalance.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}`
                    : "—"}
                </span>
              </span>
              <span>
                Points{" "}
                <span className="text-foreground font-mono font-medium tabular-nums">
                  {customer?.pointsBalance != null
                    ? customer.pointsBalance.toLocaleString("en-IN")
                    : "—"}
                </span>
              </span>
              <span>Free (unclaimed): {unclaimedFreeItemsDisplay ?? "—"}</span>
            </div>
          )}

          {!profile.isLoading && customer?.referredBy && (
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t pt-3">
              <p className="text-muted-foreground text-[11px] font-medium tracking-[0.18em] uppercase">
                Referred by
              </p>
              <Link
                href={`/customers/${customer.referredBy.slugId}`}
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  "h-auto justify-start gap-2 px-2 py-1 text-xs sm:text-sm",
                )}
              >
                <UserPlus className="text-muted-foreground size-4 shrink-0" />
                <span className="truncate">{customer.referredBy.name}</span>
              </Link>
            </div>
          )}
        </div>

        {(hasLoyaltyLink || hasReferralLink) && !profile.isLoading && (
          <ButtonGroup className="shrink-0 gap-2 self-start">
            {hasLoyaltyLink && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() =>
                  window.open(loyaltyUrl, "_blank", "noopener,noreferrer")
                }
              >
                Loyalty
                <ExternalLink className="size-3.5" />
              </Button>
            )}
            {hasReferralLink && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() =>
                  window.open(referralUrl, "_blank", "noopener,noreferrer")
                }
              >
                Referral
                <ExternalLink className="size-3.5" />
              </Button>
            )}
          </ButtonGroup>
        )}
      </div>
    </section>
  );
}

function CustomerActivitySection({ slugId }: { slugId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const activityPage = Math.max(
    1,
    Number(searchParams.get("activityPage")) || 1,
  );

  const activityQuery = useCustomerActivityQuery(slugId, {
    page: activityPage,
    perPage: ACTIVITY_PER_PAGE,
  });

  const activityItems = activityQuery.data?.items ?? [];
  const activityTotal = activityQuery.data?.total ?? 0;

  const setActivityPage = useCallback(
    (p: number) => {
      const next = new URLSearchParams(searchParams.toString());
      next.set("activityPage", String(p));
      router.push(`?${next.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  return (
    <section className="bg-card overflow-hidden rounded-2xl border shadow-sm">
      <div className="bg-muted/20 border-b px-4 py-3 sm:px-6 sm:py-4">
        <h3 className="text-foreground/90 flex items-center gap-2 text-xs font-semibold tracking-[0.18em] uppercase sm:text-sm">
          <Gift className="text-muted-foreground size-4" />
          Activity
        </h3>
      </div>
      <div className="space-y-4 p-4 sm:space-y-5 sm:p-6">
        {activityQuery.isLoading && activityItems.length === 0 ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-10 w-full rounded-lg" />
            ))}
          </div>
        ) : activityTotal > 0 ? (
          <>
            {activityItems.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 border-b hover:bg-transparent">
                    <TableHead className="px-4 py-3 text-xs font-medium sm:px-6 sm:text-sm">
                      Type
                    </TableHead>
                    <TableHead className="px-4 py-3 text-xs font-medium sm:px-6 sm:text-sm">
                      Date
                    </TableHead>
                    <TableHead className="px-4 py-3 text-xs font-medium sm:px-6 sm:text-sm">
                      Details
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activityItems.map((item: CustomerActivityItem) => {
                    if (item.type === "partner") {
                      return (
                        <TableRow
                          key={`p-${item.id}`}
                          className="border-b last:border-b-0"
                        >
                          <TableCell className="px-4 py-3 text-xs font-medium sm:px-6 sm:text-sm">
                            Partner
                          </TableCell>
                          <TableCell className="text-muted-foreground px-4 py-3 text-xs sm:px-6 sm:text-sm">
                            <DateDisplay date={item.createdAt} />
                          </TableCell>
                          <TableCell className="px-4 py-3 text-xs sm:px-6 sm:text-sm">
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
                        <TableRow
                          key={`r-${item.id}`}
                          className="last-border-b-0 border-b"
                        >
                          <TableCell className="px-4 py-3 text-xs font-medium sm:px-6 sm:text-sm">
                            Referral
                          </TableCell>
                          <TableCell className="text-muted-foreground px-4 py-3 text-xs sm:px-6 sm:text-sm">
                            <DateDisplay date={item.createdAt} />
                          </TableCell>
                          <TableCell className="px-4 py-3 text-xs sm:px-6 sm:text-sm">
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
                        ? `${item.amount > 0 ? "+" : "−"}₹${Math.abs(
                            item.amount,
                          ).toFixed(2)}`
                        : `${item.amount > 0 ? "+" : "−"}${Math.abs(
                            item.amount,
                          )} pts`;

                    return (
                      <TableRow
                        key={`tx-${item.id}`}
                        className="border-b last:border-b-0"
                      >
                        <TableCell className="px-4 py-3 text-xs font-medium sm:px-6 sm:text-sm">
                          {typeLabel}
                        </TableCell>
                        <TableCell className="text-muted-foreground px-4 py-3 text-xs sm:px-6 sm:text-sm">
                          <DateDisplay date={item.createdAt} />
                        </TableCell>
                        <TableCell className="px-4 py-3 text-xs sm:px-6 sm:text-sm">
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
            )}

            <PaginationRow
              label="Activity"
              page={activityPage}
              total={activityTotal}
              perPage={ACTIVITY_PER_PAGE}
              onPrev={() => setActivityPage(activityPage - 1)}
              onNext={() => setActivityPage(activityPage + 1)}
            />
          </>
        ) : (
          <p className="text-muted-foreground py-4 text-center text-sm">
            No activity yet
          </p>
        )}
      </div>
    </section>
  );
}

function CustomerBillsSection({ slugId }: { slugId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const billsPage = Math.max(1, Number(searchParams.get("billsPage")) || 1);
  const billsQuery = useCustomerBillsQuery(slugId, {
    page: billsPage,
    perPage: BILLS_PER_PAGE,
  });

  const setBillsPage = useCallback(
    (p: number) => {
      const next = new URLSearchParams(searchParams.toString());
      next.set("billsPage", String(p));
      router.push(`?${next.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const bills = billsQuery.data?.items ?? [];
  const billsTotal = billsQuery.data?.total ?? 0;
  const showBillsSkeleton = billsQuery.isLoading && bills.length === 0;

  return (
    <section className="bg-card overflow-hidden rounded-2xl border shadow-sm">
      <div className="bg-muted/20 border-b px-4 py-3 sm:px-6 sm:py-4">
        <h3 className="text-foreground/90 flex items-center gap-2 text-xs font-semibold tracking-[0.18em] uppercase sm:text-sm">
          <Receipt className="text-muted-foreground size-4" />
          Bills
        </h3>
      </div>
      {showBillsSkeleton ? (
        <div className="space-y-0 p-4 sm:p-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : billsQuery.isError ? (
        <div className="text-muted-foreground p-4 text-sm sm:p-6">
          Failed to load bills. Please try again.
        </div>
      ) : bills.length === 0 ? (
        <div className="flex flex-col items-center justify-center border-b border-dashed py-14 text-center sm:py-16">
          <div className="text-muted-foreground bg-muted/50 flex size-12 items-center justify-center rounded-2xl">
            <Receipt className="size-6" />
          </div>
          <p className="text-foreground mt-4 text-sm font-medium">
            No bills yet
          </p>
          <p className="text-muted-foreground mt-1.5 max-w-[260px] text-xs sm:text-sm">
            Bills will appear here after purchases.
          </p>
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 border-b hover:bg-transparent">
                <TableHead className="px-4 py-3 text-xs font-medium sm:px-6 sm:py-4 sm:text-sm">
                  Bill #
                </TableHead>
                <TableHead className="px-4 py-3 text-right text-xs font-medium sm:px-6 sm:py-4 sm:text-sm">
                  Amount
                </TableHead>
                <TableHead className="px-4 py-3 text-right text-xs font-medium sm:px-6 sm:py-4 sm:text-sm">
                  Cashback
                </TableHead>
                <TableHead className="px-4 py-3 text-xs font-medium sm:px-6 sm:py-4 sm:text-sm">
                  Date
                </TableHead>
                <TableHead className="w-14 px-4 py-3 sm:px-6 sm:py-4" />
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
                  <TableRow
                    key={bill.id}
                    className="group border-b last:border-b-0"
                  >
                    <TableCell className="px-4 py-3 font-mono text-xs font-medium sm:px-6 sm:text-sm">
                      {bill.billNumber}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right font-mono text-xs font-medium tabular-nums sm:px-6 sm:text-sm">
                      {amount != null
                        ? `₹${amount.toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}`
                        : "—"}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right text-xs tabular-nums sm:px-6 sm:text-sm">
                      {hasCashback ? (
                        <span className="flex flex-col items-end gap-0.5">
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
                    <TableCell className="text-muted-foreground px-4 py-3 text-xs sm:px-6 sm:text-sm">
                      <DateDisplay date={bill.createdAt} />
                    </TableCell>
                    <TableCell className="px-4 py-3 sm:px-6 sm:py-3">
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

          <PaginationRow
            label="Bills"
            page={billsPage}
            total={billsTotal}
            perPage={BILLS_PER_PAGE}
            onPrev={() => setBillsPage(billsPage - 1)}
            onNext={() => setBillsPage(billsPage + 1)}
          />
        </>
      )}
    </section>
  );
}

export function CustomerDetailPageClient({
  slugId,
}: CustomerDetailPageClientProps) {
  return (
    <div className="space-y-6 sm:space-y-8">
      <CustomerHeaderSection slugId={slugId} />
      <CustomerActivitySection slugId={slugId} />
      <CustomerBillsSection slugId={slugId} />
    </div>
  );
}
