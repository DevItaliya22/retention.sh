import { withAdminAuth } from "@/lib/auth/middleware";
import { recomputeGameCampaignAnalyticsDay } from "@/lib/gamification/analytics-recompute";
import { logGameAudit } from "@/lib/gamification/audit";
import {
  sanitizeErrorMessage,
  validateSchema,
} from "@/lib/utils/error-handler";
import { db } from "@reelo/db";
import { NextResponse } from "next/server";
import { z } from "zod";

type Params = { id: string };

const bodySchema = z.object({
  day: z.string().datetime().optional(),
});

export const POST = withAdminAuth(async (request, context, params: Params) => {
  try {
    const id = typeof params.id === "string" ? params.id : params.id?.[0];
    if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    const owns = await db.gameCampaign.findFirst({
      where: { id, businessId: context.business.id },
    });
    if (!owns)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const json = await request.json().catch(() => ({}));
    const validation = validateSchema(bodySchema, json);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    const day = validation.data.day
      ? new Date(validation.data.day)
      : new Date();

    await recomputeGameCampaignAnalyticsDay(id, day);

    await logGameAudit({
      businessId: context.business.id,
      campaignId: id,
      actorUserId: context.user.id,
      action: "GAME_ANALYTICS_RECOMPUTE",
      afterJson: { day: day.toISOString() },
    });

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: sanitizeErrorMessage(error) || "Failed" },
      { status: 500 },
    );
  }
});
