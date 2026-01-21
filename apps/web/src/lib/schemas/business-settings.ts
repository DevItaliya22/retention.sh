import { z } from "zod";
import { baseBusinessSchema, baseCashierSchema } from "./shared";

export const updateBusinessSchema = z.object({
  ...baseBusinessSchema,
});

export const updateCashierSchema = z.object({
  id: z.string(),
  ...baseCashierSchema,
});
