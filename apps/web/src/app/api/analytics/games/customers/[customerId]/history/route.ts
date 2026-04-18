import { withAdminAuth } from "@/lib/auth/middleware";
import { sanitizeErrorMessage } from "@/lib/utils/error-handler";
import { db } from "@reelo/db";
import { NextResponse } from "next/server";

type Params = { customerId: string };

export const GET = withAdminAuth(async (_request, context, params: Params) => {
  try {
    const customerId =
      typeof params.customerId === "string"
        ? params.customerId
        : params.customerId?.[0];
    if (!customerId) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }
    const attempts = await db.gameAttempt.findMany({
      where: {
        businessId: context.business.id,
        customerId,
      },
      orderBy: { attemptAt: "desc" },
      take: 50,
      include: {
        allocation: true,
        campaign: { select: { id: true, name: true, type: true } },
      },
    });
    return NextResponse.json({ attempts });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: sanitizeErrorMessage(error) || "Failed" },
      { status: 500 },
    );
  }
});
