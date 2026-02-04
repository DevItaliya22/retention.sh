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
  .min(0, "Amount must be positive")
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

export const billFormSchema = z.object({
  billNumber: billNumberSchema,
  phoneNumber: phoneNumberSchema,
  name: nameSchema.optional().nullable(),
  email: emailSchema.optional().nullable(),
  addressLine1: z
    .string()
    .max(255, "Address line 1 is too long (max 255 characters)")
    .trim()
    .optional()
    .nullable(),
  addressLine2: z
    .string()
    .max(255, "Address line 2 is too long (max 255 characters)")
    .trim()
    .optional()
    .nullable(),
  city: z
    .string()
    .max(100, "City is too long (max 100 characters)")
    .trim()
    .optional()
    .nullable(),
  state: z
    .string()
    .max(100, "State is too long (max 100 characters)")
    .trim()
    .optional()
    .nullable(),
  country: z
    .string()
    .max(100, "Country is too long (max 100 characters)")
    .trim()
    .optional()
    .nullable(),
  postalCode: z
    .string()
    .max(20, "Postal code is too long (max 20 characters)")
    .trim()
    .optional()
    .nullable(),
  amount: amountSchema,
  lineItems: billLineItemsSchema.optional(),
  redeemPoints: z.coerce.number().int().min(0).optional(),
  notes: z
    .string()
    .max(2000, "Notes are too long (max 2000 characters)")
    .trim()
    .optional()
    .nullable(),
});

export const createBillApiSchema = billFormSchema.extend({
  businessId: z.string().uuid("Invalid business ID"),
});

export const searchBusinessCustomerSchema = z.object({
  phone: z
    .string()
    .min(4, "Phone number must be at least 4 digits")
    .max(20, "Phone number is too long"),
  businessId: z.string().uuid("Invalid business ID"),
});

export const searchUserCustomerSchema = z.object({
  phone: z
    .string()
    .min(6, "Phone number must be at least 6 digits")
    .max(20, "Phone number is too long"),
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
  amountMin: z.coerce.number().optional(),
  amountMax: z.coerce.number().optional(),
});

export const billImportItemSchema = billFormSchema;

export const billImportSchema = z.object({
  items: z.array(billImportItemSchema),
});

export type BillFormInput = z.infer<typeof billFormSchema>;
export type CreateBillApiInput = z.infer<typeof createBillApiSchema>;
export type SearchBusinessCustomerInput = z.infer<
  typeof searchBusinessCustomerSchema
>;
export type SearchUserCustomerInput = z.infer<typeof searchUserCustomerSchema>;
export type BillsQueryInput = z.infer<typeof billsQuerySchema>;
export type BillImportInput = z.infer<typeof billImportSchema>;
