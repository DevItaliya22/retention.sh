import { z } from "zod";
import { emailSchema, passwordSchema } from "./common";

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const registerSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(255, "Name is too long (max 255 characters)")
    .trim(),
  email: emailSchema,
  password: passwordSchema,
});

export const cashierLoginSchema = z.object({
  businessSlug: z
    .string()
    .min(1, "Business slug is required")
    .max(100, "Business slug is too long")
    .trim(),
  cashierSlug: z
    .string()
    .min(1, "Cashier slug is required")
    .max(100, "Cashier slug is too long")
    .trim(),
  email: emailSchema,
  password: passwordSchema,
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CashierLoginInput = z.infer<typeof cashierLoginSchema>;
