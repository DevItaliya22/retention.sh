import { z } from "zod";

export const baseBusinessSchema = {
  businessName: z.string().min(2, "Business name is too short"),
  businessSlug: z
    .string()
    .min(2, "Slug is too short")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug can only contain lowercase letters, numbers, and hyphens",
    ),
  defaultPointsName: z.string().min(1, "Points name is required"),
  defaultCurrencySymbol: z.string().min(1, "Currency symbol is required"),
  defaultCurrencyCode: z.string().min(1, "Currency code is required"),
  businessSlugAvailable: z.boolean().optional(),
  logo: z.string().optional().nullable(),
  themeColor: z.string().optional().nullable(),
};

export const baseCashierSchema = {
  cashierName: z.string().optional(),
  cashierEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  cashierLinkSlug: z.string().optional().or(z.literal("")),
};
