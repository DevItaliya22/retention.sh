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
    if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    const src = await getCampaignForBusiness(id, context.business.id);
    if (!src) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const newSlug = `${src.slug}-copy-${Date.now().toString(36)}`.slice(0, 80);
    const clone = await db.$transaction(async (tx) => {
      const c = await tx.gameCampaign.create({
        data: {
          businessId: context.business.id,
          type: src.type,
          name: `${src.name} (copy)`,
          slug: newSlug,
          timezone: src.timezone,
          priority: src.priority,
          isStackable: src.isStackable,
          fulfillmentMode: src.fulfillmentMode,
          status: "DRAFT",
          createdByUserId: context.user.id,
        },
      });
      for (const r of src.eligibilityRules) {
        await tx.gameEligibilityRule.create({
          data: {
            campaignId: c.id,
            eventType: r.eventType,
            eventFilterJson: r.eventFilterJson ?? undefined,
            intervalEnabled: r.intervalEnabled,
            intervalValue: r.intervalValue,
            intervalUnit: r.intervalUnit,
            maxAttemptsPerUserPerInterval: r.maxAttemptsPerUserPerInterval,
            globalAttemptCap: r.globalAttemptCap,
            firstNEligibleUsers: r.firstNEligibleUsers,
            segmentId: r.segmentId,
          },
        });
      }
      if (src.distributionPolicy) {
        await tx.gameDistributionPolicy.create({
          data: {
            campaignId: c.id,
            mode: src.distributionPolicy.mode,
            populationWindowSize: src.distributionPolicy.populationWindowSize,
            populationWinnerCount: src.distributionPolicy.populationWinnerCount,
            maxWinnersTotal: src.distributionPolicy.maxWinnersTotal,
            randomSeedVersion: src.distributionPolicy.randomSeedVersion,
            strictInventoryMode: src.distributionPolicy.strictInventoryMode,
          },
        });
      }
      for (const rw of src.rewards) {
        await tx.gameReward.create({
          data: {
            campaignId: c.id,
            kind: rw.kind,
            displayName: rw.displayName,
            weight: rw.weight,
            probabilityPercent: rw.probabilityPercent,
            maxWinners: rw.maxWinners,
            stock: rw.stock,
            priority: rw.priority,
            isFallbackNoReward: rw.isFallbackNoReward,
            freeItemSkuId: rw.freeItemSkuId,
            pointsAmount: rw.pointsAmount,
            cashbackAmount: rw.cashbackAmount,
            percentageValue: rw.percentageValue,
            voucherCode: rw.voucherCode,
          },
        });
      }
      return c;
    });

    await logGameAudit({
      businessId: context.business.id,
      campaignId: clone.id,
      actorUserId: context.user.id,
      action: "GAME_CAMPAIGN_CLONE",
      afterJson: { sourceId: id },
    });

    return NextResponse.json({ campaign: clone });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: sanitizeErrorMessage(error) || "Clone failed" },
      { status: 500 },
    );
  }
});
