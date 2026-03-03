import { withAdminAuth } from "@/lib/auth/middleware";
import { campaignsQuerySchema } from "@/lib/schemas/campaign";
import {
  sanitizeErrorMessage,
  validateSchema,
} from "@/lib/utils/error-handler";
import {
  type BenefitAppliesTo,
  type CampaignRewardType,
  type CampaignStatus,
  db,
  type RedemptionLimit,
} from "@reelo/db";
import { NextRequest, NextResponse } from "next/server";

export const GET = withAdminAuth(async (request: NextRequest, context) => {
  try {
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    const validation = validateSchema(campaignsQuerySchema, queryParams);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error, items: [], total: 0, page: 1, perPage: 10 },
        { status: 400 },
      );
    }

    const {
      page = 1,
      perPage = 10,
      sort,
      title,
      status,
      rewardType,
      appliesTo,
      redemptionLimit,
    } = validation.data;
    const skip = (page - 1) * perPage;
    const take = perPage;

    const where: {
      businessId: string;
      OR?: Array<
        | { title: { contains: string; mode: "insensitive" } }
        | { description: { contains: string; mode: "insensitive" } }
      >;
      status?: CampaignStatus;
      rewardType?: CampaignRewardType;
      appliesTo?: BenefitAppliesTo;
      redemptionLimit?: RedemptionLimit;
    } = {
      businessId: context.business.id,
    };
    if (title) {
      where.OR = [
        { title: { contains: title, mode: "insensitive" } },
        { description: { contains: title, mode: "insensitive" } },
      ];
    }
    if (status) {
      where.status = status as CampaignStatus;
    }
    if (rewardType) {
      where.rewardType = rewardType as CampaignRewardType;
    }
    if (appliesTo) {
      where.appliesTo = appliesTo as BenefitAppliesTo;
    }
    if (redemptionLimit) {
      where.redemptionLimit = redemptionLimit as RedemptionLimit;
    }

    const orderBy: Record<string, "asc" | "desc"> = {};
    if (sort) {
      const [field, direction] = sort.split(":");
      const sortDirection = direction === "desc" ? "desc" : "asc";
      if (
        field === "title" ||
        field === "status" ||
        field === "rewardType" ||
        field === "expiresAt" ||
        field === "updatedAt"
      ) {
        orderBy[field] = sortDirection;
      } else {
        orderBy.updatedAt = "desc";
      }
    } else {
      orderBy.updatedAt = "desc";
    }

    const [items, total] = await Promise.all([
      db.campaign.findMany({
        where,
        skip,
        take,
        orderBy,
        select: {
          id: true,
          slug: true,
          title: true,
          description: true,
          status: true,
          rewardType: true,
          rewardValue: true,
          offerStatement: true,
          appliesTo: true,
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
      page,
      perPage,
    });
  } catch (error) {
    console.error("Campaigns list error:", error);
    return NextResponse.json(
      {
        error: sanitizeErrorMessage(error),
        items: [],
        total: 0,
        page: 1,
        perPage: 10,
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
        rewardType: "FREE_ITEM",
        rewardValue: "Dessert",
        offerStatement:
          "Get a **Dessert** absolutely FREE on a **minimum purchase of ₹1000**. Don't miss out!",
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
