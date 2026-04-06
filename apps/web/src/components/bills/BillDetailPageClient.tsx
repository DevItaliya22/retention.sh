"use client";

import { useBreadcrumbOverride } from "@/components/layouts/context/breadcrumb-override";
import { useBillInvoiceQuery } from "@/hooks/bills/useBillInvoiceQuery";
import type {
  BillLineItemResponse,
  BillLoyaltyLog,
} from "@/hooks/bills/useBillQuery";
import { useBillQuery } from "@/hooks/bills/useBillQuery";
import { downloadBillInvoicePdf } from "@/lib/invoice/pdf";
import {
  Button,
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
import { Receipt } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

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
  isLoading,
  skeletonWidth = "w-32",
}: {
  label: string;
  value: React.ReactNode;
  isLoading?: boolean;
  skeletonWidth?: string;
}) {
  return (
    <div className="grid grid-cols-[110px_1fr] gap-3 py-2.5 first:pt-0 last:pb-0">
      <p className="text-muted-foreground text-[11px] font-medium tracking-wider uppercase">
        {label}
      </p>
      {isLoading ? (
        <Skeleton className={cn("h-5", skeletonWidth)} />
      ) : (
        <div className="text-sm leading-snug font-medium">{value}</div>
      )}
    </div>
  );
}

