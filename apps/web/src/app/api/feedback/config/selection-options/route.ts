import { withAdminAuth } from "@/lib/auth/middleware";
import { feedbackSelectionOptionCreateSchema } from "@/lib/schemas/feedback";
import {
  sanitizeErrorMessage,
  validateSchema,
} from "@/lib/utils/error-handler";
import { db } from "@reelo/db";
import { NextRequest, NextResponse } from "next/server";

/** GET: list selection options for the current business's feedback config (ordered by seq). */
export const GET = withAdminAuth(async (_request, context) => {
  try {
    const businessId = context.business.id;
    const config = await db.feedbackConfig.findUnique({
      where: { businessId },
      select: {
        selectionOptions: { orderBy: { seq: "asc" } },
      },
    });
    const items = config?.selectionOptions ?? [];
    return NextResponse.json({ items });
  } catch (error: unknown) {
    console.error("Failed to list feedback selection options:", error);
    return NextResponse.json(
      {
        items: [],
        error:
          sanitizeErrorMessage(error) ||
          "Failed to list feedback selection options",
      },
      { status: 500 },
    );
  }
});

/** POST: create a new selection option. */
export const POST = withAdminAuth(async (request: NextRequest, context) => {
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
          option: null,
        },
        { status: 400 },
      );
    }

    const body = await request.json();
    const validation = validateSchema(
      feedbackSelectionOptionCreateSchema,
      body,
    );
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error, option: null },
        { status: 400 },
      );
    }

    const { label, seq } = validation.data;
    const nextSeq =
      seq ??
      (await db.feedbackSelectionOption.count({
        where: { configId: config.id },
      })) ??
      0;

    const option = await db.feedbackSelectionOption.create({
      data: {
        configId: config.id,
        label: label.trim(),
        seq: nextSeq,
      },
    });
    return NextResponse.json({ option });
  } catch (error: unknown) {
    console.error("Failed to create feedback selection option:", error);
    return NextResponse.json(
      {
        error:
          sanitizeErrorMessage(error) ||
          "Failed to create feedback selection option",
        option: null,
      },
      { status: 500 },
    );
  }
});
