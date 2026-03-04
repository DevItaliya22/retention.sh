"use client";

import { useBreadcrumbOverride } from "@/components/layouts/context/breadcrumb-override";
import type {
  BillLineItemResponse,
  BillLoyaltyLog,
} from "@/hooks/bills/useBillQuery";
import { useBillQuery } from "@/hooks/bills/useBillQuery";
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
        <div className="text-muted-foreground bg-muted/50 flex size-8 shrink-0 items-center justify-center rounded-md">
          <Icon className="size-4" />
        </div>
      )}
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
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

function SectionTitle({
  icon: Icon,
  title,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
}) {
  return (
    <h3 className="text-muted-foreground flex items-center gap-2 text-xs font-semibold tracking-wider uppercase">
      <Icon className="size-3.5" />
      {title}
    </h3>
  );
}

export function BillDetailPageClient({ billId }: BillDetailPageClientProps) {
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
      <div className="bg-muted/30 flex min-h-[280px] flex-col items-center justify-center rounded-xl border border-dashed px-6 py-16 text-center">
        <div className="bg-destructive/10 text-destructive flex size-12 items-center justify-center rounded-full">
          <Receipt className="size-6" />
        </div>
        <p className="text-foreground mt-4 font-medium">Failed to load bill</p>
        <p className="text-muted-foreground mt-1 text-sm">
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

  return (
    <div className="space-y-6">
      {/* Hero: bill number, amount, date, view customer */}
      <div className="bg-muted/20 flex flex-col gap-4 rounded-xl border px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <div className="min-w-0 space-y-1">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
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
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <div className="text-right">
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Amount
            </p>
            {isLoading && !bill ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <span className="text-2xl font-semibold tabular-nums">
                {amountFormatted}
              </span>
            )}
          </div>
          {!isLoading && bill?.createdAt && (
            <div className="text-muted-foreground text-sm">
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

      {/* Single card: Summary (breakdown + loyalty) */}
      {(hasBreakdown || hasLoyalty) && !isLoading && bill && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Summary</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6 sm:grid-cols-2">
            {hasBreakdown && (
              <div>
                <SectionTitle icon={Receipt} title="Amount" />
                <div className="mt-3 space-y-0">
                  {bill.subtotal != null && (
                    <DetailRow
                      label="Subtotal"
                      value={formatRs(bill.subtotal)}
                      icon={Receipt}
                    />
                  )}
                  {(bill.storeDiscount ?? 0) > 0 && (
                    <DetailRow
                      label="Store discount"
                      value={`-${formatRs(bill.storeDiscount ?? 0)}`}
                      icon={Receipt}
                    />
                  )}
                  {bill.finalAmount != null && (
                    <DetailRow
                      label="Bill total"
                      value={formatRs(bill.finalAmount)}
                      icon={Receipt}
                    />
                  )}
                  {(bill.cashbackRedeemedAmount ?? 0) > 0 && (
                    <DetailRow
                      label="Cashback used"
                      value={
                        <span className="text-blue-600 dark:text-blue-400">
                          -{formatRs(bill.cashbackRedeemedAmount)}
                        </span>
                      }
                      icon={Gift}
                    />
                  )}
                  {(bill.loyaltyPointsRedeemed ?? 0) > 0 &&
                    !(bill.cashbackRedeemedAmount ?? 0) && (
                      <DetailRow
                        label="Points used"
                        value={
                          <span className="text-blue-600 dark:text-blue-400">
                            -{bill.loyaltyPointsRedeemed} pts
                          </span>
                        }
                        icon={Gift}
                      />
                    )}
                  <DetailRow
                    label="Amount to pay"
                    value={
                      <span className="font-semibold">
                        {formatRs(bill.userPaidAmount ?? bill.finalAmount)}
                      </span>
                    }
                    icon={Receipt}
                  />
                </div>
              </div>
            )}
            {hasLoyalty && (
              <div>
                <SectionTitle icon={Gift} title="Loyalty on this bill" />
                <div className="mt-3 space-y-0">
                  {isCashbackBill ? (
                    <>
                      {(bill.cashbackRedeemedAmount ?? 0) > 0 && (
                        <DetailRow
                          label="Cashback used"
                          value={
                            <span className="text-blue-600 dark:text-blue-400">
                              -{formatRs(bill.cashbackRedeemedAmount)}
                            </span>
                          }
                          icon={Gift}
                        />
                      )}
                      {(bill.cashbackAmount ?? bill.loyaltyPointsEarned ?? 0) >
                        0 && (
                        <DetailRow
                          label="Cashback earned"
                          value={formatRs(
                            bill.cashbackAmount ??
                              bill.loyaltyPointsEarned ??
                              0,
                          )}
                          icon={Gift}
                        />
                      )}
                    </>
                  ) : (
                    <>
                      {(bill.loyaltyPointsRedeemed ?? 0) > 0 && (
                        <DetailRow
                          label="Points used"
                          value={`${bill.loyaltyPointsRedeemed} pts`}
                          icon={Gift}
                        />
                      )}
                      {(bill.loyaltyPointsEarned ?? 0) > 0 && (
                        <DetailRow
                          label="Points earned"
                          value={`${bill.loyaltyPointsEarned} pts`}
                          icon={Gift}
                        />
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Single card: Bill & Customer */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Bill & customer</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2">
          <div>
            <SectionTitle icon={Receipt} title="Bill" />
            <div className="mt-3 space-y-0">
              <DetailRow
                label="Bill number"
                value={bill?.billNumber ?? "—"}
                icon={Receipt}
                isLoading={isLoading && !bill}
                skeletonWidth="w-32"
              />
              <DetailRow
                label="Amount to pay"
                value={amountFormatted}
                icon={Receipt}
                isLoading={isLoading && !bill}
                skeletonWidth="w-24"
              />
              <DetailRow
                label="Date"
                value={
                  bill?.createdAt ? <DateDisplay date={bill.createdAt} /> : "—"
                }
                icon={CalendarDays}
                isLoading={isLoading && !bill}
                skeletonWidth="w-28"
              />
              {!isLoading && feedbackPath && (
                <DetailRow
                  label="Feedback"
                  value={
                    <Link
                      href={feedbackPath}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        buttonVariants({ variant: "link", size: "sm" }),
                        "h-auto p-0 font-normal",
                      )}
                    >
                      <MessageSquare className="mr-1.5 inline size-3.5" />
                      Open form
                      <ExternalLink className="ml-1 inline size-3" />
                    </Link>
                  }
                  icon={MessageSquare}
                />
              )}
            </div>
          </div>
          <div>
            <SectionTitle icon={User} title="Customer" />
            <div className="mt-3 space-y-0">
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
                <div className="text-muted-foreground py-2.5 text-sm">
                  No contact details on file
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Line items */}
      {(bill?.lineItems?.length ?? 0) > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="text-muted-foreground size-4" />
              Line items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b">
                    <th className="px-4 py-3 text-left font-medium">
                      SKU / Name
                    </th>
                    <th className="px-4 py-3 text-right font-medium">Qty</th>
                    <th className="px-4 py-3 text-right font-medium">
                      Unit price
                    </th>
                    <th className="px-4 py-3 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {bill?.lineItems?.map((li: BillLineItemResponse) => {
                    const price = li.unitPrice ?? li.sku.price ?? 0;
                    const lineTotal = li.qty * price;
                    return (
                      <tr key={li.id} className="border-b last:border-b-0">
                        <td className="px-4 py-3">
                          <div className="text-muted-foreground font-mono text-xs">
                            {li.sku.sku}
                          </div>
                          <div className="font-medium">{li.sku.name}</div>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {li.qty}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          ₹
                          {price.toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="px-4 py-3 text-right font-medium tabular-nums">
                          ₹
                          {lineTotal.toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loyalty logs — compact table */}
      {showLoyaltyLogsTable && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Gift className="text-muted-foreground size-4" />
              Loyalty logs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b">
                    <th className="px-4 py-3 text-left font-medium">Kind</th>
                    <th className="px-4 py-3 text-left font-medium">Type</th>
                    <th className="px-4 py-3 text-left font-medium">Source</th>
                    <th className="px-4 py-3 text-right font-medium">Amount</th>
                    <th className="px-4 py-3 text-right font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
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
                      <tr key={log.id} className="border-b last:border-b-0">
                        <td className="px-4 py-3 font-medium">{kindLabel}</td>
                        <td className="px-4 py-3 font-medium">
                          {formatLoyaltyType(log.type)}
                        </td>
                        <td className="text-muted-foreground px-4 py-3">
                          {sourceLabel}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {prefix}
                          {amountDisplay}
                        </td>
                        <td className="text-muted-foreground px-4 py-3 text-right">
                          {new Date(log.createdAt).toLocaleString("en-IN", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
