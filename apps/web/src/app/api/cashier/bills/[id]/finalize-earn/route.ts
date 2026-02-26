import { finalizeBillEarn } from "@/lib/actions/loyalty";
import { withCashierAuth } from "@/lib/auth/middleware";
import { runTransaction } from "@/lib/db/transaction";
import { sanitizeErrorMessage } from "@/lib/utils/error-handler";
import { db } from "@reelo/db";
import { NextRequest, NextResponse } from "next/server";

/** POST: Apply deferred earn for this bill (when cashier clicks Create Another Bill). Idempotent. */
export const POST = withCashierAuth<{ id: string }>(
  async (request: NextRequest, context, params) => {
    try {
      const billId = params?.id;
      if (!billId) {
        return NextResponse.json(
          { error: "Bill ID required", applied: false },
          { status: 400 },
        );
      }

      const bill = await db.bill.findFirst({
        where: {
          id: billId,
          businessId: context.business.id,
        },
      });

      if (!bill) {
        return NextResponse.json(
          { error: "Bill not found", applied: false },
          { status: 404 },
        );
      }

      const result = await runTransaction(async (tx) =>
        finalizeBillEarn(tx, {
          businessId: context.business.id,
          customerId: bill.customerId,
          billId: bill.id,
          finalAmount: bill.finalAmount,
          billSubtotal: bill.subtotal,
          userPaidAmount: bill.userPaidAmount,
        }),
      );

      return NextResponse.json({
        applied: result.applied,
        cashbackAmount: result.cashbackAmount,
        earnedPoints: result.earnedPoints,
      });
    } catch (error: unknown) {
      console.error("Failed to finalize bill earn:", error);
      return NextResponse.json(
        {
          error:
            sanitizeErrorMessage(error) ||
            "Failed to finalize. Please try again.",
          applied: false,
        },
        { status: 500 },
      );
    }
  },
);
