import { z } from "zod";
import { baseBusinessSchema, baseCashierSchema } from "./shared";

export const businessStepSchema = z.object({
  ...baseBusinessSchema,
});

export const cashierStepSchema = z.object({
  ...baseCashierSchema,
  createCashier: z.boolean().default(false),
  cashierPassword: z.string().min(6, "Password too short").optional().or(z.literal("")),
}).refine((data) => {
  if (data.createCashier) {
    return !!data.cashierName && !!data.cashierEmail && !!data.cashierPassword && !!data.cashierLinkSlug;
  }
  return true;
}, {
  message: "Please fill all cashier fields if you want to create one",
  path: ["cashierName"],
});

export const welcomeFormSchema = z.object({
  ...businessStepSchema.shape,
  ...cashierStepSchema.shape,
});

export type WelcomeFormValues = z.infer<typeof welcomeFormSchema>;
