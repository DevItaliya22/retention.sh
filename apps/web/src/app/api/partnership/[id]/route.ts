import { withAdminAuth } from "@/lib/auth/middleware";
import { updatePartnershipSchema } from "@/lib/schemas/partnership";
import {
  sanitizeErrorMessage,
  validateSchema,
} from "@/lib/utils/error-handler";
import { writePartnershipLog } from "@/lib/utils/partnership-log";
import { db } from "@reelo/db";
import { NextRequest, NextResponse } from "next/server";

export const GET = withAdminAuth<{ id: string }>(
  async (_request: NextRequest, context, params) => {
    try {
      const partnershipId = params.id as string;

      const partnership = await db.businessPartnership.findUnique({
        where: { id: partnershipId },
        include: {
          members: {
            include: {
              business: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  loyalty: { select: { loyaltyType: true } },
                },
              },
            },
          },
        },
      });

      if (!partnership) {
        return NextResponse.json(
          { error: "Partnership not found." },
          { status: 404 },
        );
      }

      const isMember = partnership.members.some(
        (m) => m.businessId === context.business.id,
      );
      if (!isMember) {
        return NextResponse.json(
          { error: "You are not a member of this partnership." },
          { status: 403 },
        );
      }

      return NextResponse.json(partnership);
    } catch (error) {
      console.error("Partnership GET error:", error);
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
      const validation = validateSchema(updatePartnershipSchema, body);
      if (!validation.success) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }

      const partnershipId = params.id as string;
      const {
        exchangeRate,
        pointToCurrencyRate,
        sharedReferrals,
        shareReferralRewards,
        sharedCampaigns,
      } = validation.data;

      const partnership = await db.businessPartnership.findUnique({
        where: { id: partnershipId },
        include: { members: true },
      });

      if (!partnership) {
        return NextResponse.json(
          { error: "Partnership not found." },
          { status: 404 },
        );
      }

      if (partnership.status !== "ACTIVE") {
        return NextResponse.json(
          { error: "Cannot update a dissolved partnership." },
          { status: 400 },
        );
      }

      const myMember = partnership.members.find(
        (m) => m.businessId === context.business.id,
      );
      if (!myMember) {
        return NextResponse.json(
          { error: "You are not a member of this partnership." },
          { status: 403 },
        );
      }

      if (partnership.settingsLocked) {
        return NextResponse.json(
          {
            error:
              "Partnership settings are locked. Request an unlock to make changes.",
          },
          { status: 403 },
        );
      }

      // Update member-specific fields (exchange rate, point conversion)
      if (exchangeRate !== undefined || pointToCurrencyRate !== undefined) {
        await db.partnershipMember.update({
          where: { id: myMember.id },
          data: {
            ...(exchangeRate !== undefined && { exchangeRate }),
            ...(pointToCurrencyRate !== undefined && { pointToCurrencyRate }),
          },
        });
      }

      // Update partnership-level toggles
      const partnershipUpdate: Record<string, boolean> = {};
      if (sharedReferrals !== undefined)
        partnershipUpdate.sharedReferrals = sharedReferrals;
      if (shareReferralRewards !== undefined)
        partnershipUpdate.shareReferralRewards = shareReferralRewards;
      if (sharedCampaigns !== undefined)
        partnershipUpdate.sharedCampaigns = sharedCampaigns;

      if (Object.keys(partnershipUpdate).length > 0) {
        await db.businessPartnership.update({
          where: { id: partnershipId },
          data: partnershipUpdate,
        });
      }

      const updated = await db.businessPartnership.findUnique({
        where: { id: partnershipId },
        include: {
          members: {
            include: {
              business: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  loyalty: { select: { loyaltyType: true } },
                },
              },
            },
          },
        },
      });

      await writePartnershipLog({
        actorBusinessId: context.business.id,
        event: "SETTINGS_UPDATED",
        partnershipId: partnershipId,
        metadata: {
          ...(exchangeRate !== undefined && { exchangeRate }),
          ...(pointToCurrencyRate !== undefined && { pointToCurrencyRate }),
          ...(sharedReferrals !== undefined && { sharedReferrals }),
          ...(shareReferralRewards !== undefined && { shareReferralRewards }),
          ...(sharedCampaigns !== undefined && { sharedCampaigns }),
        },
      });

      return NextResponse.json(updated);
    } catch (error) {
      console.error("Partnership PATCH error:", error);
      return NextResponse.json(
        { error: sanitizeErrorMessage(error) },
        { status: 500 },
      );
    }
  },
);
