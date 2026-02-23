import { withAdminAuth } from "@/lib/auth/middleware";
import { feedbackSelectionOptionUpdateSchema } from "@/lib/schemas/feedback";
import {
  sanitizeErrorMessage,
  validateSchema,
} from "@/lib/utils/error-handler";
import { db } from "@reelo/db";
import { NextRequest, NextResponse } from "next/server";

async function getConfigAndOption(businessId: string, optionId: string) {
  const config = await db.feedbackConfig.findUnique({
    where: { businessId },
    select: { id: true },
  });
  if (!config) return { config: null, option: null };
  const option = await db.feedbackSelectionOption.findFirst({
    where: { id: optionId, configId: config.id },
  });
  return { config, option };
}

/** PATCH: update label and/or seq of a selection option. */
export const PATCH = withAdminAuth<{ id: string }>(
  async (request: NextRequest, context, params) => {
    try {
      const id = params.id as string;
      const businessId = context.business.id;
      const { config, option } = await getConfigAndOption(businessId, id);
      if (!config || !option) {
        return NextResponse.json(
          { error: "Selection option not found", option: null },
          { status: 404 },
        );
      }

      const body = await request.json();
      const validation = validateSchema(
        feedbackSelectionOptionUpdateSchema,
        body,
      );
      if (!validation.success) {
        return NextResponse.json(
          { error: validation.error, option: null },
          { status: 400 },
        );
      }

      const updateData: { label?: string; seq?: number } = {};
      if (validation.data.label !== undefined)
        updateData.label = validation.data.label.trim();
      if (validation.data.seq !== undefined)
        updateData.seq = validation.data.seq;

      const updated = await db.feedbackSelectionOption.update({
        where: { id },
        data: updateData,
      });
      return NextResponse.json({ option: updated });
    } catch (error: unknown) {
      console.error("Failed to update feedback selection option:", error);
      return NextResponse.json(
        {
          error:
            sanitizeErrorMessage(error) ||
            "Failed to update feedback selection option",
          option: null,
        },
        { status: 500 },
      );
    }
  },
);

/** DELETE: remove a selection option. */
export const DELETE = withAdminAuth<{ id: string }>(
  async (_request: NextRequest, context, params) => {
    try {
      const id = params.id as string;
      const businessId = context.business.id;
      const { config, option } = await getConfigAndOption(businessId, id);
      if (!config || !option) {
        return NextResponse.json(
          { error: "Selection option not found" },
          { status: 404 },
        );
      }

      await db.feedbackSelectionOption.delete({ where: { id } });
      return NextResponse.json({ ok: true });
    } catch (error: unknown) {
      console.error("Failed to delete feedback selection option:", error);
      return NextResponse.json(
        {
          error:
            sanitizeErrorMessage(error) ||
            "Failed to delete feedback selection option",
        },
        { status: 500 },
      );
    }
  },
);
