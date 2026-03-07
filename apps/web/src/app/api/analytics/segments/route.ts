import { withAdminAuth } from "@/lib/auth/middleware";
import { getSegmentsOverview } from "@/lib/segmentation";
import { sanitizeErrorMessage } from "@/lib/utils/error-handler";
import { NextRequest, NextResponse } from "next/server";

export const GET = withAdminAuth(async (_request: NextRequest, context) => {
  try {
    const businessId = context.business.id;
    const result = await getSegmentsOverview(businessId);
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("Failed to fetch segments overview:", error);
    return NextResponse.json(
      {
        error:
          sanitizeErrorMessage(error) || "Failed to fetch segments overview.",
        totalCustomers: 0,
        segments: [],
      },
      { status: 500 },
    );
  }
});
