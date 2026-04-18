import { withAdminAuth } from "@/lib/auth/middleware";
import { logGameAudit } from "@/lib/gamification/audit";
import { getCampaignForBusiness } from "@/lib/gamification/game-service";
import { sanitizeErrorMessage } from "@/lib/utils/error-handler";
import { db } from "@reelo/db";
import { NextResponse } from "next/server";

type Params = { id: string };

export const POST = withAdminAuth(async (_request, context, params: Params) => {
  try {
    const id = typeof params.id === "string" ? params.id : params.id?.[0];
    if (!id) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }
    const full = await getCampaignForBusiness(id, context.business.id);
    if (!full) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (full.rewards.length === 0) {
      return NextResponse.json(
        { error: "Add at least one reward before publishing" },
        { status: 400 },
      );
    }
    if (!full.distributionPolicy) {
      return NextResponse.json(
        { error: "Missing distribution policy" },
        { status: 400 },
      );
    }
    if (full.eligibilityRules.length === 0) {
      return NextResponse.json(
        { error: "Add at least one eligibility rule" },
        { status: 400 },
      );
    }
    const campaign = await db.gameCampaign.update({
      where: { id },
      data: { status: "ACTIVE", updatedByUserId: context.user.id },
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
      action: "GAME_CAMPAIGN_PUBLISH",
    });
    return NextResponse.json({ campaign });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: sanitizeErrorMessage(error) || "Publish failed" },
      { status: 500 },
    );
  }
});
