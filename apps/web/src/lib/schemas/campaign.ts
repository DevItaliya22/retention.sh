import { z } from "zod";

export const CAMPAIGN_REWARD_TYPES = [
  "FREE_ITEM",
  "PERCENTAGE_DISCOUNT",
  "CASH_DISCOUNT",
  "NO_REWARD",
] as const;

export const CAMPAIGN_STATUSES = ["DRAFT", "ACTIVE", "EXPIRED"] as const;

export const CAMPAIGN_APPLIES_TO = [
  "ENTIRE_PURCHASE",
  "SPECIFIC_ITEMS",
] as const;

export const CAMPAIGN_REDEMPTION_LIMITS = ["ONCE", "MULTIPLE"] as const;

export const campaignRewardTypeSchema = z.enum(CAMPAIGN_REWARD_TYPES);
export type CampaignRewardType = z.infer<typeof campaignRewardTypeSchema>;

export const campaignStatusSchema = z.enum(CAMPAIGN_STATUSES);
export type CampaignStatus = z.infer<typeof campaignStatusSchema>;

export const campaignAppliesToSchema = z.enum(CAMPAIGN_APPLIES_TO);
export type CampaignAppliesTo = z.infer<typeof campaignAppliesToSchema>;

export const campaignRedemptionLimitSchema = z.enum(CAMPAIGN_REDEMPTION_LIMITS);
export type CampaignRedemptionLimit = z.infer<
  typeof campaignRedemptionLimitSchema
>;

/** Query params for listing campaigns */
export const campaignsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).optional(),
  perPage: z.coerce.number().int().min(1).max(100).default(10).optional(),
  sort: z.string().max(100, "Sort parameter is too long").optional(),
  title: z.string().max(500, "Title filter is too long").trim().optional(),
  status: campaignStatusSchema.optional(),
  rewardType: campaignRewardTypeSchema.optional(),
  appliesTo: campaignAppliesToSchema.optional(),
  redemptionLimit: campaignRedemptionLimitSchema.optional(),
});

export type CampaignsQueryInput = z.infer<typeof campaignsQuerySchema>;

/** Body for updating a campaign – all editable fields from Prisma Campaign model */
export const campaignUpdateSchema = z.object({
  title: z.string().max(500).trim().optional().nullable(),
  description: z.string().max(2000).trim().optional().nullable(),
  contactNumber: z.string().max(20).trim().optional().nullable(),
  startsAt: z.string().optional(),
  expiresAt: z.string().optional(),
  segmentIds: z.array(z.string().uuid()).optional(),
  status: campaignStatusSchema.optional(),
  emailSubject: z.string().max(500).trim().optional().nullable(),

  // Branding
  themeColor: z.string().max(30).trim().optional().nullable(),
  textColor: z.string().max(30).trim().optional().nullable(),
  logo: z.string().max(2048).trim().optional().nullable(),
  bannerImage: z.string().max(2048).trim().optional().nullable(),

  // Reward
  rewardType: campaignRewardTypeSchema.optional(),
  rewardValue: z.string().max(200).trim().optional().nullable(),
  offerStatement: z.string().max(2000).trim().optional().nullable(),
  appliesTo: campaignAppliesToSchema.optional(),
  maxRedemptionAmount: z.number().min(0).optional().nullable(),
  maxRedemptionEnabled: z.boolean().optional(),

  // Min purchase requirements
  minPurchaseForEarningEnabled: z.boolean().optional(),
  minPurchaseForEarning: z.number().min(0).optional().nullable(),
  minPurchaseForRedemptionEnabled: z.boolean().optional(),
  minPurchaseForRedemption: z.number().min(0).optional().nullable(),

  // Instant cashback
  instantCashbackRedeemable: z.boolean().optional(),

  // Terms
  redemptionLimit: campaignRedemptionLimitSchema.optional(),
  termsAndConditions: z.array(z.string().max(500)).optional(),

  whatsappEnabled: z.boolean().optional(),
  emailEnabled: z.boolean().optional(),
});
export type CampaignUpdateInput = z.infer<typeof campaignUpdateSchema>;
