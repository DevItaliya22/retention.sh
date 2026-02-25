import { z } from "zod";

export const PARTNER_REQUEST_STATUSES = [
  "PENDING",
  "ACCEPTED",
  "REJECTED",
  "PERMANENTLY_REJECTED",
] as const;

export const partnerRequestStatusSchema = z.enum(PARTNER_REQUEST_STATUSES);
export type PartnerRequestStatus = z.infer<typeof partnerRequestStatusSchema>;

export const PARTNERSHIP_STATUSES = ["ACTIVE", "DISSOLVED"] as const;

export const partnershipStatusSchema = z.enum(PARTNERSHIP_STATUSES);
export type PartnershipStatusType = z.infer<typeof partnershipStatusSchema>;

export const sendPartnerRequestSchema = z.object({
  targetBusinessSlug: z
    .string()
    .min(1, "Business slug is required")
    .max(255)
    .trim(),
});
export type SendPartnerRequestInput = z.infer<typeof sendPartnerRequestSchema>;

export const respondPartnerRequestSchema = z.object({
  action: z.enum(["accept", "reject", "permanently_reject"]),
});
export type RespondPartnerRequestInput = z.infer<
  typeof respondPartnerRequestSchema
>;

export const updatePartnershipSettingsSchema = z.object({
  receivePartnershipOffers: z.boolean().optional(),
  maxPartnerAllowed: z.coerce.number().int().min(1).max(100).optional(),
});
export type UpdatePartnershipSettingsInput = z.infer<
  typeof updatePartnershipSettingsSchema
>;

export const updatePartnershipSchema = z.object({
  exchangeRate: z.number().min(0.01).max(1000).optional(),
  pointToCurrencyRate: z.number().min(0.001).max(1000).optional(),
  sharedReferrals: z.boolean().optional(),
  shareReferralRewards: z.boolean().optional(),
  sharedCampaigns: z.boolean().optional(),
});
export type UpdatePartnershipInput = z.infer<typeof updatePartnershipSchema>;

export const partnerCampaignCreateSchema = z.object({
  partnershipId: z.string().uuid("Invalid partnership ID"),
});
export type PartnerCampaignCreateInput = z.infer<
  typeof partnerCampaignCreateSchema
>;

export const partnerCampaignUpdateSchema = z.object({
  title: z.string().max(500).trim().optional().nullable(),
  description: z.string().max(2000).trim().optional().nullable(),
  contactNumber: z.string().max(20).trim().optional().nullable(),
  expiresAt: z.string().optional(),
  status: z.enum(["DRAFT", "SCHEDULED", "SENT", "FAILED"]).optional(),

  themeColor: z.string().max(30).trim().optional().nullable(),
  textColor: z.string().max(30).trim().optional().nullable(),
  logo: z.string().max(2048).trim().optional().nullable(),
  bannerImage: z.string().max(2048).trim().optional().nullable(),

  rewardType: z
    .enum(["FREE_ITEM", "PERCENTAGE_DISCOUNT", "CASH_DISCOUNT", "NO_REWARD"])
    .optional(),
  rewardValue: z.string().max(200).trim().optional().nullable(),
  appliesTo: z.enum(["ENTIRE_PURCHASE", "SPECIFIC_ITEMS"]).optional(),
  maxRedemptionAmount: z.number().min(0).optional().nullable(),
  maxRedemptionEnabled: z.boolean().optional(),

  minPurchaseForEarningEnabled: z.boolean().optional(),
  minPurchaseForEarning: z.number().min(0).optional().nullable(),
  minPurchaseForRedemptionEnabled: z.boolean().optional(),
  minPurchaseForRedemption: z.number().min(0).optional().nullable(),

  instantCashbackRedeemable: z.boolean().optional(),
  redemptionLimit: z.enum(["ONCE", "MULTIPLE"]).optional(),
  termsAndConditions: z.array(z.string().max(500)).optional(),
});
export type PartnerCampaignUpdateInput = z.infer<
  typeof partnerCampaignUpdateSchema
>;
