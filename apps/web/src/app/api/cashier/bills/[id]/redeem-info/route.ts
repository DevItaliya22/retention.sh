import { withCashierAuth } from "@/lib/auth/middleware";
import { runTransaction } from "@/lib/db/transaction";
import { getRedeemableInfo } from "@/lib/loyalty";
import { sanitizeErrorMessage } from "@/lib/utils/error-handler";
import { db } from "@reelo/db";
import { NextRequest, NextResponse } from "next/server";

/** GET redeem options for a bill. Used on bill-created view. */
export const GET = withCashierAuth<{ id: string }>(
  async (request: NextRequest, context, params) => {
    try {
      const billId = params?.id;
      if (!billId) {
        return NextResponse.json(
          { error: "Bill ID required", redeemInfo: null },
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
          { error: "Bill not found", redeemInfo: null },
          { status: 404 },
        );
      }

      const currentAmountToPay = bill.userPaidAmount ?? bill.finalAmount ?? 0;

      const redeemInfo = await runTransaction(async (tx) =>
        getRedeemableInfo(tx, {
          businessId: context.business.id,
          customerId: bill.customerId,
          billAmount: currentAmountToPay,
          billSubtotal: bill.subtotal,
          cashbackEarnedThisBill: bill.cashbackAmount ?? 0,
        }),
      );

      return NextResponse.json({
        bill: {
          id: bill.id,
          billNumber: bill.billNumber,
          finalAmount: bill.finalAmount,
          userPaidAmount: bill.userPaidAmount,
          cashbackAmount: bill.cashbackAmount,
          cashbackRedeemedAmount: bill.cashbackRedeemedAmount,
        },
        redeemInfo,
      });
    } catch (error: unknown) {
      console.error("Failed to fetch redeem info:", error);
      return NextResponse.json(
        {
          redeemInfo: null,
          error:
            sanitizeErrorMessage(error) || "Failed to fetch redeem options",
        },
        { status: 500 },
      );
    }
  },
);
