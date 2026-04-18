import { withAdminAuth } from "@/lib/auth/middleware";
import { runLotteryDrawBatch } from "@/lib/gamification/lottery-draw";
import {
  sanitizeErrorMessage,
  validateSchema,
} from "@/lib/utils/error-handler";
import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  drawBatchId: z.string().uuid(),
});

export const POST = withAdminAuth(async (request, context) => {
  try {
    const validation = validateSchema(bodySchema, await request.json());
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    const res = await runLotteryDrawBatch({
      drawBatchId: validation.data.drawBatchId,
      businessId: context.business.id,
      actorUserId: context.user.id,
    });
    if (!res.ok) {
      return NextResponse.json({ error: res.error }, { status: 400 });
    }
    return NextResponse.json(res);
  } catch (error: unknown) {
    return NextResponse.json(
      { error: sanitizeErrorMessage(error) || "Draw failed" },
      { status: 500 },
    );
  }
});
