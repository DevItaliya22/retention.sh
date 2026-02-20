import { withCashierAuth } from "@/lib/auth/middleware";
import { sanitizeErrorMessage } from "@/lib/utils/error-handler";
import { db } from "@reelo/db";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/cashier/next-bill-number
 * Returns the next bill number for the cashier's business (for auto-filling the bill creation form).
 * Cashier auth required.
 */
export const GET = withCashierAuth(async (request: NextRequest, context) => {
  try {
    const business = await db.business.findUnique({
      where: { id: context.business.id },
      select: { nextBillNumber: true },
    });

    if (!business) {
      return NextResponse.json(
        { error: "Business not found", nextBillNumber: 1 },
        { status: 404 },
      );
    }

    const nextBillNumber = business.nextBillNumber ?? 1;

    return NextResponse.json({ nextBillNumber });
  } catch (error: unknown) {
    console.error("Failed to fetch next bill number:", error);
    return NextResponse.json(
      {
        error:
          sanitizeErrorMessage(error) ||
          "Failed to fetch next bill number. Please try again.",
        nextBillNumber: 1,
      },
      { status: 500 },
    );
  }
});
