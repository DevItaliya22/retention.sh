import { z } from "zod";
import {
  informationSectionSchema,
  referralBenefitTypeSchema,
  referralBrandingSchema,
} from "./referral";

export const referralProgramStep1Schema = z
  .object({
    newCustomerBenefitType: referralBenefitTypeSchema,
    newCustomerBenefitValue: z.coerce.number().int().min(0).optional(),
    newCustomerBenefitExpiresInDays: z.coerce
      .number()
      .int()
      .min(1)
      .optional()
      .nullable(),
    newCustomerFreeItemSkuId: z.string().uuid().optional().nullable(),
    informationSections: z
      .array(informationSectionSchema)
      .min(0)
      .optional()
      .default([]),
    sendReminderToCustomer: z.boolean().default(false),
    reminderDelayDays: z.coerce.number().int().min(1).optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.newCustomerBenefitType === "AMOUNT_CASHBACK") {
      if (
        data.newCustomerBenefitValue == null ||
        data.newCustomerBenefitValue < 0
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Cashback amount is required",
          path: ["newCustomerBenefitValue"],
        });
      }
    }
    if (data.newCustomerBenefitType === "FREE_ITEM_ON_NEXT_PURCHASE") {
      if (!data.newCustomerFreeItemSkuId?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please select a free item",
          path: ["newCustomerFreeItemSkuId"],
        });
      }
    }
    if (data.sendReminderToCustomer && !data.reminderDelayDays) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Reminder days are required when reminders are enabled",
        path: ["reminderDelayDays"],
      });
    }
  });

export const referralProgramStep2Schema = z
  .object({
    existingCustomerBenefitType: referralBenefitTypeSchema,
    existingCustomerBenefitValue: z.coerce.number().int().min(0).optional(),
    existingCustomerBenefitExpiresInDays: z.coerce
      .number()
      .int()
      .min(1)
      .optional()
      .nullable(),
    existingCustomerFreeItemSkuId: z.string().uuid().optional().nullable(),
    lockReferralPointsUntilFirstPurchase: z.boolean().optional().default(true),
    whatsappEnabled: z.boolean().optional().default(true),
    emailEnabled: z.boolean().optional().default(false),
    smsEnabled: z.boolean().optional().default(false),
  })
  .superRefine((data, ctx) => {
    if (data.existingCustomerBenefitType === "AMOUNT_CASHBACK") {
      if (
        data.existingCustomerBenefitValue == null ||
        data.existingCustomerBenefitValue < 0
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Cashback amount is required",
          path: ["existingCustomerBenefitValue"],
        });
      }
    }
    if (data.existingCustomerBenefitType === "FREE_ITEM_ON_NEXT_PURCHASE") {
      if (!data.existingCustomerFreeItemSkuId?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please select a free item",
          path: ["existingCustomerFreeItemSkuId"],
        });
      }
    }
  });

export const referralProgramStep3Schema = z.object({
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

export const referralProgramStep4Schema = z.object({
  branding: referralBrandingSchema,
});

export const referralProgramFormSchema = z.object({
  ...referralProgramStep1Schema.shape,
  ...referralProgramStep2Schema.shape,
  ...referralProgramStep3Schema.shape,
  ...referralProgramStep4Schema.shape,
});

export type ReferralProgramFormValues = z.infer<
  typeof referralProgramFormSchema
>;
