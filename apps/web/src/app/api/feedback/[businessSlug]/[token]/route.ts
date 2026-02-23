import { FEEDBACK_FORM_DEFAULTS } from "@/lib/constants/forms/feedback";
import { feedbackSubmitSchema } from "@/lib/schemas/feedback";
import {
  sanitizeErrorMessage,
  validateSchema,
} from "@/lib/utils/error-handler";
import type { IsServiceEnabled } from "@/lib/utils/service-enabled";
import { isServiceEnabled } from "@/lib/utils/service-enabled";
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
            selectionOptions: { orderBy: { seq: "asc" } },
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

    const businessId = link.bill.businessId;
    if (businessId) {
      const business = await db.business.findUnique({
        where: { id: businessId },
        select: { isServiceEnabled: true },
      });
      if (
        !isServiceEnabled(
          (business?.isServiceEnabled ?? null) as IsServiceEnabled | null,
          "feedback",
        )
      ) {
        return NextResponse.json({
          alreadySubmitted: false,
          config: null,
          billNumber: link.bill.billNumber,
        });
      }
    }

    // One feedback per bill: already submitted → return thank you + reward only
    if (link.feedbackResponse) {
      type FollowUpReward = {
        positiveFollowUp: string | null;
        negativeFollowUp: string | null;
        feedbackRewardEnabled: boolean;
        rewardAmount: number | null;
        askForOnlineReviews: boolean;
        onlineReviewLink: string | null;
        onlineReviewPlatform: string | null;
      } | null;
      let followUpRewardConfig: FollowUpReward = link.config
        ? {
            positiveFollowUp: link.config.positiveFollowUp,
            negativeFollowUp: link.config.negativeFollowUp,
            feedbackRewardEnabled: link.config.feedbackRewardEnabled,
            rewardAmount: link.config.rewardAmount,
            askForOnlineReviews: link.config.askForOnlineReviews,
            onlineReviewLink: link.config.onlineReviewLink,
            onlineReviewPlatform: link.config.onlineReviewPlatform,
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
            askForOnlineReviews: true,
            onlineReviewLink: true,
            onlineReviewPlatform: true,
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
      const onlineReview =
        followUpRewardConfig?.askForOnlineReviews &&
        followUpRewardConfig.onlineReviewLink
          ? {
              link: followUpRewardConfig.onlineReviewLink,
              platform: followUpRewardConfig.onlineReviewPlatform,
            }
          : null;
      return NextResponse.json({
        alreadySubmitted: true,
        config: null,
        billNumber: link.bill.billNumber,
        followUpMessage: followUpMessage || "Thank you for your feedback.",
        reward,
        onlineReview,
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
          selectionOptions: { orderBy: { seq: "asc" } },
          branding: true,
        },
      });
    }

    const defaultFollowUp = FEEDBACK_FORM_DEFAULTS.followUpMessage;
    const config = configToUse
      ? {
          id: configToUse.id,
          positiveFollowUp: configToUse.positiveFollowUp ?? defaultFollowUp,
          negativeFollowUp: configToUse.negativeFollowUp ?? defaultFollowUp,
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
          selectionOptions: configToUse.selectionOptions.map((o) => ({
            id: o.id,
            label: o.label,
          })),
          askForOnlineReviews: configToUse.askForOnlineReviews,
          onlineReviewLink: configToUse.onlineReviewLink,
          onlineReviewPlatform: configToUse.onlineReviewPlatform,
          branding: configToUse.branding,
        }
      : {
          id: "",
          positiveFollowUp: defaultFollowUp,
          negativeFollowUp: defaultFollowUp,
          questions: [],
          categories: [],
          isHowDidYouHearEnabled: false,
          howDidYouHearOptions: [],
          selectionOptions: [],
          askForOnlineReviews: false,
          onlineReviewLink: null,
          onlineReviewPlatform: null,
          branding: null,
        };

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

    const businessIdForPost = link.bill.businessId;
    if (businessIdForPost) {
      const businessForPost = await db.business.findUnique({
        where: { id: businessIdForPost },
        select: { isServiceEnabled: true },
      });
      if (
        !isServiceEnabled(
          (businessForPost?.isServiceEnabled ??
            null) as IsServiceEnabled | null,
          "feedback",
        )
      ) {
        return NextResponse.json(
          {
            error:
              "Feedback is not configured for this link yet. Please check back later.",
            success: false,
          },
          { status: 400 },
        );
      }
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

    const {
      rating,
      comment,
      howDidYouHear,
      selectedCategories,
      selectedSelectionOptionIds,
    } = validation.data;

    const businessId = link.bill.businessId;
    const customerId = link.bill.customerId;

    const optionIds =
      selectedSelectionOptionIds && selectedSelectionOptionIds.length > 0
        ? selectedSelectionOptionIds
        : [];
    if (optionIds.length > 0) {
      const validOptions = await db.feedbackSelectionOption.findMany({
        where: { configId, id: { in: optionIds } },
        select: { id: true },
      });
      const validIds = new Set(validOptions.map((o) => o.id));
      const invalid = optionIds.filter((id) => !validIds.has(id));
      if (invalid.length > 0) {
        return NextResponse.json(
          {
            error: "Invalid selection option(s). Please refresh and try again.",
            success: false,
          },
          { status: 400 },
        );
      }
    }

    const configFull = await db.feedbackConfig.findUnique({
      where: { id: configId },
      select: {
        positiveFollowUp: true,
        negativeFollowUp: true,
        feedbackRewardEnabled: true,
        rewardAmount: true,
        askForOnlineReviews: true,
        onlineReviewLink: true,
        onlineReviewPlatform: true,
      },
    });

    const rewardAmount =
      configFull?.feedbackRewardEnabled && configFull.rewardAmount != null
        ? Math.max(0, configFull.rewardAmount)
        : 0;
    const shouldCreditWallet =
      rewardAmount > 0 && businessId && customerId != null;

    const response = await db.$transaction(async (tx) => {
      const res = await tx.feedbackResponse.create({
        data: {
          configId,
          businessId,
          customerId,
          rating: rating ?? null,
          comment: comment ?? null,
          howDidYouHear: howDidYouHear ?? null,
          selectedCategories: selectedCategories ?? [],
          selectedSelectionOptions:
            optionIds.length > 0
              ? { connect: optionIds.map((id) => ({ id })) }
              : undefined,
        },
      });

      await tx.feedbackLink.update({
        where: { token },
        data: { feedbackResponseId: res.id },
      });

      // Credit cashback to wallet and create Transaction when reward is enabled
      if (shouldCreditWallet) {
        await tx.wallet.upsert({
          where: {
            businessId_customerId: { businessId, customerId },
          },
          create: {
            businessId,
            customerId,
            cashbackBalance: rewardAmount,
          },
          update: { cashbackBalance: { increment: rewardAmount } },
        });
        await tx.transaction.create({
          data: {
            businessId,
            customerId,
            valueKind: "CASHBACK",
            amount: rewardAmount,
            type: "EARNED",
            source: "FEEDBACK",
            feedbackResponseId: res.id,
            description: "Feedback cashback",
          },
        });
      }

      return res;
    });

    const isPositive = rating != null && rating >= 4;
    const followUpMessage = isPositive
      ? configFull?.positiveFollowUp
      : (configFull?.negativeFollowUp ?? "Thank you for your feedback.");
    const reward =
      rewardAmount > 0
        ? { enabled: true, amount: rewardAmount }
        : { enabled: false, amount: null as number | null };
    const onlineReview =
      configFull?.askForOnlineReviews && configFull.onlineReviewLink
        ? {
            link: configFull.onlineReviewLink,
            platform: configFull.onlineReviewPlatform,
          }
        : null;

    return NextResponse.json({
      success: true,
      followUpMessage: followUpMessage || "Thank you for your feedback.",
      reward,
      onlineReview,
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
