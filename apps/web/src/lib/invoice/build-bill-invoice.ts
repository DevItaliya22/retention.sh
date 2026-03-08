import { sumCashbackEarnedFromTransactions } from "@/lib/loyalty";
import type { BillInvoice } from "@/lib/schemas/invoice";

type InvoiceBuilderInput = {
  bill: {
    id: string;
    billNumber: string;
    subtotal: number | null;
    storeDiscount: number | null;
    tax: number[] | null;
    finalAmount: number | null;
    userPaidAmount: number | null;
    cashbackRedeemedAmount: number | null;
    cashbackAmount: number | null;
    notes: string | null;
    paymentMethod: string | null;
    createdAt: Date;
    lineItems: Array<{
      id: string;
      qty: number;
      unitPrice: number | null;
      sku: {
        sku: string;
        name: string;
        price: number | null;
      };
    }>;
    transactions: Array<{
      type: string;
      amount: number;
      valueKind: string;
    }>;
    businessCustomer: {
      customer: {
        email: string | null;
        user: {
          name: string;
          phoneNumber: string | null;
        };
      };
    };
  };
  business: {
    id: string;
    name: string;
    slug: string;
    defaultCurrencySymbol: string | null;
    defaultCurrencyCode: string | null;
  };
};

export function buildBillInvoice({
  bill,
  business,
}: InvoiceBuilderInput): BillInvoice {
  const fallbackSubtotal = Math.max(
    0,
    bill.finalAmount ?? bill.userPaidAmount ?? 0,
  );

  const items =
    bill.lineItems.length > 0
      ? bill.lineItems.map((lineItem) => {
          const unitPrice = lineItem.unitPrice ?? lineItem.sku.price ?? 0;
          return {
            id: lineItem.id,
            description: lineItem.sku.name,
            skuCode: lineItem.sku.sku,
            quantity: lineItem.qty,
            unitPrice,
            total: Math.max(0, lineItem.qty * unitPrice),
          };
        })
      : [
          {
            id: bill.id,
            description: "Bill amount",
            skuCode: null,
            quantity: 1,
            unitPrice: fallbackSubtotal,
            total: fallbackSubtotal,
          },
        ];

  const subtotal =
    bill.subtotal ?? items.reduce((sum, item) => sum + item.total, 0);
  const storeDiscount = Math.max(0, bill.storeDiscount ?? 0);
  const tax = Math.max(
    0,
    (bill.tax ?? []).reduce((sum, amount) => sum + amount, 0),
  );

  const billTotal = Math.max(
    0,
    bill.finalAmount ?? Math.max(0, subtotal - storeDiscount + tax),
  );

  const amountPaid = Math.max(0, bill.userPaidAmount ?? billTotal);
  const cashbackRedeemed = Math.max(0, bill.cashbackRedeemedAmount ?? 0);

  const cashbackEarnedFromTx = sumCashbackEarnedFromTransactions(
    bill.transactions,
  );
  const cashbackEarned =
    cashbackEarnedFromTx > 0
      ? cashbackEarnedFromTx
      : Math.max(0, bill.cashbackAmount ?? 0);

  return {
    billId: bill.id,
    invoiceNumber: bill.billNumber,
    issuedAt: bill.createdAt.toISOString(),
    business: {
      id: business.id,
      name: business.name,
      slug: business.slug,
      currencySymbol: business.defaultCurrencySymbol ?? "₹",
      currencyCode: business.defaultCurrencyCode ?? "INR",
    },
    customer: {
      name: bill.businessCustomer.customer.user.name,
      phone: bill.businessCustomer.customer.user.phoneNumber,
      email: bill.businessCustomer.customer.email,
    },
    paymentMethod: bill.paymentMethod,
    notes: bill.notes,
    items,
    totals: {
      subtotal,
      storeDiscount,
      tax,
      billTotal,
      cashbackRedeemed,
      amountPaid,
      cashbackEarned,
    },
  };
}
