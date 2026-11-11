import { withAdminAuth } from "@/lib/auth/middleware";
import { sanitizeErrorMessage } from "@/lib/utils/error-handler";
import { db } from "@reelo/db";
import { NextResponse } from "next/server";

type Params = { attemptId: string };

export const GET = withAdminAuth(async (_request, context, params: Params) => {
  try {
    const attemptId =
      typeof params.attemptId === "string"
        ? params.attemptId
        : params.attemptId?.[0];
    if (!attemptId) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }
    const attempt = await db.gameAttempt.findFirst({
      where: {
        id: attemptId,
        businessId: context.business.id,
      },
      include: {
        allocation: { include: { fulfillment: true } },
        campaign: { select: { id: true, name: true, type: true } },
      },
    });
    if (!attempt) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ attempt });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: sanitizeErrorMessage(error) || "Failed" },
      { status: 500 },
    );
  }
});
