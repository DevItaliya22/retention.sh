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
import { isServiceEnabledSchema } from "../utils/service-enabled";

export const updateBusinessSchema = z.object({
  name: businessNameSchema.optional(),
  website: urlSchema,
  defaultPointsName: pointsNameSchema.optional(),
  defaultCurrencySymbol: currencySymbolSchema.optional(),
  defaultCurrencyCode: currencyCodeSchema.optional(),
  registrationBonusPoints: z.coerce
    .number()
    .int()
    .min(0)
    .max(999999)
    .optional(),
  /** Partial service enable updates: { referral?: boolean, loyalty?: boolean } */
  serviceEnabled: isServiceEnabledSchema,
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
