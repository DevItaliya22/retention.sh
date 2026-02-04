import { expireBucketsForBusiness } from "@/lib/loyalty";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const secret = process.env.LOYALTY_CRON_SECRET;
    const header = request.headers.get("x-cron-secret");

    if (!secret || header !== secret) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const result = await expireBucketsForBusiness({});

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("Failed to run loyalty expiry:", error);
    return NextResponse.json(
      { success: false, error: "Failed to run expiry" },
      { status: 500 },
    );
  }
}
