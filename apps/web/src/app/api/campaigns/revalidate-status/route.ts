import { withAdminAuth } from "@/lib/auth/middleware";
import { sanitizeErrorMessage } from "@/lib/utils/error-handler";
import { db } from "@reelo/db";
import { NextRequest, NextResponse } from "next/server";

export const POST = withAdminAuth(async (_request: NextRequest, context) => {
  try {
    const now = new Date();

    const result = await db.campaign.updateMany({
      where: {
        businessId: context.business.id,
        status: "ACTIVE",
        expiresAt: { lt: now },
      },
      data: {
        status: "EXPIRED",
      },
    });

    return NextResponse.json({
      updated: result.count,
      checkedAt: now.toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: sanitizeErrorMessage(error), updated: 0 },
      { status: 500 },
    );
  }
});
