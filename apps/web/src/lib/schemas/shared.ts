import { z } from "zod";
import {
  businessNameSchema,
  currencyCodeSchema,
  currencySymbolSchema,
  emailSchema,
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
};

export const baseCashierSchema = {
  cashierName: nameSchema.optional().or(z.literal("")),
  cashierEmail: emailSchema.optional().or(z.literal("")),
  cashierLinkSlug: slugSchema.optional().or(z.literal("")),
};
