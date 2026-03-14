import { resolveAudiences } from "@/lib/audiences";
import { withAdminAuth } from "@/lib/auth/middleware";
import { sanitizeErrorMessage } from "@/lib/utils/error-handler";
import { NextRequest, NextResponse } from "next/server";

export const GET = withAdminAuth(async (request: NextRequest, context) => {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");

    if (!key || key.trim().length === 0) {
      return NextResponse.json({ count: 0 });
    }

    const keys = key
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);

    if (keys.length === 0) {
      return NextResponse.json({ count: 0 });
    }

    const customerIds = await resolveAudiences(context.business.id, keys);

    return NextResponse.json({ count: customerIds.length });
  } catch (error) {
    console.error("Audience preview error:", error);
    return NextResponse.json(
      { error: sanitizeErrorMessage(error), count: 0 },
      { status: 500 },
    );
  }
});
