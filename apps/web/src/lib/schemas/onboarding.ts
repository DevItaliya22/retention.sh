import { z } from "zod";
import { optionalPasswordSchema } from "./common";
import { baseBusinessSchema, baseCashierSchema } from "./shared";

export const businessStepSchema = z
  .object({
    ...baseBusinessSchema,
  })
  .refine(
    (data) => {
      const slug = (data.businessSlug ?? "").trim();
      if (!slug) return true;
      return data.businessSlugAvailable === true;
    },
    { message: "Not available", path: ["businessSlug"] },
  );

export const cashierStepSchema = z
  .object({
    ...baseCashierSchema,
    createCashier: z.boolean().default(false),
    cashierPassword: optionalPasswordSchema,
  })
  .refine(
    (data) => {
      if (data.createCashier) {
        return (
          !!data.cashierName &&
          !!data.cashierEmailLocalPart &&
          !!data.cashierEmailSuffix &&
          !!data.cashierPassword &&
          !!data.cashierLinkSlug
        );
      }
      return true;
    },
    {
      message: "Please fill all cashier fields if you want to create one",
      path: ["cashierName"],
    },
  );

export const welcomeFormSchema = z.object({
  ...businessStepSchema.shape,
  ...cashierStepSchema.shape,
});

export type WelcomeFormValues = z.infer<typeof welcomeFormSchema>;
