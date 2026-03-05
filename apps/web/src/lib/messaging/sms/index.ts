import type { Prisma } from "@reelo/db";
import { logMessage } from "../log-message";

export async function logFeedbackLinkSms(
  tx: Prisma.TransactionClient,
  params: {
    businessId: string;
    recipient: string;
    feedbackUrl: string;
    billNumber?: string;
    sourceId?: string;
  },
): Promise<void> {
  const body = params.billNumber
    ? `Your feedback link for bill #${params.billNumber}: ${params.feedbackUrl}`
    : `Your feedback link: ${params.feedbackUrl}`;
  await logMessage(tx, {
    businessId: params.businessId,
    channel: "SMS",
    recipient: params.recipient,
    body,
    source: "FEEDBACK_LINK",
    sourceId: params.sourceId ?? undefined,
  });
}

export async function logNegativeFeedbackAlertSms(
  tx: Prisma.TransactionClient,
  params: {
    businessId: string;
    recipient: string;
    rating: number;
    comment?: string | null;
    billNumber?: string;
    sourceId?: string;
  },
): Promise<void> {
  const body = params.billNumber
    ? `Negative feedback (${params.rating}/5) for bill #${params.billNumber}${params.comment ? `: ${params.comment}` : ""}`
    : `Negative feedback (${params.rating}/5)${params.comment ? `: ${params.comment}` : ""}`;
  await logMessage(tx, {
    businessId: params.businessId,
    channel: "SMS",
    recipient: params.recipient,
    body,
    source: "NEGATIVE_FEEDBACK_ALERT",
    sourceId: params.sourceId ?? undefined,
  });
}

export async function logLoyaltyEarnSms(
  tx: Prisma.TransactionClient,
  params: {
    businessId: string;
    recipient: string;
    body: string;
    sourceId?: string;
  },
): Promise<void> {
  await logMessage(tx, {
    businessId: params.businessId,
    channel: "SMS",
    recipient: params.recipient,
    body: params.body,
    source: "LOYALTY_EARN",
    sourceId: params.sourceId ?? undefined,
  });
}

export async function logCampaignAppliedSms(
  tx: Prisma.TransactionClient,
  params: {
    businessId: string;
    recipient: string;
    campaignTitle: string;
    rewardDescription: string;
    sourceId?: string;
  },
): Promise<void> {
  const body = `You earned: ${params.campaignTitle} - ${params.rewardDescription}`;
  await logMessage(tx, {
    businessId: params.businessId,
    channel: "SMS",
    recipient: params.recipient,
    body,
    source: "CAMPAIGN_APPLIED",
    sourceId: params.sourceId ?? undefined,
  });
}

export async function logReferralClaimSms(
  tx: Prisma.TransactionClient,
  params: {
    businessId: string;
    recipient: string;
    body: string;
    sourceId?: string;
  },
): Promise<void> {
  await logMessage(tx, {
    businessId: params.businessId,
    channel: "SMS",
    recipient: params.recipient,
    body: params.body,
    source: "REFERRAL_CLAIM",
    sourceId: params.sourceId ?? undefined,
  });
}

export async function logOtpSms(
  tx: Prisma.TransactionClient,
  params: {
    businessId: string;
    recipient: string;
    otp: string;
    sourceId?: string;
  },
): Promise<void> {
  await logMessage(tx, {
    businessId: params.businessId,
    channel: "SMS",
    recipient: params.recipient,
    body: `Your OTP is: ${params.otp}. Valid for 5 minutes.`,
    source: "LOYALTY_OTP",
    sourceId: params.sourceId ?? undefined,
  });
}
