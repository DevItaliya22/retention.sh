import { withAdminAuth } from "@/lib/auth/middleware";
import { logGameAudit } from "@/lib/gamification/audit";
import { getCampaignForBusiness } from "@/lib/gamification/game-service";
import { gameCampaignUpdateSchema } from "@/lib/schemas/games";
import {
  sanitizeErrorMessage,
  validateSchema,
} from "@/lib/utils/error-handler";
import { db } from "@reelo/db";
import { NextResponse } from "next/server";

export const GET = withAdminAuth(async (_request, context, params) => {
  try {
    const id = params.id as string;
    const campaign = await getCampaignForBusiness(id, context.business.id);
    if (!campaign) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ campaign });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: sanitizeErrorMessage(error) || "Failed to load campaign" },
      { status: 500 },
    );
  }
});

export const PUT = withAdminAuth(async (request, context, params) => {
  try {
    const id = params.id as string;
    const existing = await db.gameCampaign.findFirst({
      where: { id, businessId: context.business.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const body = await request.json();
    const validation = validateSchema(gameCampaignUpdateSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    const data = validation.data;
    const campaign = await db.gameCampaign.update({
      where: { id },
      data: {
        ...(data.name != null ? { name: data.name } : {}),
        ...(data.slug != null ? { slug: data.slug.toLowerCase() } : {}),
        ...(data.status != null ? { status: data.status } : {}),
        ...(data.startsAt !== undefined
          ? { startsAt: data.startsAt ? new Date(data.startsAt) : null }
          : {}),
        ...(data.endsAt !== undefined
          ? { endsAt: data.endsAt ? new Date(data.endsAt) : null }
          : {}),
        ...(data.timezone != null ? { timezone: data.timezone } : {}),
        ...(data.priority != null ? { priority: data.priority } : {}),
        ...(data.isStackable != null ? { isStackable: data.isStackable } : {}),
        ...(data.fulfillmentMode != null
          ? { fulfillmentMode: data.fulfillmentMode }
          : {}),
        ...(data.drawAt !== undefined
          ? { drawAt: data.drawAt ? new Date(data.drawAt) : null }
          : {}),
        ...(data.drawWindowStart !== undefined
          ? {
              drawWindowStart: data.drawWindowStart
                ? new Date(data.drawWindowStart)
                : null,
            }
          : {}),
        ...(data.drawWindowEnd !== undefined
          ? {
              drawWindowEnd: data.drawWindowEnd
                ? new Date(data.drawWindowEnd)
                : null,
            }
          : {}),
        updatedByUserId: context.user.id,
      },
      include: {
        eligibilityRules: true,
        distributionPolicy: true,
        rewards: true,
      },
    });

    await logGameAudit({
      businessId: context.business.id,
      campaignId: id,
      actorUserId: context.user.id,
      action: "GAME_CAMPAIGN_UPDATE",
      beforeJson: { status: existing.status },
      afterJson: { status: campaign.status },
    });

    return NextResponse.json({ campaign });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: sanitizeErrorMessage(error) || "Failed to update campaign" },
      { status: 500 },
    );
  }
});
