import { withAdminAuth } from "@/lib/auth/middleware";
import { campaignsQuerySchema } from "@/lib/schemas/campaign";
import {
  sanitizeErrorMessage,
  validateSchema,
} from "@/lib/utils/error-handler";
import { type CampaignRewardType, db } from "@reelo/db";
import { NextRequest, NextResponse } from "next/server";

export const GET = withAdminAuth(async (request: NextRequest, context) => {
  try {
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    const validation = validateSchema(campaignsQuerySchema, queryParams);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error, items: [], total: 0 },
        { status: 400 },
      );
    }

    const { rewardType } = validation.data;

    const where: { businessId: string; rewardType?: CampaignRewardType } = {
      businessId: context.business.id,
    };
    if (rewardType) {
      where.rewardType = rewardType as CampaignRewardType;
    }

    const [items, total] = await Promise.all([
      db.campaign.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          slug: true,
          title: true,
          description: true,
          status: true,
          rewardType: true,
          rewardValue: true,
          expiresAt: true,
          themeColor: true,
          bannerImage: true,
          logo: true,
          contactNumber: true,
          termsAndConditions: true,
          maxRedemptionEnabled: true,
          maxRedemptionAmount: true,
          minPurchaseForEarningEnabled: true,
          minPurchaseForEarning: true,
          minPurchaseForRedemptionEnabled: true,
          minPurchaseForRedemption: true,
          instantCashbackRedeemable: true,
          redemptionLimit: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      db.campaign.count({ where }),
    ]);

    return NextResponse.json({
      items,
      total,
    });
  } catch (error) {
    console.error("Campaigns list error:", error);
    return NextResponse.json(
      {
        error: sanitizeErrorMessage(error),
        items: [],
        total: 0,
      },
      { status: 500 },
    );
  }
});

/** Create a draft campaign and initialise branding from business defaults */
export const POST = withAdminAuth(async (request: NextRequest, context) => {
  try {
    const defaultBranding = await db.branding.findUnique({
      where: { businessId: context.business.id },
      select: {
        themeColor: true,
        textColor: true,
        logo: true,
        bannerImage: true,
      },
    });

    const campaign = await db.campaign.create({
      data: {
        businessId: context.business.id,
        slug: `draft-${crypto.randomUUID()}`,
        status: "DRAFT",
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        themeColor: defaultBranding?.themeColor ?? null,
        textColor: defaultBranding?.textColor ?? null,
        logo: defaultBranding?.logo ?? null,
        bannerImage: defaultBranding?.bannerImage ?? null,
      },
      select: { id: true, slug: true },
    });

    return NextResponse.json({ id: campaign.id, slug: campaign.slug });
  } catch (error) {
    console.error("Create campaign draft error:", error);
    return NextResponse.json(
      { error: sanitizeErrorMessage(error) },
      { status: 500 },
    );
  }
});
