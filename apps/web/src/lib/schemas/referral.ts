import { z } from "zod";
import { nameSchema, textSchema, themeColorSchema, urlSchema } from "./common";

// Information section schema
export const informationSectionSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title is too long"),
  content: z
    .string()
    .min(1, "Content is required")
    .max(1000, "Content is too long"),
});

// Referral benefit type enum
export const referralBenefitTypeSchema = z.enum([
  "CASH_DISCOUNT",
  "PERCENTAGE_DISCOUNT",
  "FREE_ITEM",
  "LOYALTY_BONUS",
]);

// Branding schema for referral program
export const referralBrandingSchema = z
  .object({
    logo: urlSchema,
    themeColor: themeColorSchema,
    textColor: themeColorSchema,
    bannerImage: urlSchema,
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

// Create/Update referral program schema
export const createReferralProgramSchema = z.object({
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
  informationSections: z.array(informationSectionSchema).min(0),
  sendReminderToCustomer: z.boolean().default(false),

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
  termsAndConditionsNewCustomer: termsAndConditionsArraySchema,
  termsAndConditionsExistingCustomer: termsAndConditionsArraySchema,

  branding: referralBrandingSchema,
});

export type CreateReferralProgramInput = z.infer<
  typeof createReferralProgramSchema
>;

export const updateReferralProgramSchema =
  createReferralProgramSchema.partial();

export type UpdateReferralProgramInput = z.infer<
  typeof updateReferralProgramSchema
>;

// Claim referral schema
export const claimReferralSchema = z.object({
  referralSlug: z.string().min(1, "Referral slug is required"),
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
