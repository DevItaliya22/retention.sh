import { feedbackSubmitSchema } from "@/lib/schemas/feedback";
import {
  sanitizeErrorMessage,
  validateSchema,
} from "@/lib/utils/error-handler";
import { db } from "@reelo/db";
import { NextRequest, NextResponse } from "next/server";

/**
 * Public GET: fetch feedback link and config by token + businessSlug.
 * No auth. Used by the public feedback page to render the form.
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ businessSlug: string; token: string }> },
) {
  try {
    const { businessSlug, token } = await context.params;
    if (!token || !businessSlug) {
      return NextResponse.json(
        { error: "Invalid link", config: null, billNumber: null },
        { status: 400 },
      );
    }

    const link = await db.feedbackLink.findUnique({
      where: { token },
      include: {
        bill: {
          select: {
            billNumber: true,
            businessId: true,
            customerId: true,
            businessCustomer: {
              include: {
                business: { select: { slug: true } },
              },
            },
          },
        },
        feedbackResponse: {
          select: { rating: true },
        },
        config: {
          include: {
            questions: { orderBy: { createdAt: "asc" } },
            categories: { orderBy: { createdAt: "asc" } },
            howDidYouHearOptions: { orderBy: { createdAt: "asc" } },
            branding: true,
          },
        },
      },
    });

    if (!link || !link.bill) {
      return NextResponse.json(
        { error: "Feedback link not found", config: null, billNumber: null },
        { status: 404 },
      );
    }

    const slug = link.bill.businessCustomer?.business?.slug;
    if (slug !== businessSlug) {
      return NextResponse.json(
        { error: "Invalid link", config: null, billNumber: null },
        { status: 404 },
      );
    }

    // One feedback per bill: already submitted → return thank you + reward only
    if (link.feedbackResponse) {
      type FollowUpReward = {
        positiveFollowUp: string | null;
        negativeFollowUp: string | null;
        feedbackRewardEnabled: boolean;
        rewardAmount: number | null;
      } | null;
      let followUpRewardConfig: FollowUpReward = link.config
        ? {
            positiveFollowUp: link.config.positiveFollowUp,
            negativeFollowUp: link.config.negativeFollowUp,
            feedbackRewardEnabled: link.config.feedbackRewardEnabled,
            rewardAmount: link.config.rewardAmount,
          }
        : null;
      if (!followUpRewardConfig && link.bill.businessId) {
        followUpRewardConfig = await db.feedbackConfig.findUnique({
          where: { businessId: link.bill.businessId },
          select: {
            positiveFollowUp: true,
            negativeFollowUp: true,
            feedbackRewardEnabled: true,
            rewardAmount: true,
          },
        });
      }
      const rating = link.feedbackResponse.rating;
      const isPositive = rating != null && rating >= 4;
      const followUpMessage = followUpRewardConfig
        ? ((isPositive
            ? followUpRewardConfig.positiveFollowUp
            : followUpRewardConfig.negativeFollowUp) ??
          "Thank you for your feedback.")
        : "Thank you for your feedback.";
      const reward =
        followUpRewardConfig?.feedbackRewardEnabled &&
        followUpRewardConfig.rewardAmount != null
          ? { enabled: true, amount: followUpRewardConfig.rewardAmount }
          : { enabled: false, amount: null as number | null };
      return NextResponse.json({
        alreadySubmitted: true,
        config: null,
        billNumber: link.bill.billNumber,
        followUpMessage: followUpMessage || "Thank you for your feedback.",
        reward,
      });
    }

    // Use link's config if set; otherwise load business's config (e.g. link created before config existed)
    let configToUse = link.config;
    if (!configToUse && link.bill.businessId) {
      configToUse = await db.feedbackConfig.findUnique({
        where: { businessId: link.bill.businessId },
        include: {
          questions: { orderBy: { createdAt: "asc" } },
          categories: { orderBy: { createdAt: "asc" } },
          howDidYouHearOptions: { orderBy: { createdAt: "asc" } },
          branding: true,
        },
      });
    }

    const config = configToUse
      ? {
          id: configToUse.id,
          positiveFollowUp: configToUse.positiveFollowUp,
          negativeFollowUp: configToUse.negativeFollowUp,
          questions: configToUse.questions.map((q) => ({
            id: q.id,
            question: q.question,
            iconType: q.iconType,
          })),
          categories: configToUse.categories.map((c) => ({
            id: c.id,
            name: c.name,
          })),
          isHowDidYouHearEnabled: configToUse.isHowDidYouHearEnabled,
          howDidYouHearOptions: configToUse.howDidYouHearOptions.map((o) => ({
            id: o.id,
            name: o.name,
          })),
          askForOnlineReviews: configToUse.askForOnlineReviews,
          onlineReviewLink: configToUse.onlineReviewLink,
          onlineReviewPlatform: configToUse.onlineReviewPlatform,
          branding: configToUse.branding,
        }
      : null;

    return NextResponse.json({
      alreadySubmitted: false,
      config,
      billNumber: link.bill.billNumber,
    });
  } catch (error: unknown) {
    console.error("Failed to fetch feedback link:", error);
    return NextResponse.json(
      {
        error: sanitizeErrorMessage(error) || "Failed to load feedback",
        config: null,
        billNumber: null,
      },
      { status: 500 },
    );
  }
}

/**
 * Public POST: submit feedback for this link.
 * No auth. Creates FeedbackResponse linked to the bill's customer + config.
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ businessSlug: string; token: string }> },
) {
  try {
    const { businessSlug, token } = await context.params;
    if (!token || !businessSlug) {
      return NextResponse.json(
        { error: "Invalid link", success: false },
        { status: 400 },
      );
    }

    const body = await request.json();
    const validation = validateSchema(feedbackSubmitSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error, success: false },
        { status: 400 },
      );
    }

    const link = await db.feedbackLink.findUnique({
      where: { token },
      include: {
        bill: {
          select: {
            businessId: true,
            customerId: true,
            businessCustomer: {
              include: {
                business: { select: { slug: true } },
              },
            },
          },
        },
        feedbackResponse: { select: { id: true } },
        config: { select: { id: true } },
      },
    });

    if (!link || !link.bill) {
      return NextResponse.json(
        { error: "Feedback link not found", success: false },
        { status: 404 },
      );
    }

    const slug = link.bill.businessCustomer?.business?.slug;
    if (slug !== businessSlug) {
      return NextResponse.json(
        { error: "Invalid link", success: false },
        { status: 404 },
      );
    }

    // One feedback per bill: reject if already submitted
    if (link.feedbackResponse) {
      return NextResponse.json(
        {
          error: "Feedback already submitted for this bill.",
          success: false,
        },
        { status: 400 },
      );
    }

    let configId = link.configId ?? null;
    if (!configId && link.bill.businessId) {
      const businessConfig = await db.feedbackConfig.findUnique({
        where: { businessId: link.bill.businessId },
        select: { id: true },
      });
      configId = businessConfig?.id ?? null;
    }

    if (!configId) {
      return NextResponse.json(
        {
          error: "Feedback is not configured for this business",
          success: false,
        },
        { status: 400 },
      );
    }

    const { rating, comment, howDidYouHear, selectedCategories } =
      validation.data;

    const response = await db.feedbackResponse.create({
      data: {
        configId,
        businessId: link.bill.businessId,
        customerId: link.bill.customerId,
        rating: rating ?? null,
        comment: comment ?? null,
        howDidYouHear: howDidYouHear ?? null,
        selectedCategories: selectedCategories ?? [],
      },
    });

    await db.feedbackLink.update({
      where: { token },
      data: { feedbackResponseId: response.id },
    });

    const configFull = await db.feedbackConfig.findUnique({
      where: { id: configId },
      select: {
        positiveFollowUp: true,
        negativeFollowUp: true,
        feedbackRewardEnabled: true,
        rewardAmount: true,
      },
    });

    const isPositive = rating != null && rating >= 4;
    const followUpMessage = isPositive
      ? configFull?.positiveFollowUp
      : (configFull?.negativeFollowUp ?? "Thank you for your feedback.");
    const reward =
      configFull?.feedbackRewardEnabled && configFull.rewardAmount != null
        ? { enabled: true, amount: configFull.rewardAmount }
        : { enabled: false, amount: null as number | null };

    return NextResponse.json({
      success: true,
      followUpMessage: followUpMessage || "Thank you for your feedback.",
      reward,
    });
  } catch (error: unknown) {
    console.error("Failed to submit feedback:", error);
    return NextResponse.json(
      {
        error: sanitizeErrorMessage(error) || "Failed to submit feedback",
        success: false,
      },
      { status: 500 },
    );
  }
}
