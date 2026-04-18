import { withAdminAuth } from "@/lib/auth/middleware";
import { sanitizeErrorMessage } from "@/lib/utils/error-handler";
import { db } from "@reelo/db";
import { NextResponse } from "next/server";

type Params = { drawId: string };

export const GET = withAdminAuth(async (_request, context, params: Params) => {
  try {
    const drawId =
      typeof params.drawId === "string" ? params.drawId : params.drawId?.[0];
    if (!drawId)
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    const batch = await db.gameDrawBatch.findFirst({
      where: {
        id: drawId,
        campaign: { businessId: context.business.id },
      },
      include: {
        winners: { orderBy: { rank: "asc" } },
      },
    });
    if (!batch) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ batch });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: sanitizeErrorMessage(error) || "Failed" },
      { status: 500 },
    );
  }
});
