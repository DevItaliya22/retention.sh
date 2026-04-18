import { withAdminAuth } from "@/lib/auth/middleware";
import { logGameAudit } from "@/lib/gamification/audit";
import { gameRewardsPutSchema } from "@/lib/schemas/games";
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
    const validation = validateSchema(gameRewardsPutSchema, json);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    await db.$transaction(async (tx) => {
      await tx.gameReward.deleteMany({ where: { campaignId: id } });
      for (const r of validation.data.rewards) {
        await tx.gameReward.create({
          data: {
            campaignId: id,
            kind: r.kind,
            displayName: r.displayName,
            weight: r.weight,
            probabilityPercent: r.probabilityPercent ?? undefined,
            maxWinners: r.maxWinners ?? undefined,
            stock: r.stock ?? undefined,
            priority: r.priority ?? 0,
            isFallbackNoReward: r.isFallbackNoReward ?? false,
            freeItemSkuId: r.freeItemSkuId ?? undefined,
            pointsAmount: r.pointsAmount ?? undefined,
            cashbackAmount: r.cashbackAmount ?? undefined,
            percentageValue: r.percentageValue ?? undefined,
            voucherCode: r.voucherCode ?? undefined,
          },
        });
      }
    });

    await logGameAudit({
      businessId: context.business.id,
      campaignId: id,
      actorUserId: context.user.id,
      action: "GAME_REWARDS_UPDATE",
    });

    const rewards = await db.gameReward.findMany({
      where: { campaignId: id },
      orderBy: { priority: "asc" },
    });
    return NextResponse.json({ rewards });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: sanitizeErrorMessage(error) || "Update failed" },
      { status: 500 },
    );
  }
});
