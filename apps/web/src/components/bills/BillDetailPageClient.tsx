"use client";

import { useBreadcrumbOverride } from "@/components/layouts/context/breadcrumb-override";
import type {
  BillLineItemResponse,
  BillLoyaltyLog,
} from "@/hooks/bills/useBillQuery";
import { useBillQuery } from "@/hooks/bills/useBillQuery";
import {
  buttonVariants,
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
import { motion, useReducedMotion } from "framer-motion";
import {
  CalendarDays,
  ExternalLink,
  Gift,
  Mail,
  MessageSquare,
  Package,
  Phone,
  Receipt,
  User,
} from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

interface BillDetailPageClientProps {
  billId: string;
}

const stagger = (prefersReduced = false) => ({
  container: {
    transition: prefersReduced
      ? { duration: 0 }
      : { staggerChildren: 0.06, delayChildren: 0.02 },
  },
  item: {
    initial: prefersReduced ? { opacity: 1 } : { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
  },
});

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
    <div className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0">
      {Icon && (
        <div className="text-muted-foreground/80 bg-muted/40 flex size-8 shrink-0 items-center justify-center rounded-lg">
          <Icon className="size-4" />
        </div>
      )}
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="text-muted-foreground text-[11px] font-medium tracking-wider uppercase">
          {label}
        </p>
        {isLoading ? (
          <Skeleton className={cn("h-5", skeletonWidth)} />
        ) : (
          <div className="text-sm leading-snug font-medium">{value}</div>
        )}
      </div>
    </div>
  );
}

