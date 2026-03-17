import { z } from "zod";
import {
  businessNameSchema,
  cashierEmailLocalPartSchema,
  currencyCodeSchema,
  currencySymbolSchema,
  emailSuffixSchema,
  nameSchema,
  pointsNameSchema,
  slugSchema,
  themeColorSchema,
  urlSchema,
} from "./common";

export const baseBusinessSchema = {
  businessName: businessNameSchema,
  businessSlug: slugSchema,
  defaultPointsName: pointsNameSchema,
  defaultCurrencySymbol: currencySymbolSchema,
  defaultCurrencyCode: currencyCodeSchema,
  businessSlugAvailable: z.boolean().optional(),
  logo: urlSchema,
  themeColor: themeColorSchema,
  website: urlSchema,
};

export const storageAssetSchema = z.object({
  url: urlSchema,
  key: z.string().max(512, "Storage key is too long").optional().nullable(),
  contentType: z
    .string()
    .max(255, "Content type is too long")
    .optional()
    .nullable(),
  size: z.number().int().min(0).optional().nullable(),
});

export const baseCashierSchema = {
  cashierName: nameSchema.optional().or(z.literal("")),
  cashierEmailLocalPart: cashierEmailLocalPartSchema
    .optional()
    .or(z.literal("")),
  cashierEmailSuffix: emailSuffixSchema.optional().or(z.literal("")),
  cashierLinkSlug: slugSchema.optional().or(z.literal("")),
};
