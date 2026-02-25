import { withAdminAuth } from "@/lib/auth/middleware";
import { sanitizeErrorMessage } from "@/lib/utils/error-handler";
import { db } from "@reelo/db";
import { NextRequest, NextResponse } from "next/server";

export const GET = withAdminAuth(async (_request: NextRequest, context) => {
  try {
    const partnerships = await db.businessPartnership.findMany({
      where: {
        members: { some: { businessId: context.business.id } },
      },
      include: {
        members: {
          include: {
            business: { select: { id: true, name: true, slug: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ items: partnerships });
  } catch (error) {
    console.error("Partnerships GET error:", error);
    return NextResponse.json(
      { error: sanitizeErrorMessage(error), items: [] },
      { status: 500 },
    );
  }
});
