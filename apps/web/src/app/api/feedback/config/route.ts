import { withAdminAuth } from "@/lib/auth/middleware";
import { FEEDBACK_FORM_DEFAULTS } from "@/lib/constants/forms/feedback";
import { feedbackConfigUpdateSchema } from "@/lib/schemas/feedback";
import {
  sanitizeErrorMessage,
  validateSchema,
} from "@/lib/utils/error-handler";
import { db } from "@reelo/db";
import { NextRequest, NextResponse } from "next/server";

export const GET = withAdminAuth(async (_request, context) => {
  try {
    const businessId = context.business.id;
    const config = await db.feedbackConfig.findUnique({
      where: { businessId },
      include: {
        questions: { orderBy: { createdAt: "asc" } },
        categories: { orderBy: { createdAt: "asc" } },
        howDidYouHearOptions: { orderBy: { createdAt: "asc" } },
        selectionOptions: { orderBy: { seq: "asc" } },
        branding: true,
      },
    });
    return NextResponse.json({ config });
  } catch (error: unknown) {
    console.error("Failed to fetch feedback config:", error);
    return NextResponse.json(
      {
        config: null,
        error: sanitizeErrorMessage(error) || "Failed to fetch feedback config",
      },
      { status: 500 },
    );
  }
});

export const PUT = withAdminAuth(async (request: NextRequest, context) => {
  try {
    const body = await request.json();
    const validation = validateSchema(feedbackConfigUpdateSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { config: null, error: validation.error },
        { status: 400 },
      );
    }
    const data = validation.data;
    const businessId = context.business.id;

    const existing = await db.feedbackConfig.findUnique({
      where: { businessId },
    });

    // Handle branding upsert if provided
    let brandingId: string | null | undefined = undefined;
    if (data.branding !== undefined) {
      if (data.branding === null) {
        brandingId = null;
      } else {
        const branding = await db.branding.upsert({
          where: { businessId },
          create: {
            businessId,
            logo: data.branding.logo ?? null,
            themeColor: data.branding.themeColor ?? null,
            textColor: data.branding.textColor ?? null,
            bannerImage: data.branding.bannerImage ?? null,
            header: data.branding.header ?? null,
            subtitle: data.branding.subtitle ?? null,
          },
          update: {
            logo: data.branding.logo ?? null,
            themeColor: data.branding.themeColor ?? null,
            textColor: data.branding.textColor ?? null,
            bannerImage: data.branding.bannerImage ?? null,
            header: data.branding.header ?? null,
            subtitle: data.branding.subtitle ?? null,
          },
        });
        brandingId = branding.id;
      }
    }

    const updatePayload = {
      ...(data.positiveFollowUp !== undefined && {
        positiveFollowUp: data.positiveFollowUp ?? null,
      }),
      ...(data.negativeFollowUp !== undefined && {
        negativeFollowUp: data.negativeFollowUp ?? null,
      }),
      ...(data.timing !== undefined && { timing: data.timing }),
      ...(data.delaySeconds !== undefined && {
        delaySeconds: data.delaySeconds ?? null,
      }),
      ...(data.collectionChannel !== undefined && {
        collectionChannel: data.collectionChannel,
      }),
      ...(data.sendViaSmsIfWpFailed !== undefined && {
        sendViaSmsIfWpFailed: data.sendViaSmsIfWpFailed,
      }),
      ...(data.feedbackRewardEnabled !== undefined && {
        feedbackRewardEnabled: data.feedbackRewardEnabled,
      }),
      ...(data.rewardAmount !== undefined && {
        rewardAmount: data.rewardAmount ?? null,
      }),
      ...(data.isHowDidYouHearEnabled !== undefined && {
        isHowDidYouHearEnabled: data.isHowDidYouHearEnabled,
      }),
      ...(data.negAlertChannelsWp !== undefined && {
        negAlertChannelsWp: data.negAlertChannelsWp,
      }),
      ...(data.negAlertChannelsSms !== undefined && {
        negAlertChannelsSms: data.negAlertChannelsSms,
      }),
      ...(data.negAlertChannelsEmail !== undefined && {
        negAlertChannelsEmail: data.negAlertChannelsEmail,
      }),
      ...(data.negFeedbackAlertNumber !== undefined && {
        negFeedbackAlertNumber: data.negFeedbackAlertNumber ?? null,
      }),
      ...(data.negFeedbackAlertSmsNumber !== undefined && {
        negFeedbackAlertSmsNumber: data.negFeedbackAlertSmsNumber ?? null,
      }),
      ...(data.negFeedbackAlertEmailAddress !== undefined && {
        negFeedbackAlertEmailAddress: data.negFeedbackAlertEmailAddress ?? null,
      }),
      ...(data.askForOnlineReviews !== undefined && {
        askForOnlineReviews: data.askForOnlineReviews,
      }),
      ...(data.onlineReviewLink !== undefined && {
        onlineReviewLink: data.onlineReviewLink ?? null,
      }),
      ...(data.onlineReviewPlatform !== undefined && {
        onlineReviewPlatform: data.onlineReviewPlatform ?? null,
      }),
      ...(brandingId !== undefined && { brandingId }),
    };

    const defaultFollowUp = FEEDBACK_FORM_DEFAULTS.followUpMessage;

    const config = existing
      ? await db.feedbackConfig.update({
          where: { businessId },
          data: updatePayload,
          include: {
            questions: { orderBy: { createdAt: "asc" } },
            categories: { orderBy: { createdAt: "asc" } },
            howDidYouHearOptions: { orderBy: { createdAt: "asc" } },
            selectionOptions: { orderBy: { seq: "asc" } },
            branding: true,
          },
        })
      : await db.feedbackConfig.create({
          data: {
            businessId,
            ...updatePayload,
            positiveFollowUp:
              (updatePayload.positiveFollowUp?.trim()?.length
                ? updatePayload.positiveFollowUp
                : null) ?? defaultFollowUp,
            negativeFollowUp:
              (updatePayload.negativeFollowUp?.trim()?.length
                ? updatePayload.negativeFollowUp
                : null) ?? defaultFollowUp,
          },
          include: {
            questions: { orderBy: { createdAt: "asc" } },
            categories: { orderBy: { createdAt: "asc" } },
            howDidYouHearOptions: { orderBy: { createdAt: "asc" } },
            selectionOptions: { orderBy: { seq: "asc" } },
            branding: true,
          },
        });

    return NextResponse.json({ config });
  } catch (error: unknown) {
    console.error("Failed to update feedback config:", error);
    return NextResponse.json(
      {
        config: null,
        error:
          sanitizeErrorMessage(error) || "Failed to update feedback config",
      },
      { status: 500 },
    );
  }
});
