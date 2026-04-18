import { withAdminAuth } from "@/lib/auth/middleware";
import { logGameAudit } from "@/lib/gamification/audit";
import { gameEligibilityRuleSchema } from "@/lib/schemas/games";
import {
  sanitizeErrorMessage,
  validateSchema,
} from "@/lib/utils/error-handler";
import { db } from "@reelo/db";
import { NextResponse } from "next/server";
import { z } from "zod";

type Params = { id: string };

const bodySchema = z.object({
  rules: z.array(gameEligibilityRuleSchema).min(1),
});

export const PUT = withAdminAuth(async (request, context, params: Params) => {
  try {
    const id = typeof params.id === "string" ? params.id : params.id?.[0];
    if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    const owns = await db.gameCampaign.findFirst({
      where: { id, businessId: context.business.id },
    });
    if (!owns)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const json = await request.json();
    const validation = validateSchema(bodySchema, json);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    await db.$transaction(async (tx) => {
      await tx.gameEligibilityRule.deleteMany({ where: { campaignId: id } });
      for (const r of validation.data.rules) {
        await tx.gameEligibilityRule.create({
          data: {
            campaignId: id,
            eventType: r.eventType,
            eventFilterJson: r.eventFilterJson ?? undefined,
            intervalEnabled: r.intervalEnabled ?? false,
            intervalValue: r.intervalValue ?? undefined,
            intervalUnit: r.intervalUnit ?? undefined,
            maxAttemptsPerUserPerInterval:
              r.maxAttemptsPerUserPerInterval ?? undefined,
            globalAttemptCap: r.globalAttemptCap ?? undefined,
            firstNEligibleUsers: r.firstNEligibleUsers ?? undefined,
            segmentId: r.segmentId ?? undefined,
          },
        });
      }
    });

    await logGameAudit({
      businessId: context.business.id,
      campaignId: id,
      actorUserId: context.user.id,
      action: "GAME_ELIGIBILITY_UPDATE",
    });

    const rules = await db.gameEligibilityRule.findMany({
      where: { campaignId: id },
    });
    return NextResponse.json({ rules });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: sanitizeErrorMessage(error) || "Update failed" },
      { status: 500 },
    );
  }
});
