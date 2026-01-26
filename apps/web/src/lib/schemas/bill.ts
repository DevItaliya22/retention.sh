import { z } from "zod";
import { nameSchema, emailSchema } from "./common";

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
  sort: z.string().optional(),
  billNumber: z.string().optional(),
  email: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  amountMin: z.coerce.number().optional(),
  amountMax: z.coerce.number().optional(),
});

export type BillFormInput = z.infer<typeof billFormSchema>;
export type CreateBillApiInput = z.infer<typeof createBillApiSchema>;
export type SearchBusinessCustomerInput = z.infer<typeof searchBusinessCustomerSchema>;
export type SearchUserCustomerInput = z.infer<typeof searchUserCustomerSchema>;
export type BillsQueryInput = z.infer<typeof billsQuerySchema>;
