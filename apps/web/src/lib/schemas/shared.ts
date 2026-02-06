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

export const baseCashierSchema = {
  cashierName: nameSchema.optional().or(z.literal("")),
  cashierEmailLocalPart: cashierEmailLocalPartSchema
    .optional()
    .or(z.literal("")),
  cashierEmailSuffix: emailSuffixSchema.optional().or(z.literal("")),
  cashierLinkSlug: slugSchema.optional().or(z.literal("")),
};
