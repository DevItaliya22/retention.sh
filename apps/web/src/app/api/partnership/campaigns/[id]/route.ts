import { withAdminAuth } from "@/lib/auth/middleware";
import { partnerCampaignUpdateSchema } from "@/lib/schemas/partnership";
import {
  sanitizeErrorMessage,
  validateSchema,
} from "@/lib/utils/error-handler";
import { db } from "@reelo/db";
import { NextRequest, NextResponse } from "next/server";

export const GET = withAdminAuth<{ id: string }>(
  async (_request: NextRequest, context, params) => {
    try {
      const campaignId = params.id as string;

      const campaign = await db.partnerCampaign.findUnique({
        where: { id: campaignId },
        include: {
          createdByBusiness: { select: { id: true, name: true, slug: true } },
          partnership: {
            select: {
              id: true,
              status: true,
              members: {
                include: {
                  business: { select: { id: true, name: true, slug: true } },
                },
              },
            },
          },
        },
      });

      if (!campaign) {
        return NextResponse.json(
          { error: "Partner campaign not found." },
          { status: 404 },
        );
      }

      const isMember = campaign.partnership.members.some(
        (m) => m.businessId === context.business.id,
      );
      if (!isMember) {
        return NextResponse.json(
          { error: "You are not a member of this partnership." },
          { status: 403 },
        );
      }

      return NextResponse.json(campaign);
    } catch (error) {
      console.error("Partner campaign GET error:", error);
      return NextResponse.json(
        { error: sanitizeErrorMessage(error) },
        { status: 500 },
      );
    }
  },
);

export const PATCH = withAdminAuth<{ id: string }>(
  async (request: NextRequest, context, params) => {
    try {
      const body = await request.json();
      const validation = validateSchema(partnerCampaignUpdateSchema, body);
      if (!validation.success) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }

      const campaignId = params.id as string;

      const campaign = await db.partnerCampaign.findUnique({
        where: { id: campaignId },
        include: {
          partnership: {
            include: { members: true },
          },
        },
      });

      if (!campaign) {
        return NextResponse.json(
          { error: "Partner campaign not found." },
          { status: 404 },
        );
      }

      const isMember = campaign.partnership.members.some(
        (m) => m.businessId === context.business.id,
      );
      if (!isMember) {
        return NextResponse.json(
          { error: "You are not a member of this partnership." },
          { status: 403 },
        );
      }

      if (campaign.partnership.status !== "ACTIVE") {
        return NextResponse.json(
          { error: "Cannot edit campaigns for a dissolved partnership." },
          { status: 400 },
        );
      }

      const data = validation.data;
      const updated = await db.partnerCampaign.update({
        where: { id: campaignId },
        data: {
          ...(data.title !== undefined && { title: data.title }),
          ...(data.description !== undefined && {
            description: data.description,
          }),
          ...(data.contactNumber !== undefined && {
            contactNumber: data.contactNumber,
          }),
          ...(data.expiresAt !== undefined && {
            expiresAt: new Date(data.expiresAt),
          }),
          ...(data.status !== undefined && { status: data.status }),
          ...(data.themeColor !== undefined && { themeColor: data.themeColor }),
          ...(data.textColor !== undefined && { textColor: data.textColor }),
          ...(data.logo !== undefined && { logo: data.logo }),
          ...(data.bannerImage !== undefined && {
            bannerImage: data.bannerImage,
          }),
          ...(data.rewardType !== undefined && { rewardType: data.rewardType }),
          ...(data.rewardValue !== undefined && {
            rewardValue: data.rewardValue,
          }),
          ...(data.appliesTo !== undefined && { appliesTo: data.appliesTo }),
          ...(data.maxRedemptionAmount !== undefined && {
            maxRedemptionAmount: data.maxRedemptionAmount,
          }),
          ...(data.maxRedemptionEnabled !== undefined && {
            maxRedemptionEnabled: data.maxRedemptionEnabled,
          }),
          ...(data.minPurchaseForEarningEnabled !== undefined && {
            minPurchaseForEarningEnabled: data.minPurchaseForEarningEnabled,
          }),
          ...(data.minPurchaseForEarning !== undefined && {
            minPurchaseForEarning: data.minPurchaseForEarning,
          }),
          ...(data.minPurchaseForRedemptionEnabled !== undefined && {
            minPurchaseForRedemptionEnabled:
              data.minPurchaseForRedemptionEnabled,
          }),
          ...(data.minPurchaseForRedemption !== undefined && {
            minPurchaseForRedemption: data.minPurchaseForRedemption,
          }),
          ...(data.instantCashbackRedeemable !== undefined && {
            instantCashbackRedeemable: data.instantCashbackRedeemable,
          }),
          ...(data.redemptionLimit !== undefined && {
            redemptionLimit: data.redemptionLimit,
          }),
          ...(data.termsAndConditions !== undefined && {
            termsAndConditions: data.termsAndConditions,
          }),
        },
        include: {
          createdByBusiness: { select: { id: true, name: true, slug: true } },
        },
      });

      return NextResponse.json(updated);
    } catch (error) {
      console.error("Partner campaign PATCH error:", error);
      return NextResponse.json(
        { error: sanitizeErrorMessage(error) },
        { status: 500 },
      );
    }
  },
);
