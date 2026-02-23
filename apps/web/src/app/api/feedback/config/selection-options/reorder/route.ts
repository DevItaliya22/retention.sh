import { withAdminAuth } from "@/lib/auth/middleware";
import { feedbackSelectionOptionReorderSchema } from "@/lib/schemas/feedback";
import {
  sanitizeErrorMessage,
  validateSchema,
} from "@/lib/utils/error-handler";
import { db } from "@reelo/db";
import { NextRequest, NextResponse } from "next/server";

/** PUT: reorder selection options by setting seq from orderedIds index. */
export const PUT = withAdminAuth(async (request: NextRequest, context) => {
  try {
    const businessId = context.business.id;
    const config = await db.feedbackConfig.findUnique({
      where: { businessId },
      select: { id: true },
    });
    if (!config) {
      return NextResponse.json(
        {
          error: "Feedback config not found. Save feedback settings first.",
        },
        { status: 400 },
      );
    }

    const body = await request.json();
    const validation = validateSchema(
      feedbackSelectionOptionReorderSchema,
      body,
    );
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { orderedIds } = validation.data;
    if (orderedIds.length === 0) {
      return NextResponse.json({ ok: true });
    }

    await db.$transaction(async (tx) => {
      for (let i = 0; i < orderedIds.length; i++) {
        await tx.feedbackSelectionOption.updateMany({
          where: { id: orderedIds[i], configId: config.id },
          data: { seq: i },
        });
      }
    });
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    console.error("Failed to reorder feedback selection options:", error);
    return NextResponse.json(
      {
        error:
          sanitizeErrorMessage(error) ||
          "Failed to reorder feedback selection options",
      },
      { status: 500 },
    );
  }
});
