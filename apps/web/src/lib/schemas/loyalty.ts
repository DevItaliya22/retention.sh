import { z } from "zod";

export const loyaltyTermsSchema = z.array(
  z.string().max(500, "Term is too long").trim(),
);

export const loyaltyBrandingSchema = z
  .object({
    logo: z.string().max(2048).optional().nullable(),
    themeColor: z.string().max(7).optional().nullable(),
    textColor: z.string().max(7).optional().nullable(),
    bannerImage: z.string().max(2048).optional().nullable(),
    header: z.string().max(200).optional().nullable(),
    subtitle: z.string().max(500).optional().nullable(),
  })
  .optional()
  .nullable();

export const loyaltySettingsSchema = z.object({
  earningPercentage: z.coerce.number().min(0).max(100),
  earnPointsOnPaidAmountOnly: z.boolean().optional(),
  cashbackInFinalAmount: z.boolean().optional(),
  cashbackBranding: z.string().max(50).optional().nullable(),
  minPurchaseForEarning: z.coerce.number().min(0).optional(),
  minPurchaseForRedemption: z.coerce.number().min(0).optional(),
  upperLimitBillAmount: z.coerce.number().min(0).optional().nullable(),
  upperLimitClaimableAmount: z.coerce.number().min(0).optional().nullable(),
  termsAndConditions: loyaltyTermsSchema.optional(),
  pointReminderDays: z.coerce.number().int().min(0).optional().nullable(),
  pointExpiryDays: z.coerce.number().int().min(1).optional().nullable(),
  whatsappEnabled: z.boolean().optional(),
  emailEnabled: z.boolean().optional(),
  smsEnabled: z.boolean().optional(),
  branding: loyaltyBrandingSchema,
});

export const loyaltyPreviewSchema = z.object({
  phone: z.string().min(4),
  businessId: z.string().uuid(),
  billAmount: z.coerce.number().min(0),
});

export const loyaltyStatsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).optional(),
  perPage: z.coerce.number().int().min(1).max(100).default(10).optional(),
  sort: z.string().max(100).optional(),
  type: z
    .enum(["EARNED", "REDEEMED", "REFUNDED", "GIFTED", "ADJUSTMENT", "EXPIRED"])
    .optional(),
  source: z.string().max(50).trim().optional(),
  customerName: z.string().max(255).trim().optional(),
  billNumber: z.string().max(255).trim().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
});

export type LoyaltySettingsInput = z.infer<typeof loyaltySettingsSchema>;
export type LoyaltyPreviewInput = z.infer<typeof loyaltyPreviewSchema>;
export type LoyaltyStatsQueryInput = z.infer<typeof loyaltyStatsQuerySchema>;
