import { z } from "zod";
import { isServiceEnabledSchema } from "../utils/service-enabled";
import {
  businessNameSchema,
  currencyCodeSchema,
  currencySymbolSchema,
  pointsNameSchema,
  storagePathOrUrlSchema,
  textSchema,
  themeColorSchema,
  urlSchema,
} from "./common";
import { storageAssetSchema } from "./shared";

export const updateBusinessSchema = z.object({
  name: businessNameSchema.optional(),
  website: urlSchema,
  defaultPointsName: pointsNameSchema.optional(),
  defaultCurrencySymbol: currencySymbolSchema.optional(),
  defaultCurrencyCode: currencyCodeSchema.optional(),
  useDefaultBrandingForServices: z.boolean().optional(),
  registrationBonusPoints: z.coerce
    .number()
    .int()
    .min(0)
    .max(999999)
    .optional(),
  nextBillNumber: z.coerce.number().int().min(1).max(999999999).optional(),
  /** Partial service enable updates: { referral?: boolean, loyalty?: boolean } */
  serviceEnabled: isServiceEnabledSchema,
  defaultBranding: z
    .object({
      logo: storagePathOrUrlSchema,
      themeColor: themeColorSchema,
      textColor: themeColorSchema,
      bannerImage: storagePathOrUrlSchema,
      header: textSchema(200),
      subtitle: textSchema(500),
    })
    .optional(),
  logoAsset: storageAssetSchema.optional(),
  bannerImageAsset: storageAssetSchema.optional(),
});

export type UpdateBusinessInput = z.infer<typeof updateBusinessSchema>;
