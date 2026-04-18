import { withAdminAuth } from "@/lib/auth/middleware";
import { logGameAudit } from "@/lib/gamification/audit";
import {
  sanitizeErrorMessage,
  validateSchema,
} from "@/lib/utils/error-handler";
import { db } from "@reelo/db";
import { NextResponse } from "next/server";
import { z } from "zod";

type Params = { id: string };

/** Caps stored on distribution policy (`maxWinnersTotal`) and eligibility (`globalAttemptCap`). */
const bodySchema = z.object({
  maxWinnersTotal: z.number().int().positive().optional().nullable(),
  globalAttemptCap: z.number().int().positive().optional().nullable(),
});

export const PUT = withAdminAuth(async (request, context, params: Params) => {
  try {
    const id = typeof params.id === "string" ? params.id : params.id?.[0];
    if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    const validation = validateSchema(bodySchema, await request.json());
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    const { maxWinnersTotal, globalAttemptCap } = validation.data;

    await db.$transaction(async (tx) => {
      if (maxWinnersTotal !== undefined) {
        await tx.gameDistributionPolicy.updateMany({
          where: { campaignId: id },
          data: { maxWinnersTotal },
        });
      }
      if (globalAttemptCap !== undefined) {
        await tx.gameEligibilityRule.updateMany({
          where: { campaignId: id },
          data: { globalAttemptCap },
        });
      }
    });

    await logGameAudit({
      businessId: context.business.id,
      campaignId: id,
      actorUserId: context.user.id,
      action: "GAME_LIMITS_UPDATE",
      afterJson: validation.data,
    });

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: sanitizeErrorMessage(error) || "Update failed" },
      { status: 500 },
    );
  }
});
