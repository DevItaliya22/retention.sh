import { z } from "zod";
import {
  nameSchema,
  storagePathOrUrlSchema,
  textSchema,
  themeColorSchema,
} from "./common";

// Information section schema
export const informationSectionSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title is too long"),
  content: z
    .string()
    .min(1, "Content is required")
    .max(1000, "Content is too long"),
});

// Referral benefit type enum: AMOUNT_CASHBACK = cashback in ₹, FREE_ITEM_ON_NEXT_PURCHASE = free item on next visit
export const referralBenefitTypeSchema = z.enum([
  "AMOUNT_CASHBACK",
  "FREE_ITEM_ON_NEXT_PURCHASE",
]);

export const REFERRAL_BENEFIT_TYPES = {
  AMOUNT_CASHBACK: "Amount Cashback",
  FREE_ITEM_ON_NEXT_PURCHASE: "Free Item on Next Purchase",
} as const;

// Branding schema for referral program
export const referralBrandingSchema = z
  .object({
    logo: storagePathOrUrlSchema,
    themeColor: themeColorSchema,
    textColor: themeColorSchema,
    bannerImage: storagePathOrUrlSchema,
    header: textSchema(200),
    subtitle: textSchema(500),
  })
  .optional()
  .nullable();

// Terms: point-wise, array of strings (API input); stored as TermsAndConditions relation
export const termsAndConditionsArraySchema = z
  .array(z.string().min(1, "Point is required").max(500, "Point is too long"))
  .min(0)
  .optional()
  .nullable();

// Base referral program schema (no refinements — .partial() requires this)
const referralProgramBaseSchema = z.object({
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
  whatsappEnabled: z.boolean().optional().default(true),
  emailEnabled: z.boolean().optional().default(false),
  smsEnabled: z.boolean().optional().default(false),
  lockReferralPointsUntilFirstPurchase: z.boolean().optional().default(false),

  existingCustomerBenefitType: referralBenefitTypeSchema,
  existingCustomerBenefitValue: z.coerce.number().int().min(0).optional(),
  existingCustomerBenefitExpiresInDays: z.coerce
    .number()
    .int()
    .min(1)
    .optional()
    .nullable(),
  existingCustomerFreeItemSkuId: z.string().uuid().optional().nullable(),
  termsAndConditionsNewCustomer: termsAndConditionsArraySchema,
  termsAndConditionsExistingCustomer: termsAndConditionsArraySchema,

  branding: referralBrandingSchema,
});

// Create schema with refinements for full validation
export const createReferralProgramSchema =
  referralProgramBaseSchema.superRefine((data, ctx) => {
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
    if (data.newCustomerBenefitType === "FREE_ITEM_ON_NEXT_PURCHASE") {
      if (!data.newCustomerFreeItemSkuId?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please select a free item",
          path: ["newCustomerFreeItemSkuId"],
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
    if (data.sendReminderToCustomer && !data.reminderDelayDays) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Reminder days are required when reminders are enabled",
        path: ["reminderDelayDays"],
      });
    }
  });

export type CreateReferralProgramInput = z.infer<
  typeof createReferralProgramSchema
>;

export const termsItemInputSchema = z.object({
  id: z.string().uuid().optional(),
  content: z
    .string()
    .trim()
    .min(1, "Point is required")
    .max(500, "Point is too long"),
});
export type TermsItemInput = z.infer<typeof termsItemInputSchema>;

export const updateReferralProgramSchema = referralProgramBaseSchema
  .partial()
  .extend({
    termsAndConditionsNewCustomer: z
      .array(termsItemInputSchema)
      .min(0)
      .optional()
      .nullable(),
    termsAndConditionsExistingCustomer: z
      .array(termsItemInputSchema)
      .min(0)
      .optional()
      .nullable(),
  });

export type UpdateReferralProgramInput = z.infer<
  typeof updateReferralProgramSchema
>;

// Claim referral schema (referralSlug is UUID from BusinessCustomer.referralSlug)
export const claimReferralSchema = z.object({
  referralSlug: z.string().uuid("Invalid referral link"),
  phoneNumber: z
    .string()
    .min(1, "Phone number is required")
    .max(20, "Phone number is too long")
    .trim(),
  name: nameSchema,
});

export type ClaimReferralInput = z.infer<typeof claimReferralSchema>;

export const referralQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).optional(),
  perPage: z.coerce.number().int().min(1).max(100).default(10).optional(),
  sort: z.string().max(100).optional(),
  referrerSlugId: z.string().min(1).optional(),
});

export type ReferralQueryInput = z.infer<typeof referralQuerySchema>;

// Referral stats (who referred, how many)
export const referralStatsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).optional(),
  perPage: z.coerce.number().int().min(1).max(100).default(10).optional(),
  sort: z.string().max(100).optional(),
});

export type ReferralStatsQueryInput = z.infer<typeof referralStatsQuerySchema>;