export function BillDetailPageClient({ billId }: BillDetailPageClientProps) {
  const prefersReducedMotion = useReducedMotion();
  const [isDownloadingInvoice, setIsDownloadingInvoice] = useState(false);
  const { data, isLoading, isError, error } = useBillQuery(billId);
  const { data: invoiceData, isLoading: isInvoiceLoading } =
    useBillInvoiceQuery(billId);
  const setSegmentLabel = useBreadcrumbOverride()?.setSegmentLabel;
  const bill = data?.bill ?? null;
  const invoice = invoiceData?.invoice ?? null;

  useEffect(() => {
    if (bill?.billNumber) {
      setSegmentLabel?.(bill.billNumber);
    }
    return () => {
      setSegmentLabel?.(null);
    };
  }, [bill?.billNumber, setSegmentLabel]);

  const handleDownloadInvoice = async () => {
    if (!invoice) {
      toast.error("Invoice is not ready yet");
      return;
    }

    try {
      setIsDownloadingInvoice(true);
      await downloadBillInvoicePdf(invoice);
    } catch (downloadError) {
      toast.error(
        downloadError instanceof Error
          ? downloadError.message
          : "Failed to download invoice",
      );
    } finally {
      setIsDownloadingInvoice(false);
    }
  };

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
      ? `₹${n.toLocaleString("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`
      : "—";

  const taxTotal = (bill?.tax ?? []).reduce((sum, amount) => sum + amount, 0);
  const cashbackRedeemed = bill?.cashbackRedeemedAmount ?? 0;
  const cashbackEarned = bill?.cashbackAmount ?? 0;

  const loyaltyLogs = bill?.loyaltyLogs ?? [];
  const showLoyaltyLogsTable = loyaltyLogs.length > 0;

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
              <div className="flex items-end gap-3">
                <Skeleton className="h-9 w-40" />
                <Skeleton className="h-4 w-28" />
              </div>
            ) : (
              <div className="flex flex-wrap items-end gap-3">
                <p className="font-mono text-2xl font-semibold tracking-tight sm:text-3xl">
                  {bill?.billNumber ?? "—"}
                </p>
                {bill?.createdAt && (
                  <>
                    <span className="bg-border mb-1 h-4 w-px" />
                    <div className="text-muted-foreground pb-1 text-xs">
                      <DateDisplay date={bill.createdAt} />
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
          <div className="flex items-end gap-5">
            <div className="text-right sm:pb-0.5">
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
            <div className="bg-border h-14 w-px" />
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={isDownloadingInvoice || isInvoiceLoading || !invoice}
                onClick={handleDownloadInvoice}
              >
                {isDownloadingInvoice ? "Preparing..." : "Download invoice"}
              </Button>
              {bill?.businessCustomerId && (
                <Link
                  href={`/customers/${bill.businessCustomerId}`}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  View customer
                </Link>
              )}
            </div>
          </div>
        </div>
      </motion.section>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <motion.section
          variants={s.item}
          className="bg-card rounded-2xl border p-6 shadow-sm"
        >
          <h3 className="text-foreground/90 mb-5 text-sm font-semibold tracking-wider uppercase">
            Totals
          </h3>
          {isLoading && !bill ? (
            <div className="space-y-3">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
            </div>
          ) : (
            <div className="space-y-1">
              <div className="flex justify-between py-2 text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-mono tabular-nums">
                  {formatRs(bill?.subtotal ?? billTotal)}
                </span>
              </div>
              <div className="flex justify-between py-2 text-sm">
                <span className="text-muted-foreground">Store discount</span>
                <span className="font-mono tabular-nums">
                  -{formatRs(bill?.storeDiscount ?? 0)}
                </span>
              </div>
              <div className="flex justify-between py-2 text-sm">
                <span className="text-muted-foreground">Tax</span>
                <span className="font-mono tabular-nums">
                  {formatRs(taxTotal)}
                </span>
              </div>
              <div className="flex justify-between py-2 text-sm">
                <span className="text-muted-foreground">Cashback redeemed</span>
                <span className="font-mono tabular-nums">
                  -{formatRs(cashbackRedeemed)}
                </span>
              </div>
              <div className="flex justify-between py-2 text-sm">
                <span className="text-muted-foreground">Cashback earned</span>
                <span className="font-mono tabular-nums">
                  {formatRs(cashbackEarned)}
                </span>
              </div>
              <div className="bg-muted/30 -mx-6 mt-2 flex justify-between border-t px-6 py-3 text-sm">
                <span className="font-semibold">Amount paid</span>
                <span className="font-mono font-bold tabular-nums">
                  {formatRs(
                    bill?.userPaidAmount ?? bill?.finalAmount ?? billTotal,
                  )}
                </span>
              </div>
            </div>
          )}
        </motion.section>

        <motion.section
          variants={s.item}
          className="bg-card rounded-2xl border p-6 shadow-sm lg:max-w-[340px]"
        >
          <h3 className="text-foreground/90 mb-5 text-sm font-semibold tracking-wider uppercase">
            Customer
          </h3>
          <div className="space-y-0">
            <DetailRow
              label="Name"
              value={bill?.customerName ?? "—"}
              isLoading={isLoading && !bill}
              skeletonWidth="w-40"
            />
            {(bill?.customerPhone ?? isLoading) && (
              <DetailRow
                label="Phone"
                value={bill?.customerPhone ?? "—"}
                isLoading={isLoading && !bill}
                skeletonWidth="w-28"
              />
            )}
            {(bill?.customerEmail ?? isLoading) && (
              <DetailRow
                label="Email"
                value={bill?.customerEmail ?? "—"}
                isLoading={isLoading && !bill}
                skeletonWidth="w-48"
              />
            )}
            {!isLoading && !bill?.customerPhone && !bill?.customerEmail && (
              <p className="text-muted-foreground py-3 text-sm">
                No contact details on file
              </p>
            )}
            {!isLoading && bill && (
              <div className="border-border mt-4 space-y-3 border-t pt-4">
                <p className="text-muted-foreground text-[11px] font-medium tracking-wider uppercase">
                  Feedback
                </p>
                {bill.feedback ? (
                  <div className="space-y-3">
                    {bill.feedback.rating != null && (
                      <div className="flex items-baseline gap-2">
                        <span className="text-muted-foreground text-xs">
                          Rating
                        </span>
                        <span className="text-sm font-semibold">
                          {bill.feedback.rating}
                          <span className="text-muted-foreground text-xs font-normal">
                            /5
                          </span>
                        </span>
                      </div>
                    )}
                    {bill.feedback.selectionOptions.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-muted-foreground text-xs font-medium">
                          Selection
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {bill.feedback.selectionOptions.map((opt) => (
                            <span
                              key={opt.id}
                              className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs"
                            >
                              {opt.label}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {bill.feedback.selectedCategories.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-muted-foreground text-xs font-medium">
                          Categories
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {bill.feedback.selectedCategories.map((name) => (
                            <span
                              key={name}
                              className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs"
                            >
                              {name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {bill.feedback.howDidYouHear && (
                      <DetailRow
                        label="How they heard"
                        value={bill.feedback.howDidYouHear}
                      />
                    )}
                    {bill.feedback.comment && (
                      <div className="space-y-1">
                        <span className="text-muted-foreground text-xs font-medium">
                          Comment
                        </span>
                        <p className="text-sm leading-snug whitespace-pre-wrap">
                          {bill.feedback.comment}
                        </p>
                      </div>
                    )}
                    <p className="text-muted-foreground text-xs">
                      Submitted <DateDisplay date={bill.feedback.submittedAt} />
                    </p>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    Not submitted yet
                  </p>
                )}
              </div>
            )}
          </div>
        </motion.section>
      </div>

      {(bill?.lineItems?.length ?? 0) > 0 && (
        <motion.section variants={s.item}>
          <div className="bg-card overflow-hidden rounded-2xl border shadow-sm">
            <div className="bg-muted/20 border-b px-6 py-4">
              <h3 className="text-foreground/90 text-sm font-semibold tracking-wider uppercase">
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

      {showLoyaltyLogsTable && (
        <motion.section variants={s.item}>
          <div className="bg-card overflow-hidden rounded-2xl border shadow-sm">
            <div className="bg-muted/20 border-b px-6 py-4">
              <h3 className="text-foreground/90 text-sm font-semibold tracking-wider uppercase">
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
    </motion.div>
  );
}
