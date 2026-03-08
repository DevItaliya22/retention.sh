import { z } from "zod";

export const billInvoiceParamSchema = z.object({
  id: z.string().uuid("Invalid bill ID"),
});

export const billInvoiceItemSchema = z.object({
  id: z.string(),
  description: z.string().min(1),
  skuCode: z.string().nullable(),
  quantity: z.number().int().min(1),
  unitPrice: z.number().min(0),
  total: z.number().min(0),
});

export const billInvoiceTotalsSchema = z.object({
  subtotal: z.number().min(0),
  storeDiscount: z.number().min(0),
  tax: z.number().min(0),
  billTotal: z.number().min(0),
  cashbackRedeemed: z.number().min(0),
  amountPaid: z.number().min(0),
  cashbackEarned: z.number().min(0),
});

export const billInvoiceSchema = z.object({
  billId: z.string().uuid(),
  invoiceNumber: z.string().min(1),
  issuedAt: z.string().datetime(),
  business: z.object({
    id: z.string().uuid(),
    name: z.string().min(1),
    slug: z.string().min(1),
    currencySymbol: z.string().min(1),
    currencyCode: z.string().min(1),
  }),
  customer: z.object({
    name: z.string().min(1),
    phone: z.string().nullable(),
    email: z.string().email().nullable(),
  }),
  paymentMethod: z.string().nullable(),
  notes: z.string().nullable(),
  items: z.array(billInvoiceItemSchema).min(1),
  totals: billInvoiceTotalsSchema,
});

export const billInvoiceResponseSchema = z.object({
  invoice: billInvoiceSchema.nullable(),
  error: z.string().optional(),
});

export type BillInvoice = z.infer<typeof billInvoiceSchema>;
export type BillInvoiceResponse = z.infer<typeof billInvoiceResponseSchema>;
