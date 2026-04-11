import { z } from "zod";
import {
  businessNameSchema,
  optionalPasswordSchema,
  websiteInputSchema,
} from "./common";
import { baseBusinessSchema, baseCashierSchema } from "./shared";

/** Fields collected on the business step of the welcome form (UI shows name + website only). */
export const businessStepSchema = z.object({
  businessName: businessNameSchema,
  website: websiteInputSchema,
});

const industryFieldsSchema = z.object({
  industries: z.array(z.string().max(64)).default([]),
});

export const industryStepSchema = industryFieldsSchema;

const cashierFieldsSchema = z.object({
  ...baseCashierSchema,
  createCashier: z.boolean().default(false),
  cashierPassword: optionalPasswordSchema,
});

export const cashierStepSchema = cashierFieldsSchema.refine(
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

/** Full payload for POST /api/onboarding (includes fields not shown in the first step UI). */
export const welcomeFormSchema = z
  .object({
    ...baseBusinessSchema,
    ...industryFieldsSchema.shape,
    ...cashierFieldsSchema.shape,
    website: websiteInputSchema,
  })
  .refine(
    (data) => {
      const slug = (data.businessSlug ?? "").trim();
      if (!slug) return true;
      return data.businessSlugAvailable === true;
    },
    { message: "Not available", path: ["businessSlug"] },
  )
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

export type WelcomeFormValues = z.infer<typeof welcomeFormSchema>;
