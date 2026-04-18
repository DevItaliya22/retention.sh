import { withAdminAuth } from "@/lib/auth/middleware";
import { logGameAudit } from "@/lib/gamification/audit";
import { gameCampaignCreateSchema } from "@/lib/schemas/games";
import {
  sanitizeErrorMessage,
  validateSchema,
} from "@/lib/utils/error-handler";
import { generateSlug } from "@/lib/utils/slug";
import { db } from "@reelo/db";
import { NextResponse } from "next/server";

export const GET = withAdminAuth(async (request, context) => {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const allowed = new Set([
      "DRAFT",
      "ACTIVE",
      "PAUSED",
      "COMPLETED",
      "ARCHIVED",
    ]);
    const where = {
      businessId: context.business.id,
      ...(status && allowed.has(status) ? { status: status as never } : {}),
    };
    const campaigns = await db.gameCampaign.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: {
        _count: { select: { attempts: true, rewards: true } },
      },
    });
    return NextResponse.json({ campaigns });
  } catch (error: unknown) {
    console.error("games campaigns list:", error);
    return NextResponse.json(
      { error: sanitizeErrorMessage(error) || "Failed to list campaigns" },
      { status: 500 },
    );
  }
});

async function findUniqueGameSlug(
  businessId: string,
  base: string,
): Promise<string> {
  const cleaned = (base || "game").toLowerCase().slice(0, 60);
  const existing = await db.gameCampaign.findMany({
    where: {
      businessId,
      slug: { startsWith: cleaned },
    },
    select: { slug: true },
  });
  const taken = new Set(existing.map((c) => c.slug));
  if (!taken.has(cleaned)) return cleaned;
  for (let i = 2; i < 1000; i++) {
    const candidate = `${cleaned}-${i}`;
    if (!taken.has(candidate)) return candidate;
  }
  return `${cleaned}-${Date.now()}`;
}

export const POST = withAdminAuth(async (request, context) => {
  try {
    const body = await request.json();
    const validation = validateSchema(gameCampaignCreateSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    const data = validation.data;
    const businessId = context.business.id;

    const baseSlug = (data.slug ?? generateSlug(data.name) ?? "game")
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    const uniqueSlug = await findUniqueGameSlug(businessId, baseSlug || "game");

    const campaign = await db.$transaction(async (tx) => {
      const c = await tx.gameCampaign.create({
        data: {
          businessId,
          type: data.type,
          name: data.name,
          slug: uniqueSlug,
          timezone: data.timezone ?? "UTC",
          fulfillmentMode: data.fulfillmentMode ?? "INSTANT",
          drawAt: data.drawAt ? new Date(data.drawAt) : undefined,
          status: "DRAFT",
          createdByUserId: context.user.id,
        },
      });
      await tx.gameEligibilityRule.create({
        data: {
          campaignId: c.id,
          eventType: "BILL_CREATED",
        },
      });
      await tx.gameDistributionPolicy.create({
        data: {
          campaignId: c.id,
          mode: "PROBABILITY_WEIGHTED",
        },
      });
      await tx.gameReward.create({
        data: {
          campaignId: c.id,
          kind: "NONE",
          displayName: "No prize",
          weight: 100,
          isFallbackNoReward: true,
        },
      });
      return c;
    });

    await logGameAudit({
      businessId,
      campaignId: campaign.id,
      actorUserId: context.user.id,
      action: "GAME_CAMPAIGN_CREATE",
      afterJson: { id: campaign.id, slug: campaign.slug },
    });

    return NextResponse.json({ campaign });
  } catch (error: unknown) {
    console.error("games campaigns create:", error);
    return NextResponse.json(
      { error: sanitizeErrorMessage(error) || "Failed to create campaign" },
      { status: 500 },
    );
  }
});
