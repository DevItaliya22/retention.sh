import { withAdminAuth } from "@/lib/auth/middleware";
import { getCampaignForBusiness } from "@/lib/gamification/game-service";
import { sanitizeErrorMessage } from "@/lib/utils/error-handler";
import { db } from "@reelo/db";
import { NextResponse } from "next/server";

type Params = { id: string };

/** GET ?customerId= — lightweight eligibility preview (active campaign + window). */
export const GET = withAdminAuth(async (request, context, params: Params) => {
  try {
    const campaignId =
      typeof params.id === "string" ? params.id : params.id?.[0];
    if (!campaignId) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get("customerId");
    if (!customerId) {
      return NextResponse.json(
        { error: "customerId query required" },
        { status: 400 },
      );
    }
    const campaign = await getCampaignForBusiness(
      campaignId,
      context.business.id,
    );
    if (!campaign) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const bc = await db.businessCustomer.findUnique({
      where: {
        businessId_customerId: {
          businessId: context.business.id,
          customerId,
        },
      },
    });
    const now = new Date();
    const inWindow =
      (!campaign.startsAt || now >= campaign.startsAt) &&
      (!campaign.endsAt || now <= campaign.endsAt);
    return NextResponse.json({
      eligible: campaign.status === "ACTIVE" && !!bc && inWindow,
      campaignStatus: campaign.status,
      inWindow,
      customerLinked: !!bc,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: sanitizeErrorMessage(error) || "Check failed" },
      { status: 500 },
    );
  }
});
