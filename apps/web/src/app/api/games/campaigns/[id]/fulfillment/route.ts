import { withAdminAuth } from "@/lib/auth/middleware";
import { logGameAudit } from "@/lib/gamification/audit";
import { fulfillmentModeSchema } from "@/lib/schemas/games";
import {
  sanitizeErrorMessage,
  validateSchema,
} from "@/lib/utils/error-handler";
import { db } from "@reelo/db";
import { NextResponse } from "next/server";
import { z } from "zod";

type Params = { id: string };

const bodySchema = z.object({
  fulfillmentMode: fulfillmentModeSchema,
  drawAt: z.string().datetime().optional().nullable(),
});

export const PUT = withAdminAuth(async (request, context, params: Params) => {
  try {
    const id = typeof params.id === "string" ? params.id : params.id?.[0];
    if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    const validation = validateSchema(bodySchema, await request.json());
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    const d = validation.data;
    const campaign = await db.gameCampaign.updateMany({
      where: { id, businessId: context.business.id },
      data: {
        fulfillmentMode: d.fulfillmentMode,
        drawAt: d.drawAt ? new Date(d.drawAt) : null,
        updatedByUserId: context.user.id,
      },
    });
    if (campaign.count === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    await logGameAudit({
      businessId: context.business.id,
      campaignId: id,
      actorUserId: context.user.id,
      action: "GAME_FULFILLMENT_UPDATE",
    });
    const updated = await db.gameCampaign.findFirst({ where: { id } });
    return NextResponse.json({ campaign: updated });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: sanitizeErrorMessage(error) || "Update failed" },
      { status: 500 },
    );
  }
});
