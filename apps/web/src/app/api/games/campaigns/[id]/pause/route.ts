import { withAdminAuth } from "@/lib/auth/middleware";
import { logGameAudit } from "@/lib/gamification/audit";
import { sanitizeErrorMessage } from "@/lib/utils/error-handler";
import { db } from "@reelo/db";
import { NextResponse } from "next/server";

type Params = { id: string };

export const POST = withAdminAuth(async (_request, context, params: Params) => {
  try {
    const id = typeof params.id === "string" ? params.id : params.id?.[0];
    if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    const campaign = await db.gameCampaign.updateMany({
      where: { id, businessId: context.business.id },
      data: { status: "PAUSED", updatedByUserId: context.user.id },
    });
    if (campaign.count === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    await logGameAudit({
      businessId: context.business.id,
      campaignId: id,
      actorUserId: context.user.id,
      action: "GAME_CAMPAIGN_PAUSE",
    });
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: sanitizeErrorMessage(error) || "Pause failed" },
      { status: 500 },
    );
  }
});
