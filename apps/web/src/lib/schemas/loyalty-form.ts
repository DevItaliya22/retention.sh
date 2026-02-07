import { z } from "zod";
import { loyaltyBrandingSchema, loyaltyTermsSchema } from "./loyalty";

export const loyaltyProgramStep1Schema = z.object({
  earningPercentage: z.coerce.number().min(0).max(100),
  earnPointsOnPaidAmountOnly: z.boolean().optional(),
  cashbackInFinalAmount: z.boolean().optional(),
  cashbackBranding: z.string().max(50).optional().nullable(),
  minPurchaseForEarning: z.coerce.number().min(0).optional(),
  minPurchaseForRedemption: z.coerce.number().min(0).optional(),
});

export const loyaltyProgramStep2Schema = z.object({
  upperLimitBillAmount: z.coerce.number().min(0).optional().nullable(),
  upperLimitClaimableAmount: z.coerce.number().min(0).optional().nullable(),
  pointReminderDays: z.coerce.number().int().min(0).optional().nullable(),
  pointExpiryDays: z.coerce.number().int().min(1).optional().nullable(),
});

export const loyaltyProgramStep3Schema = z.object({
  whatsappEnabled: z.boolean().optional(),
  emailEnabled: z.boolean().optional(),
  smsEnabled: z.boolean().optional(),
  termsAndConditions: loyaltyTermsSchema.optional(),
});

export const loyaltyProgramStep4Schema = z.object({
  branding: loyaltyBrandingSchema,
});

export const loyaltyProgramFormSchema = z.object({
  ...loyaltyProgramStep1Schema.shape,
  ...loyaltyProgramStep2Schema.shape,
  ...loyaltyProgramStep3Schema.shape,
  ...loyaltyProgramStep4Schema.shape,
});

export type LoyaltyProgramFormValues = z.infer<typeof loyaltyProgramFormSchema>;
