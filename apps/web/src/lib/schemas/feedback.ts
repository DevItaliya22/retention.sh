import { z } from "zod";

const feedbackTimingSchema = z.enum(["IMMEDIATELY", "AFTER_DELAY"]);
const feedbackCollectionChannelSchema = z.enum([
  "WHATSAPP",
  "SMS",
  "EMAIL",
  "CASHIER_PORTAL",
]);
const onlineReviewPlatformSchema = z.enum([
  "GOOGLE",
  "INSTAGRAM",
  "FACEBOOK",
  "ZOMATO",
  "OTHER",
]);

const brandingUpdateSchema = z
  .object({
    logo: z.string().max(500).optional().nullable(),
    themeColor: z.string().max(50).optional().nullable(),
    textColor: z.string().max(50).optional().nullable(),
    bannerImage: z.string().max(500).optional().nullable(),
    header: z.string().max(120).optional().nullable(),
    subtitle: z.string().max(200).optional().nullable(),
  })
  .optional()
  .nullable();

export const feedbackConfigUpdateSchema = z
  .object({
    positiveFollowUp: z.string().max(500).optional().nullable(),
    negativeFollowUp: z.string().max(500).optional().nullable(),
    timing: feedbackTimingSchema.optional(),
    delaySeconds: z.coerce
      .number()
      .int()
      .min(0)
      .max(86400)
      .optional()
      .nullable(),
    collectionChannel: feedbackCollectionChannelSchema.optional(),
    sendViaSmsIfWpFailed: z.boolean().optional(),
    feedbackRewardEnabled: z.boolean().optional(),
    rewardAmount: z.coerce.number().min(0).optional().nullable(),
    isHowDidYouHearEnabled: z.boolean().optional(),
    negAlertChannelsWp: z.boolean().optional(),
    negAlertChannelsSms: z.boolean().optional(),
    negAlertChannelsEmail: z.boolean().optional(),
    negFeedbackAlertNumber: z.string().max(50).optional().nullable(),
    negFeedbackAlertSmsNumber: z.string().max(50).optional().nullable(),
    negFeedbackAlertEmailAddress: z.string().max(254).optional().nullable(),
    askForOnlineReviews: z.boolean().optional(),
    onlineReviewLink: z.string().max(500).optional().nullable(),
    onlineReviewPlatform: onlineReviewPlatformSchema.optional().nullable(),
    branding: brandingUpdateSchema,
  })
  .refine(
    (data) => {
      if (data.askForOnlineReviews !== true) return true;
      const hasLink =
        data.onlineReviewLink != null &&
        String(data.onlineReviewLink).trim().length > 0;
      const hasPlatform = data.onlineReviewPlatform != null;
      return hasLink && hasPlatform;
    },
    {
      message:
        "When “Show review prompt after feedback” is on, Platform and Review link are required.",
      path: ["onlineReviewLink"],
    },
  );

export const feedbackStatsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).optional(),
  perPage: z.coerce.number().int().min(1).max(100).default(10).optional(),
  sort: z.string().max(100).optional(),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

/** Public feedback form submit (by customer from feedback link) */
export const feedbackSubmitSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5).optional().nullable(),
  comment: z.string().max(2000).optional().nullable(),
  howDidYouHear: z.string().max(255).optional().nullable(),
  selectedCategories: z.array(z.string().max(255)).optional().default([]),
  selectedSelectionOptionIds: z.array(z.string().uuid()).optional().default([]),
});

const uuidSchema = z.string().uuid();

export const feedbackSelectionOptionCreateSchema = z.object({
  label: z.string().min(1).max(255).trim(),
  seq: z.coerce.number().int().min(0).optional(),
});

export const feedbackSelectionOptionUpdateSchema = z.object({
  label: z.string().min(1).max(255).trim().optional(),
  seq: z.coerce.number().int().min(0).optional(),
});

export const feedbackSelectionOptionReorderSchema = z.object({
  orderedIds: z.array(uuidSchema).min(0),
});

export type FeedbackConfigUpdateInput = z.infer<
  typeof feedbackConfigUpdateSchema
>;
export type FeedbackStatsQueryInput = z.infer<typeof feedbackStatsQuerySchema>;
export type FeedbackSubmitInput = z.infer<typeof feedbackSubmitSchema>;
export type FeedbackSelectionOptionCreateInput = z.infer<
  typeof feedbackSelectionOptionCreateSchema
>;
export type FeedbackSelectionOptionUpdateInput = z.infer<
  typeof feedbackSelectionOptionUpdateSchema
>;
export type FeedbackSelectionOptionReorderInput = z.infer<
  typeof feedbackSelectionOptionReorderSchema
>;
