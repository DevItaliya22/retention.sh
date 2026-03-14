import { createCampaignBroadcastLogs } from "@/lib/actions/campaign/broadcast";
import { withAdminAuth } from "@/lib/auth/middleware";
import { campaignUpdateSchema } from "@/lib/schemas/campaign";
import {
  sanitizeErrorMessage,
  validateSchema,
} from "@/lib/utils/error-handler";
import { db } from "@reelo/db";
import { NextRequest, NextResponse } from "next/server";

type Params = { id: string };

function parseCampaignId(raw: string | string[] | undefined): string | null {
  const id = Array.isArray(raw) ? raw[0] : raw;
  if (typeof id !== "string") return null;
  const trimmed = id.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export const GET = withAdminAuth(
  async (request: NextRequest, context, params: Params) => {
    try {
      const id = parseCampaignId(params.id);
      if (!id) {
        return NextResponse.json(
          { error: "Invalid campaign id" },
          { status: 400 },
        );
      }
      const campaign = await db.campaign.findFirst({
        where: {
          id,
          businessId: context.business.id,
        },
      });

      if (!campaign) {
        return NextResponse.json(
          { error: "Campaign not found" },
          { status: 404 },
        );
      }

      return NextResponse.json(campaign, {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      });
    } catch (error) {
      console.error("Campaign get error:", error);
      return NextResponse.json(
        { error: sanitizeErrorMessage(error) },
        { status: 500 },
      );
    }
  },
);

export const PATCH = withAdminAuth(
  async (request: NextRequest, context, params: Params) => {
    try {
      const id = parseCampaignId(params.id);
      if (!id) {
        return NextResponse.json(
          { error: "Invalid campaign id" },
          { status: 400 },
        );
      }
      const existing = await db.campaign.findFirst({
        where: {
          id,
          businessId: context.business.id,
        },
      });

      if (!existing) {
        return NextResponse.json(
          { error: "Campaign not found" },
          { status: 404 },
        );
      }

      const body = await request.json();
      const validation = validateSchema(campaignUpdateSchema, body);
      if (!validation.success) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }

      const {
        title,
        description,
        contactNumber,
        startsAt,
        expiresAt,
        targetAudiences,
        messageScheduledAt,
        status,
        emailSubject,
        themeColor,
        textColor,
        logo,
        bannerImage,
        rewardType,
        rewardValue,
        offerStatement,
        appliesTo,
        maxRedemptionAmount,
        maxRedemptionEnabled,
        minPurchaseForEarningEnabled,
        minPurchaseForEarning,
        minPurchaseForRedemptionEnabled,
        minPurchaseForRedemption,
        instantCashbackRedeemable,
        redemptionLimit,
        termsAndConditions,
        whatsappEnabled,
        emailEnabled,
      } = validation.data;

      const updateData: Record<string, unknown> = {};
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (contactNumber !== undefined) updateData.contactNumber = contactNumber;
      if (startsAt !== undefined)
        updateData.startsAt = startsAt ? new Date(startsAt) : null;
      if (expiresAt !== undefined) updateData.expiresAt = new Date(expiresAt);
      if (targetAudiences !== undefined)
        updateData.targetAudiences = targetAudiences;
      if (messageScheduledAt !== undefined)
        updateData.messageScheduledAt = messageScheduledAt
          ? new Date(messageScheduledAt)
          : null;
      if (status !== undefined) updateData.status = status;
      if (emailSubject !== undefined) updateData.emailSubject = emailSubject;

      // Branding
      if (themeColor !== undefined) updateData.themeColor = themeColor;
      if (textColor !== undefined) updateData.textColor = textColor;
      if (logo !== undefined) updateData.logo = logo;
      if (bannerImage !== undefined) updateData.bannerImage = bannerImage;

      // Reward
      if (rewardType !== undefined) updateData.rewardType = rewardType;
      if (rewardValue !== undefined) updateData.rewardValue = rewardValue;
      if (offerStatement !== undefined)
        updateData.offerStatement = offerStatement;
      if (appliesTo !== undefined) updateData.appliesTo = appliesTo;
      if (maxRedemptionAmount !== undefined)
        updateData.maxRedemptionAmount = maxRedemptionAmount;
      if (maxRedemptionEnabled !== undefined)
        updateData.maxRedemptionEnabled = maxRedemptionEnabled;

      // Min purchase requirements
      if (minPurchaseForEarningEnabled !== undefined)
        updateData.minPurchaseForEarningEnabled = minPurchaseForEarningEnabled;
      if (minPurchaseForEarning !== undefined)
        updateData.minPurchaseForEarning = minPurchaseForEarning;
      if (minPurchaseForRedemptionEnabled !== undefined)
        updateData.minPurchaseForRedemptionEnabled =
          minPurchaseForRedemptionEnabled;
      if (minPurchaseForRedemption !== undefined)
        updateData.minPurchaseForRedemption = minPurchaseForRedemption;

      // Instant cashback
      if (instantCashbackRedeemable !== undefined)
        updateData.instantCashbackRedeemable = instantCashbackRedeemable;

      // Terms
      if (redemptionLimit !== undefined)
        updateData.redemptionLimit = redemptionLimit;
      if (termsAndConditions !== undefined)
        updateData.termsAndConditions = termsAndConditions;

      if (whatsappEnabled !== undefined)
        updateData.whatsappEnabled = whatsappEnabled;
      if (emailEnabled !== undefined) updateData.emailEnabled = emailEnabled;

      const campaign = await db.campaign.update({
        where: { id },
        data: updateData,
      });

      const isActivating = status === "ACTIVE" && existing.status !== "ACTIVE";
      if (isActivating) {
        await createCampaignBroadcastLogs(campaign.id).catch((err) =>
          console.error("Failed to create broadcast logs:", err),
        );
      }

      return NextResponse.json(campaign);
    } catch (error) {
      console.error("Campaign update error:", error);
      return NextResponse.json(
        { error: sanitizeErrorMessage(error) },
        { status: 500 },
      );
    }
  },
);
