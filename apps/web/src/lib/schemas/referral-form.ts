import { z } from "zod";
import {
  informationSectionSchema,
  referralBenefitTypeSchema,
  referralBrandingSchema,
} from "./referral";

export const referralProgramStep1Schema = z.object({
  newCustomerBenefitType: referralBenefitTypeSchema,
  newCustomerBenefitValue: z.coerce
    .number()
    .int()
    .min(0, "Value must be positive"),
  newCustomerBenefitExpiresInDays: z.coerce
    .number()
    .int()
    .min(1)
    .optional()
    .nullable(),
  informationSections: z
    .array(informationSectionSchema)
    .min(0)
    .optional()
    .default([]),
  sendReminderToCustomer: z.boolean().default(false),
});

export const referralProgramStep2Schema = z.object({
  existingCustomerBenefitType: referralBenefitTypeSchema,
  existingCustomerBenefitValue: z.coerce
    .number()
    .int()
    .min(0, "Value must be positive"),
  existingCustomerBenefitExpiresInDays: z.coerce
    .number()
    .int()
    .min(1)
    .optional()
    .nullable(),
  termsAndConditionsNewCustomer: z
    .array(z.string().min(1).max(500))
    .min(0)
    .optional()
    .nullable(),
  termsAndConditionsExistingCustomer: z
    .array(z.string().min(1).max(500))
    .min(0)
    .optional()
    .nullable(),
});

export const referralProgramStep3Schema = z.object({
  branding: referralBrandingSchema,
});

export const referralProgramFormSchema = z.object({
  ...referralProgramStep1Schema.shape,
  ...referralProgramStep2Schema.shape,
  ...referralProgramStep3Schema.shape,
});

export type ReferralProgramFormValues = z.infer<
  typeof referralProgramFormSchema
>;
