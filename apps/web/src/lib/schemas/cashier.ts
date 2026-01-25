import { z } from "zod";
import { nameSchema, emailSchema, passwordSchema, optionalPasswordSchema, slugSchema } from "./common";

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
});

export type CreateCashierInput = z.infer<typeof createCashierSchema>;
export type UpdateCashierInput = z.infer<typeof updateCashierSchema>;
