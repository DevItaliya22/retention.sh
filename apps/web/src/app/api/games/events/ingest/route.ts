import { withAdminAuth } from "@/lib/auth/middleware";
import { ingestGameEvents } from "@/lib/gamification/game-service";
import { gameEventIngestSchema } from "@/lib/schemas/games";
import {
  sanitizeErrorMessage,
  validateSchema,
} from "@/lib/utils/error-handler";
import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = gameEventIngestSchema.extend({
  campaignId: z.string().uuid(),
});

export const POST = withAdminAuth(async (request, context) => {
  try {
    const json = await request.json();
    const validation = validateSchema(bodySchema, json);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    const data = validation.data;
    const res = await ingestGameEvents({
      businessId: context.business.id,
      campaignId: data.campaignId,
      userId: context.user.id,
      requestId: request.headers.get("x-request-id"),
      events: data.events,
    });
    if (!res.ok) {
      return NextResponse.json({ error: res.error }, { status: 400 });
    }
    return NextResponse.json(res);
  } catch (error: unknown) {
    return NextResponse.json(
      { error: sanitizeErrorMessage(error) || "Ingest failed" },
      { status: 500 },
    );
  }
});
