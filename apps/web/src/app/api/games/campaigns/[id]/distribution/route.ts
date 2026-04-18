import { withAdminAuth } from "@/lib/auth/middleware";
import { logGameAudit } from "@/lib/gamification/audit";
import { gameDistributionPolicySchema } from "@/lib/schemas/games";
import {
  sanitizeErrorMessage,
  validateSchema,
} from "@/lib/utils/error-handler";
import { db } from "@reelo/db";
import { NextResponse } from "next/server";

type Params = { id: string };

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
    const validation = validateSchema(gameDistributionPolicySchema, json);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    const d = validation.data;

    const policy = await db.gameDistributionPolicy.upsert({
      where: { campaignId: id },
      create: {
        campaignId: id,
        mode: d.mode,
        populationWindowSize: d.populationWindowSize ?? undefined,
        populationWinnerCount: d.populationWinnerCount ?? undefined,
        maxWinnersTotal: d.maxWinnersTotal ?? undefined,
        randomSeedVersion: d.randomSeedVersion ?? 1,
        strictInventoryMode: d.strictInventoryMode ?? false,
      },
      update: {
        mode: d.mode,
        populationWindowSize: d.populationWindowSize ?? null,
        populationWinnerCount: d.populationWinnerCount ?? null,
        maxWinnersTotal: d.maxWinnersTotal ?? null,
        randomSeedVersion: d.randomSeedVersion ?? 1,
        strictInventoryMode: d.strictInventoryMode ?? false,
      },
    });

    await logGameAudit({
      businessId: context.business.id,
      campaignId: id,
      actorUserId: context.user.id,
      action: "GAME_DISTRIBUTION_UPDATE",
    });

    return NextResponse.json({ policy });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: sanitizeErrorMessage(error) || "Update failed" },
      { status: 500 },
    );
  }
});
