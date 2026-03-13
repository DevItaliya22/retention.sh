import { withAdminAuth } from "@/lib/auth/middleware";
import { sanitizeErrorMessage } from "@/lib/utils/error-handler";
import { db } from "@reelo/db";
import { NextRequest, NextResponse } from "next/server";

export const GET = withAdminAuth(async (_request: NextRequest, context) => {
  try {
    const logs = await db.partnershipEventLog.findMany({
      where: {
        partnership: {
          members: { some: { businessId: context.business.id } },
        },
      },
      include: {
        actorBusiness: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    return NextResponse.json({ items: logs });
  } catch (error) {
    console.error("Partnership all-logs GET error:", error);
    return NextResponse.json(
      { error: sanitizeErrorMessage(error), items: [] },
      { status: 500 },
    );
  }
});
