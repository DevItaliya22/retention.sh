import { z } from "zod";
import { baseBusinessSchema, baseCashierSchema } from "./shared";

export const updateBusinessSchema = z.object({
  ...baseBusinessSchema,
});

export const updateCashierSchema = z.object({
  id: z.string(),
  ...baseCashierSchema,
});

export const addCashierSchema = z.object({
  cashierName: z.string().min(1, "Name is required"),
  cashierEmail: z.string().email("Invalid email").min(1, "Email is required"),
  cashierLinkSlug: z.string().min(1, "Cashier slug is required"),
  cashierPassword: z.string().min(6, "Password too short"),
});
