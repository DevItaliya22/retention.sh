import { z } from "zod";
import {
  emailSchema,
  nameSchema,
  optionalPasswordSchema,
  passwordSchema,
  slugSchema,
} from "./common";

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

export const cashiersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).optional(),
  perPage: z.coerce.number().int().min(1).max(100).default(10).optional(),
  sort: z.string().max(100, "Sort parameter is too long").optional(),
  name: z.string().max(255, "Name filter is too long").trim().optional(),
  email: z.string().max(254, "Email filter is too long").trim().optional(),
  isActive: z.enum(["true", "false"]).optional(),
});

export type CreateCashierInput = z.infer<typeof createCashierSchema>;
export type UpdateCashierInput = z.infer<typeof updateCashierSchema>;
export type CashiersQueryInput = z.infer<typeof cashiersQuerySchema>;
