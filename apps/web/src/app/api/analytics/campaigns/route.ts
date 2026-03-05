import { withAdminAuth } from "@/lib/auth/middleware";
import {
  analyticsQuerySchema,
  getPeriodDateRange,
  type AnalyticsPeriod,
} from "@/lib/schemas/analytics";
import type { CampaignAnalyticsResponse } from "@/lib/types/analytics";
import {
  sanitizeErrorMessage,
  validateSchema,
} from "@/lib/utils/error-handler";
import { db } from "@reelo/db";
import { NextRequest, NextResponse } from "next/server";

export const GET = withAdminAuth(async (request: NextRequest, context) => {
  try {
    const businessId = context.business.id;
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    const validation = validateSchema(analyticsQuerySchema, queryParams);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: validation.error,
          totalSent: 0,
          whatsappCount: 0,
          smsCount: 0,
          emailCount: 0,
        },
        { status: 400 },
      );
    }

    const period = (validation.data.period ?? "30d") as AnalyticsPeriod;
    const { from, to } = getPeriodDateRange(period);

    const campaigns = await db.campaign.findMany({
      where: {
        businessId,
        status: { in: ["ACTIVE", "EXPIRED"] },
        createdAt: { gte: from, lte: to },
      },
      select: {
        whatsappEnabled: true,
        emailEnabled: true,
      },
    });
    // all the counts are the actual counts like whn we send the messages not the count of campaigns where this are enabled
    const totalSent = campaigns.length;
    let whatsappCount = 0;
    let smsCount = 0;
    let emailCount = 0;

    const response: CampaignAnalyticsResponse = {
      totalSent,
      whatsappCount,
      smsCount,
      emailCount,
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error("Failed to fetch campaign analytics:", error);
    return NextResponse.json(
      {
        error:
          sanitizeErrorMessage(error) || "Failed to fetch campaign analytics.",
        totalSent: 0,
        whatsappCount: 0,
        smsCount: 0,
        emailCount: 0,
      } satisfies CampaignAnalyticsResponse,
      { status: 500 },
    );
  }
});
