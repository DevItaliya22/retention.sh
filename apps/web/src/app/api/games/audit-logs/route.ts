import { withAdminAuth } from "@/lib/auth/middleware";
import { sanitizeErrorMessage } from "@/lib/utils/error-handler";
import { db } from "@reelo/db";
import { NextResponse } from "next/server";

export const GET = withAdminAuth(async (request, context) => {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get("campaignId");
    const logs = await db.gameAuditLog.findMany({
      where: {
        businessId: context.business.id,
        ...(campaignId ? { campaignId } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return NextResponse.json({ logs });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: sanitizeErrorMessage(error) || "Failed" },
      { status: 500 },
    );
  }
});
