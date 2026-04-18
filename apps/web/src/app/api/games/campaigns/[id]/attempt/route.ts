import { withAdminAuth } from "@/lib/auth/middleware";
import { recordGameAttempt } from "@/lib/gamification/game-service";
import { gameAttemptSchema } from "@/lib/schemas/games";
import {
  sanitizeErrorMessage,
  validateSchema,
} from "@/lib/utils/error-handler";
import { NextResponse } from "next/server";

type Params = { id: string };

export const POST = withAdminAuth(async (request, context, params: Params) => {
  try {
    const campaignId =
      typeof params.id === "string" ? params.id : params.id?.[0];
    if (!campaignId) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }
    const json = await request.json();
    const validation = validateSchema(gameAttemptSchema, json);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    const d = validation.data;
    const res = await recordGameAttempt({
      businessId: context.business.id,
      campaignId,
      customerId: d.customerId,
      userId: context.user.id,
      triggerEventType: d.triggerEventType,
      triggerEventId: d.triggerEventId,
      billId: d.billId,
      idempotencyKey: d.idempotencyKey,
      requestId: request.headers.get("x-request-id"),
    });
    if (!res.ok) {
      const status = "status" in res ? res.status : 500;
      return NextResponse.json(
        { error: "error" in res ? res.error : "Failed" },
        { status },
      );
    }
    return NextResponse.json({
      deduped: "deduped" in res ? res.deduped : false,
      attemptId: res.attemptId,
      allocation: res.allocation,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: sanitizeErrorMessage(error) || "Attempt failed" },
      { status: 500 },
    );
  }
});
