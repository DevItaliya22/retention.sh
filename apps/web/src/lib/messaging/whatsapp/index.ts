import type { Prisma } from "@reelo/db";
import { logMessage } from "../log-message";

export function buildLoyaltyPortalDefaultMessage(params: {
  businessName?: string | null;
  loyaltyUrl: string;
}) {
  const businessName = params.businessName?.trim() || "our store";
  return `Hi! Access your loyalty wallet for ${businessName} here: ${params.loyaltyUrl}`;
}

export function buildReferralPortalDefaultMessage(params: {
  businessName?: string | null;
  referralUrl: string;
}) {
  const businessName = params.businessName?.trim() || "our store";
  return `Hey! Join ${businessName} using my referral link and unlock rewards: ${params.referralUrl}`;
}

export async function logFeedbackLinkWhatsApp(
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
    channel: "WHATSAPP",
    recipient: params.recipient,
    body,
    source: "FEEDBACK_LINK",
    sourceId: params.sourceId ?? undefined,
  });
}

export async function logNegativeFeedbackAlertWhatsApp(
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
    channel: "WHATSAPP",
    recipient: params.recipient,
    body,
    source: "NEGATIVE_FEEDBACK_ALERT",
    sourceId: params.sourceId ?? undefined,
  });
}

export async function logLoyaltyEarnWhatsApp(
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
    channel: "WHATSAPP",
    recipient: params.recipient,
    body: params.body,
    source: "LOYALTY_EARN",
    sourceId: params.sourceId ?? undefined,
  });
}

export async function logCampaignAppliedWhatsApp(
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
    channel: "WHATSAPP",
    recipient: params.recipient,
    body,
    source: "CAMPAIGN_APPLIED",
    sourceId: params.sourceId ?? undefined,
  });
}

export async function logReferralClaimWhatsApp(
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
    channel: "WHATSAPP",
    recipient: params.recipient,
    body: params.body,
    source: "REFERRAL_CLAIM",
    sourceId: params.sourceId ?? undefined,
  });
}

export async function logReferralReminderWhatsApp(
  tx: Prisma.TransactionClient,
  params: {
    businessId: string;
    recipient: string;
    body: string;
    sourceId?: string;
    scheduledAt: Date;
  },
): Promise<void> {
  await logMessage(tx, {
    businessId: params.businessId,
    channel: "WHATSAPP",
    recipient: params.recipient,
    body: params.body,
    source: "REFERRAL_REMINDER",
    sourceId: params.sourceId ?? undefined,
    scheduledAt: params.scheduledAt,
  });
}

export async function logOtpWhatsApp(
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
    channel: "WHATSAPP",
    recipient: params.recipient,
    body: `Your OTP is: ${params.otp}. Valid for 5 minutes.`,
    source: "LOYALTY_OTP",
    sourceId: params.sourceId ?? undefined,
  });
}