export function BillDetailPageClient({ billId }: BillDetailPageClientProps) {
  const prefersReducedMotion = useReducedMotion();
  const { data, isLoading, isError, error } = useBillQuery(billId);
  const setSegmentLabel = useBreadcrumbOverride()?.setSegmentLabel;
  const bill = data?.bill ?? null;
  const businessSlug = data?.businessSlug ?? "";
  const feedbackPath =
    bill?.feedbackLink && businessSlug
      ? `/feedback/${businessSlug}/${bill.feedbackLink.token}`
      : null;

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
      <div className="bg-muted/20 flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed px-8 py-20 text-center">
        <div className="bg-destructive/10 text-destructive flex size-14 items-center justify-center rounded-2xl">
          <Receipt className="size-7" />
        </div>
        <p className="text-foreground mt-5 text-base font-semibold">
          Failed to load bill
        </p>
        <p className="text-muted-foreground mt-1.5 text-sm">
          {error?.message ?? "Please try again later"}
        </p>
      </div>
    );
  }

  const billTotal =
    bill?.finalAmount != null ? bill.finalAmount : (bill?.amount ?? null);
  const amountToPay = bill?.userPaidAmount ?? billTotal;
  const amountFormatted =
    amountToPay != null
      ? `₹${amountToPay.toLocaleString("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`
      : "—";
  const formatRs = (n: number | null | undefined) =>
    n != null
      ? `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : "—";

  const isCashbackBill =
    (bill?.cashbackAmount ?? 0) > 0 ||
    (bill?.cashbackRedeemedAmount ?? 0) > 0 ||
    (bill?.loyaltyLogs?.some((l) => l.valueKind === "CASHBACK") ?? false);
  const hasLoyalty =
    (bill?.loyaltyPointsEarned ?? 0) > 0 ||
    (bill?.loyaltyPointsRedeemed ?? 0) > 0 ||
    (bill?.cashbackAmount ?? 0) > 0 ||
    (bill?.cashbackRedeemedAmount ?? 0) > 0;
  const loyaltyLogs = bill?.loyaltyLogs ?? [];
  const showLoyaltyLogsTable = loyaltyLogs.length > 0;
  const hasBreakdown =
    bill &&
    (bill.subtotal != null ||
      (bill.storeDiscount ?? 0) > 0 ||
      bill.finalAmount != null);

  function formatLoyaltyType(type: string) {
    const t = type as BillLoyaltyLog["type"];
    if (t === "EARNED") return "Earned";
    if (t === "REDEEMED") return "Redeemed";
    return t;
  }

  const s = stagger(!!prefersReducedMotion);

  return (
    <motion.div
      className="space-y-8"
      initial="initial"
      animate="animate"
      variants={s.container}
    >
      {/* Hero: receipt-style header */}
      <motion.section
        variants={s.item}
        className="from-muted/30 via-muted/10 relative overflow-hidden rounded-2xl border bg-gradient-to-br to-transparent px-6 py-6 sm:px-8 sm:py-8"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(var(--primary)/0.06),transparent)]" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 space-y-1">
            <p className="text-muted-foreground text-[11px] font-medium tracking-widest uppercase">
              Bill number
            </p>
            {isLoading && !bill ? (
              <Skeleton className="h-9 w-40" />
            ) : (
              <p className="font-mono text-2xl font-semibold tracking-tight sm:text-3xl">
                {bill?.billNumber ?? "—"}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-end gap-6 sm:gap-8">
            <div className="text-right">
              <p className="text-muted-foreground mb-0.5 text-[11px] font-medium tracking-widest uppercase">
                Amount to pay
              </p>
              {isLoading && !bill ? (
                <Skeleton className="h-10 w-28" />
              ) : (
                <span className="font-mono text-3xl font-bold tabular-nums sm:text-4xl">
                  {amountFormatted}
                </span>
              )}
            </div>
            {!isLoading && bill?.createdAt && (
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <CalendarDays className="size-4 shrink-0" />
                <DateDisplay date={bill.createdAt} />
              </div>
            )}
            {!isLoading && bill?.businessCustomerId && (
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
          </div>
        </div>
      </motion.section>

      {/* Two-column: Amount breakdown + Customer */}
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Amount breakdown */}
        {((hasBreakdown || hasLoyalty) && bill) || isLoading ? (
          <motion.section
            variants={s.item}
            className="bg-card rounded-2xl border p-6 shadow-sm"
          >
            <h3 className="text-foreground/90 mb-5 flex items-center gap-2 text-sm font-semibold tracking-wider uppercase">
              <Receipt className="text-muted-foreground size-4" />
              Amount breakdown
            </h3>
            {isLoading && !bill ? (
              <div className="space-y-3">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-6 w-1/2" />
              </div>
            ) : bill ? (
              <>
                <div className="space-y-1">
                  {bill.subtotal != null && (
                    <div className="flex justify-between py-2 text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-mono tabular-nums">
                        {formatRs(bill.subtotal)}
                      </span>
                    </div>
                  )}
                  {(bill.storeDiscount ?? 0) > 0 && (
                    <div className="flex justify-between py-2 text-sm">
                      <span className="text-muted-foreground">
                        Store discount
                      </span>
                      <span className="font-mono text-emerald-600 tabular-nums dark:text-emerald-400">
                        -{formatRs(bill.storeDiscount ?? 0)}
                      </span>
                    </div>
                  )}
                  {bill.finalAmount != null && (
                    <div className="flex justify-between border-t py-3 text-sm">
                      <span className="font-medium">Bill total</span>
                      <span className="font-mono font-medium tabular-nums">
                        {formatRs(bill.finalAmount)}
                      </span>
                    </div>
                  )}
                  {(bill.cashbackRedeemedAmount ?? 0) > 0 && (
                    <div className="flex justify-between py-2 text-sm">
                      <span className="text-muted-foreground">
                        Cashback used
                      </span>
                      <span className="font-mono text-blue-600 tabular-nums dark:text-blue-400">
                        -{formatRs(bill.cashbackRedeemedAmount)}
                      </span>
                    </div>
                  )}
                  {(bill.loyaltyPointsRedeemed ?? 0) > 0 &&
                    !(bill.cashbackRedeemedAmount ?? 0) && (
                      <div className="flex justify-between py-2 text-sm">
                        <span className="text-muted-foreground">
                          Points used
                        </span>
                        <span className="font-mono text-blue-600 tabular-nums dark:text-blue-400">
                          -{bill.loyaltyPointsRedeemed} pts
                        </span>
                      </div>
                    )}
                  <div className="bg-muted/30 -mx-6 mt-2 flex justify-between border-t px-6 py-3 text-sm">
                    <span className="font-semibold">Amount to pay</span>
                    <span className="font-mono font-bold tabular-nums">
                      {formatRs(bill.userPaidAmount ?? bill.finalAmount)}
                    </span>
                  </div>
                </div>
                {hasLoyalty && (
                  <div className="mt-6 border-t pt-5">
                    <h4 className="text-muted-foreground mb-3 flex items-center gap-2 text-xs font-semibold tracking-wider uppercase">
                      <Gift className="size-3.5" />
                      Loyalty on this bill
                    </h4>
                    <div className="space-y-1">
                      {isCashbackBill ? (
                        <>
                          {(bill.cashbackRedeemedAmount ?? 0) > 0 && (
                            <div className="flex justify-between py-1.5 text-sm">
                              <span className="text-muted-foreground">
                                Cashback used
                              </span>
                              <span className="font-mono text-blue-600 tabular-nums dark:text-blue-400">
                                -{formatRs(bill.cashbackRedeemedAmount)}
                              </span>
                            </div>
                          )}
                          {(bill.cashbackAmount ??
                            bill.loyaltyPointsEarned ??
                            0) > 0 && (
                            <div className="flex justify-between py-1.5 text-sm">
                              <span className="text-muted-foreground">
                                Cashback earned
                              </span>
                              <span className="font-mono text-emerald-600 tabular-nums dark:text-emerald-400">
                                +
                                {formatRs(
                                  bill.cashbackAmount ??
                                    bill.loyaltyPointsEarned ??
                                    0,
                                )}
                              </span>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          {(bill.loyaltyPointsRedeemed ?? 0) > 0 && (
                            <div className="flex justify-between py-1.5 text-sm">
                              <span className="text-muted-foreground">
                                Points used
                              </span>
                              <span className="font-mono tabular-nums">
                                {bill.loyaltyPointsRedeemed} pts
                              </span>
                            </div>
                          )}
                          {(bill.loyaltyPointsEarned ?? 0) > 0 && (
                            <div className="flex justify-between py-1.5 text-sm">
                              <span className="text-muted-foreground">
                                Points earned
                              </span>
                              <span className="font-mono text-emerald-600 tabular-nums dark:text-emerald-400">
                                +{bill.loyaltyPointsEarned} pts
                              </span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </motion.section>
        ) : null}

        {/* Customer card */}
        <motion.section
          variants={s.item}
          className="bg-card rounded-2xl border p-6 shadow-sm lg:max-w-[340px]"
        >
          <h3 className="text-foreground/90 mb-5 flex items-center gap-2 text-sm font-semibold tracking-wider uppercase">
            <User className="text-muted-foreground size-4" />
            Customer
          </h3>
          <div className="space-y-0">
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
              <p className="text-muted-foreground py-3 text-sm">
                No contact details on file
              </p>
            )}
            {!isLoading && feedbackPath && (
              <div className="pt-3">
                <DetailRow
                  label="Feedback"
                  value={
                    <Link
                      href={feedbackPath}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        buttonVariants({ variant: "link", size: "sm" }),
                        "inline-flex h-auto items-center gap-1.5 p-0 font-normal",
                      )}
                    >
                      Open form
                      <ExternalLink className="size-3.5 shrink-0" />
                    </Link>
                  }
                  icon={MessageSquare}
                />
              </div>
            )}
          </div>
        </motion.section>
      </div>

      {/* Line items */}
      {(bill?.lineItems?.length ?? 0) > 0 && (
        <motion.section variants={s.item}>
          <div className="bg-card overflow-hidden rounded-2xl border shadow-sm">
            <div className="bg-muted/20 border-b px-6 py-4">
              <h3 className="text-foreground/90 flex items-center gap-2 text-sm font-semibold tracking-wider uppercase">
                <Package className="text-muted-foreground size-4" />
                Line items
              </h3>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 border-b hover:bg-transparent">
                  <TableHead className="px-6 py-4 font-medium">
                    SKU / Name
                  </TableHead>
                  <TableHead className="px-6 py-4 text-right font-medium">
                    Qty
                  </TableHead>
                  <TableHead className="px-6 py-4 text-right font-medium">
                    Unit price
                  </TableHead>
                  <TableHead className="px-6 py-4 text-right font-medium">
                    Total
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bill?.lineItems?.map((li: BillLineItemResponse) => {
                  const price = li.unitPrice ?? li.sku.price ?? 0;
                  const lineTotal = li.qty * price;
                  return (
                    <TableRow key={li.id} className="border-b last:border-b-0">
                      <TableCell className="px-6 py-4">
                        <div className="text-muted-foreground font-mono text-xs">
                          {li.sku.sku}
                        </div>
                        <div className="font-medium">{li.sku.name}</div>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right font-mono tabular-nums">
                        {li.qty}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right font-mono tabular-nums">
                        ₹
                        {price.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right font-mono font-medium tabular-nums">
                        ₹
                        {lineTotal.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </motion.section>
      )}

      {/* Loyalty logs */}
      {showLoyaltyLogsTable && (
        <motion.section variants={s.item}>
          <div className="bg-card overflow-hidden rounded-2xl border shadow-sm">
            <div className="bg-muted/20 border-b px-6 py-4">
              <h3 className="text-foreground/90 flex items-center gap-2 text-sm font-semibold tracking-wider uppercase">
                <Gift className="text-muted-foreground size-4" />
                Loyalty logs
              </h3>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 border-b hover:bg-transparent">
                  <TableHead className="px-6 py-4 font-medium">Kind</TableHead>
                  <TableHead className="px-6 py-4 font-medium">Type</TableHead>
                  <TableHead className="px-6 py-4 font-medium">
                    Source
                  </TableHead>
                  <TableHead className="px-6 py-4 text-right font-medium">
                    Amount
                  </TableHead>
                  <TableHead className="px-6 py-4 text-right font-medium">
                    Date
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loyaltyLogs.map((log) => {
                  const isCashback = log.valueKind === "CASHBACK";
                  const isFreeItem = log.valueKind === "FREE_ITEM";
                  const kindLabel = isCashback
                    ? "Cashback"
                    : isFreeItem
                      ? (log.freeItemName ?? "Free Item")
                      : (log.valueKind ?? "—");
                  const amountDisplay = isFreeItem
                    ? (log.freeItemName ?? "Free item")
                    : isCashback && typeof log.amount === "number"
                      ? `₹${Math.abs(log.amount).toFixed(2)}`
                      : String(Math.abs(log.amount));
                  const prefix = isFreeItem
                    ? ""
                    : log.type === "REDEEMED"
                      ? log.isPartnerRedemption
                        ? "––"
                        : "–"
                      : "+";
                  const sourceLabel = log.isPartnerRedemption
                    ? "Partner"
                    : log.source === "CAMPAIGN"
                      ? log.campaignTitle
                        ? `Campaign: ${log.campaignTitle}`
                        : "Campaign"
                      : log.source === "BILL"
                        ? "Loyalty"
                        : log.source === "REFERRAL"
                          ? "Referral"
                          : log.source;
                  return (
                    <TableRow key={log.id} className="border-b last:border-b-0">
                      <TableCell className="px-6 py-3 font-medium">
                        {kindLabel}
                      </TableCell>
                      <TableCell className="px-6 py-3 font-medium">
                        {formatLoyaltyType(log.type)}
                      </TableCell>
                      <TableCell className="text-muted-foreground px-6 py-3">
                        {sourceLabel}
                      </TableCell>
                      <TableCell className="px-6 py-3 text-right font-mono tabular-nums">
                        {prefix}
                        {amountDisplay}
                      </TableCell>
                      <TableCell className="text-muted-foreground px-6 py-3 text-right text-sm">
                        {new Date(log.createdAt).toLocaleString("en-IN", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </motion.section>
      )}

      {/* Fallback: when no breakdown but we have bill - show minimal Bill & Customer */}
      {!hasBreakdown && !hasLoyalty && !isLoading && bill && (
        <motion.section
          variants={s.item}
          className="bg-card rounded-2xl border p-6 shadow-sm"
        >
          <h3 className="text-foreground/90 mb-5 flex items-center gap-2 text-sm font-semibold tracking-wider uppercase">
            <Receipt className="text-muted-foreground size-4" />
            Bill details
          </h3>
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <DetailRow
                label="Bill number"
                value={bill?.billNumber ?? "—"}
                icon={Receipt}
              />
              <DetailRow
                label="Amount to pay"
                value={amountFormatted}
                icon={Receipt}
              />
              <DetailRow
                label="Date"
                value={
                  bill?.createdAt ? <DateDisplay date={bill.createdAt} /> : "—"
                }
                icon={CalendarDays}
              />
              {feedbackPath && (
                <DetailRow
                  label="Feedback"
                  value={
                    <Link
                      href={feedbackPath}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        buttonVariants({ variant: "link", size: "sm" }),
                        "inline-flex h-auto items-center gap-1.5 p-0 font-normal",
                      )}
                    >
                      Open form
                      <ExternalLink className="size-3.5 shrink-0" />
                    </Link>
                  }
                  icon={MessageSquare}
                />
              )}
            </div>
            <div>
              <DetailRow
                label="Name"
                value={bill?.customerName ?? "—"}
                icon={User}
              />
              {(bill?.customerPhone ?? bill?.customerEmail) && (
                <>
                  {bill.customerPhone && (
                    <DetailRow
                      label="Phone"
                      value={bill.customerPhone}
                      icon={Phone}
                    />
                  )}
                  {bill.customerEmail && (
                    <DetailRow
                      label="Email"
                      value={bill.customerEmail}
                      icon={Mail}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        </motion.section>
      )}
    </motion.div>
  );
}
