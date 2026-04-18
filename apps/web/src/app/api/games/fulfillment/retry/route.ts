import { withAdminAuth } from "@/lib/auth/middleware";
import { logGameAudit } from "@/lib/gamification/audit";
import {
  sanitizeErrorMessage,
  validateSchema,
} from "@/lib/utils/error-handler";
import { db } from "@reelo/db";
import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  allocationId: z.string().uuid(),
});

export const POST = withAdminAuth(async (request, context) => {
  try {
    const validation = validateSchema(bodySchema, await request.json());
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    const allocation = await db.gameAllocation.findFirst({
      where: {
        id: validation.data.allocationId,
        attempt: { businessId: context.business.id },
      },
      include: {
        fulfillment: true,
        attempt: { select: { campaignId: true } },
      },
    });
    if (!allocation?.fulfillment) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    await db.gameFulfillment.update({
      where: { id: allocation.fulfillment.id },
      data: {
        status: "PENDING",
        failureReason: null,
        fulfilledAt: null,
      },
    });
    await logGameAudit({
      businessId: context.business.id,
      campaignId: allocation.attempt.campaignId,
      actorUserId: context.user.id,
      action: "GAME_FULFILLMENT_RETRY",
      afterJson: { allocationId: allocation.id },
    });
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: sanitizeErrorMessage(error) || "Retry failed" },
      { status: 500 },
    );
  }
});
