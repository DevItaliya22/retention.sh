import { z } from "zod";
import {
  cashierEmailLocalPartSchema,
  emailSchema,
  emailSuffixSchema,
  nameSchema,
  optionalPasswordSchema,
  passwordSchema,
  slugSchema,
} from "./common";

// API schemas (receive the fully-composed email)
export const createCashierSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  cashierLinkSlug: slugSchema,
});

export const updateCashierSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: optionalPasswordSchema,
  cashierLinkSlug: slugSchema,
  isActive: z.boolean().optional(),
});

// Form schemas (UI captures local part + suffix, email is composed before API call)
export const createCashierFormSchema = z.object({
  name: nameSchema,
  emailLocalPart: cashierEmailLocalPartSchema,
  emailSuffix: emailSuffixSchema,
  password: passwordSchema,
  cashierLinkSlug: slugSchema,
});

export const updateCashierFormSchema = z.object({
  name: nameSchema,
  emailLocalPart: cashierEmailLocalPartSchema,
  emailSuffix: emailSuffixSchema,
  password: optionalPasswordSchema,
  cashierLinkSlug: slugSchema,
  isActive: z.boolean().optional(),
});

export const cashiersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).optional(),
  perPage: z.coerce.number().int().min(1).max(100).default(10).optional(),
  sort: z.string().max(100, "Sort parameter is too long").optional(),
  name: z.string().max(255, "Name filter is too long").trim().optional(),
  email: z.string().max(254, "Email filter is too long").trim().optional(),
  isActive: z.enum(["true", "false"]).optional(),
});

/** Cashier customer search: search existing business customers by phone */
export const searchBusinessCustomerSchema = z.object({
  phone: z
    .string()
    .min(4, "Phone number must be at least 4 digits")
    .max(20, "Phone number is too long"),
  businessId: z.string().uuid("Invalid business ID"),
});

/** Cashier customer search: search users not yet linked to this business */
export const searchUserCustomerSchema = z.object({
  phone: z
    .string()
    .min(6, "Phone number must be at least 6 digits")
    .max(20, "Phone number is too long"),
  businessId: z.string().uuid("Invalid business ID"),
});

export type CreateCashierInput = z.infer<typeof createCashierSchema>;
export type UpdateCashierInput = z.infer<typeof updateCashierSchema>;
export type CreateCashierFormValues = z.infer<typeof createCashierFormSchema>;
export type UpdateCashierFormValues = z.infer<typeof updateCashierFormSchema>;
export type CashiersQueryInput = z.infer<typeof cashiersQuerySchema>;
export type SearchBusinessCustomerInput = z.infer<
  typeof searchBusinessCustomerSchema
>;
export type SearchUserCustomerInput = z.infer<typeof searchUserCustomerSchema>;
