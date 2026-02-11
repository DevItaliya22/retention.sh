import { z } from "zod";
import { emailSchema, nameSchema } from "./common";

export const phoneNumberSchema = z
  .string()
  .min(1, "Phone number is required")
  .min(6, "Phone number must be at least 6 digits")
  .max(20, "Phone number is too long")
  .trim();

export const billNumberSchema = z
  .string()
  .min(1, "Bill number is required")
  .max(255, "Bill number is too long (max 255 characters)")
  .trim();

export const amountSchema = z
  .number()
  .min(0, "Amount must be non-negative")
  .optional()
  .nullable();

/** Single line item: SKU + quantity (optional unit price at time of purchase) */
export const billLineItemSchema = z.object({
  skuId: z.string().uuid("Invalid SKU ID"),
  qty: z.coerce.number().int().min(1, "Quantity must be at least 1"),
  unitPrice: z.number().min(0).optional(),
});

export const billLineItemsSchema = z.array(billLineItemSchema);

export type BillLineItemInput = z.infer<typeof billLineItemSchema>;

/** Tax array: for now empty; each element contributes to finalAmount. */
export const taxArraySchema = z
  .array(z.number().int().min(0))
  .optional()
  .default([]);

export const billFormSchema = z.object({
  billNumber: billNumberSchema,
  phoneNumber: phoneNumberSchema,
  name: nameSchema.optional().nullable(),
  /** Subtotal (line items sum before store discount/tax). Required when no line items. Non-negative. */
  subtotal: z.coerce
    .number()
    .min(0, "Subtotal must be non-negative")
    .optional()
    .nullable(),
  /** Store discount (₹). Optional, default 0. Non-negative. */
  storeDiscount: z.coerce
    .number()
    .min(0, "Store discount must be non-negative")
    .optional()
    .nullable()
    .default(0),
  /** Tax breakdown (e.g. per rate). For now empty. Optional. */
  tax: taxArraySchema,
  lineItems: billLineItemsSchema.optional(),
  redeemPoints: z.coerce
    .number()
    .int()
    .min(0, "Redeem points must be non-negative")
    .optional(),
  /** Cashback (₹) to redeem from wallet. For CASHBACK/TIER loyalty types. */
  redeemCashback: z.coerce
    .number()
    .min(0, "Redeem cashback must be non-negative")
    .optional(),
  notes: z
    .string()
    .max(2000, "Notes are too long (max 2000 characters)")
    .trim()
    .optional()
    .nullable(),
  paymentMethod: z
    .string()
    .max(50, "Payment method is too long")
    .trim()
    .optional()
    .nullable(),
});

export const createBillApiSchema = billFormSchema.extend({
  businessId: z.string().uuid("Invalid business ID"),
});

export const billsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).optional(),
  perPage: z.coerce.number().int().min(1).max(100).default(10).optional(),
  sort: z.string().max(100, "Sort parameter is too long").optional(),
  billNumber: z
    .string()
    .max(255, "Bill number filter is too long")
    .trim()
    .optional(),
  email: z.string().max(254, "Email filter is too long").trim().optional(),
  customerName: z
    .string()
    .max(255, "Customer name filter is too long")
    .trim()
    .optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  amountMin: z.coerce
    .number()
    .min(0, "Amount min must be non-negative")
    .optional(),
  amountMax: z.coerce
    .number()
    .min(0, "Amount max must be non-negative")
    .optional(),
});

/** Import schema: allows legacy amount (treated as subtotal) and retains email/address. */
export const billImportItemSchema = billFormSchema.extend({
  /** Legacy: if provided, used as subtotal when subtotal not set. */
  amount: amountSchema.optional(),
  email: emailSchema.optional().nullable(),
  addressLine1: z.string().max(255).trim().optional().nullable(),
  addressLine2: z.string().max(255).trim().optional().nullable(),
  city: z.string().max(100).trim().optional().nullable(),
  state: z.string().max(100).trim().optional().nullable(),
  country: z.string().max(100).trim().optional().nullable(),
  postalCode: z.string().max(20).trim().optional().nullable(),
});

export const billImportSchema = z.object({
  items: z.array(billImportItemSchema),
});

export type BillFormInput = z.infer<typeof billFormSchema>;
export type CreateBillApiInput = z.infer<typeof createBillApiSchema>;
export type BillsQueryInput = z.infer<typeof billsQuerySchema>;
export type BillImportInput = z.infer<typeof billImportSchema>;
