"use client";

import { useBillInvoiceQuery } from "@/hooks/bills/useBillInvoiceQuery";
import { downloadBillInvoicePdf } from "@/lib/invoice/pdf";
import {
  Button,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@reelo/ui/components";
import { Download, ReceiptText } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface BillInvoiceCardProps {
  billId: string;
}

function LabelValueRow({
  label,
  value,
  emphasize = false,
}: {
  label: string;
  value: React.ReactNode;
  emphasize?: boolean;
}) {
  return (
    <div className="grid grid-cols-[minmax(120px,1fr)_minmax(0,1fr)] items-start gap-3 py-2">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span
        className={`text-right text-sm tabular-nums ${emphasize ? "font-semibold" : "font-medium"}`}
      >
        {value}
      </span>
    </div>
  );
}

function formatCurrency(value: number, symbol: string) {
  return `${symbol}${value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function BillInvoiceCard({ billId }: BillInvoiceCardProps) {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const { data, isLoading, isError, error } = useBillInvoiceQuery(billId);
  const invoice = data?.invoice ?? null;

  const handleDownloadPdf = async () => {
    if (!invoice) {
      toast.error("Invoice is not ready yet");
      return;
    }

    try {
      setIsGeneratingPdf(true);
      await downloadBillInvoicePdf(invoice);
    } catch (downloadError) {
      toast.error(
        downloadError instanceof Error
          ? downloadError.message
          : "Failed to generate invoice PDF",
      );
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  if (isError) {
    return (
      <section className="bg-card rounded-2xl border p-6 shadow-sm">
        <div className="mb-2 flex items-center gap-2">
          <ReceiptText className="text-muted-foreground size-4" />
          <h3 className="text-sm font-semibold tracking-wider uppercase">
            Invoice
          </h3>
        </div>
        <p className="text-sm text-red-600 dark:text-red-400">
          {error?.message ?? "Failed to load invoice"}
        </p>
      </section>
    );
  }

  if (isLoading || !invoice) {
    return (
      <section className="bg-card rounded-2xl border p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-9 w-32" />
        </div>
        <Skeleton className="mb-3 h-4 w-48" />
        <Skeleton className="mb-5 h-4 w-36" />
        <Skeleton className="h-40 w-full" />
      </section>
    );
  }

  const { currencySymbol } = invoice.business;

  return (
    <section className="bg-card overflow-hidden rounded-2xl border shadow-sm">
      <div className="bg-muted/20 flex flex-wrap items-start justify-between gap-4 border-b px-6 py-4">
        <div>
          <h3 className="text-foreground/90 flex items-center gap-2 text-sm font-semibold tracking-wider uppercase">
            <ReceiptText className="text-muted-foreground size-4" />
            Invoice
          </h3>
          <p className="text-muted-foreground mt-1 text-xs">
            Bill #{invoice.invoiceNumber} •{" "}
            {new Date(invoice.issuedAt).toLocaleString("en-IN")}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          icon={<Download className="h-4 w-4" />}
          onClick={handleDownloadPdf}
          disabled={isGeneratingPdf}
        >
          {isGeneratingPdf ? "Preparing..." : "Download PDF"}
        </Button>
      </div>

      <div className="grid gap-4 border-b px-6 py-5 lg:grid-cols-3">
        <div className="bg-muted/10 rounded-xl border p-4">
          <p className="text-muted-foreground text-xs tracking-wider uppercase">
            Bill Details
          </p>
          <div className="mt-2 divide-y">
            <LabelValueRow label="Bill Number" value={invoice.invoiceNumber} />
            <LabelValueRow
              label="Issued At"
              value={new Date(invoice.issuedAt).toLocaleString("en-IN")}
            />
            <LabelValueRow
              label="Currency"
              value={invoice.business.currencyCode}
            />
          </div>
        </div>
        <div className="bg-muted/10 rounded-xl border p-4">
          <p className="text-muted-foreground text-xs tracking-wider uppercase">
            Business
          </p>
          <div className="mt-2 divide-y">
            <LabelValueRow label="Name" value={invoice.business.name} />
            <LabelValueRow label="Slug" value={invoice.business.slug} />
          </div>
        </div>
        <div className="bg-muted/10 rounded-xl border p-4">
          <p className="text-muted-foreground text-xs tracking-wider uppercase">
            Customer
          </p>
          <div className="mt-2 divide-y">
            <LabelValueRow label="Name" value={invoice.customer.name} />
            <LabelValueRow
              label="Phone"
              value={invoice.customer.phone ?? "—"}
            />
            <LabelValueRow
              label="Email"
              value={invoice.customer.email ?? "—"}
            />
          </div>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 border-b hover:bg-transparent">
            <TableHead className="px-6 py-3 font-medium">Item</TableHead>
            <TableHead className="px-6 py-3 text-right font-medium">
              Qty
            </TableHead>
            <TableHead className="px-6 py-3 text-right font-medium">
              Unit Price
            </TableHead>
            <TableHead className="px-6 py-3 text-right font-medium">
              Total
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoice.items.map((item) => (
            <TableRow key={item.id} className="border-b last:border-b-0">
              <TableCell className="px-6 py-3">
                <div className="font-medium">{item.description}</div>
                {item.skuCode && (
                  <div className="text-muted-foreground font-mono text-xs">
                    {item.skuCode}
                  </div>
                )}
              </TableCell>
              <TableCell className="px-6 py-3 text-right font-mono tabular-nums">
                {item.quantity}
              </TableCell>
              <TableCell className="px-6 py-3 text-right font-mono tabular-nums">
                {formatCurrency(item.unitPrice, currencySymbol)}
              </TableCell>
              <TableCell className="px-6 py-3 text-right font-mono font-medium tabular-nums">
                {formatCurrency(item.total, currencySymbol)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="border-t px-6 py-5">
        <div className="bg-muted/10 ml-auto w-full max-w-md rounded-xl border p-4">
          <p className="text-muted-foreground text-xs tracking-wider uppercase">
            Totals
          </p>
          <div className="mt-2 divide-y">
            <LabelValueRow
              label="Subtotal"
              value={formatCurrency(invoice.totals.subtotal, currencySymbol)}
            />
            <LabelValueRow
              label="Store discount"
              value={`-${formatCurrency(invoice.totals.storeDiscount, currencySymbol)}`}
            />
            <LabelValueRow
              label="Tax"
              value={formatCurrency(invoice.totals.tax, currencySymbol)}
            />
            <LabelValueRow
              label="Cashback redeemed"
              value={`-${formatCurrency(invoice.totals.cashbackRedeemed, currencySymbol)}`}
            />
            <LabelValueRow
              label="Cashback earned"
              value={formatCurrency(
                invoice.totals.cashbackEarned,
                currencySymbol,
              )}
            />
            <LabelValueRow
              label="Amount paid"
              value={formatCurrency(invoice.totals.amountPaid, currencySymbol)}
              emphasize
            />
          </div>
        </div>
      </div>

      {(invoice.paymentMethod || invoice.notes) && (
        <div className="border-t px-6 py-5">
          <div className="bg-muted/10 rounded-xl border p-4">
            <p className="text-muted-foreground text-xs tracking-wider uppercase">
              Additional Details
            </p>
            {invoice.paymentMethod && (
              <div className="mt-2 divide-y">
                <LabelValueRow
                  label="Payment method"
                  value={invoice.paymentMethod}
                />
              </div>
            )}
            {invoice.notes && (
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                {invoice.notes}
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
