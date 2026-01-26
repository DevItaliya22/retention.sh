import { z } from "zod";
import {
  businessNameSchema,
  currencyCodeSchema,
  currencySymbolSchema,
  pointsNameSchema,
  textSchema,
  themeColorSchema,
  urlSchema,
} from "./common";

export const updateBusinessSchema = z.object({
  name: businessNameSchema.optional(),
  defaultPointsName: pointsNameSchema.optional(),
  defaultCurrencySymbol: currencySymbolSchema.optional(),
  defaultCurrencyCode: currencyCodeSchema.optional(),
  defaultBranding: z
    .object({
      logo: urlSchema,
      themeColor: themeColorSchema,
      textColor: themeColorSchema,
      bannerImage: urlSchema,
      header: textSchema(200),
      subtitle: textSchema(500),
    })
    .optional(),
});

export type UpdateBusinessInput = z.infer<typeof updateBusinessSchema>;
