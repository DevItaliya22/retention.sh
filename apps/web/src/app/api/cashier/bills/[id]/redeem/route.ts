import { applyRedemptionForBill } from "@/lib/actions/loyalty";
import { withCashierAuth } from "@/lib/auth/middleware";
import { runTransaction } from "@/lib/db/transaction";
import { getRedeemableInfo } from "@/lib/loyalty";
import {
  sanitizeErrorMessage,
  validateSchema,
} from "@/lib/utils/error-handler";
import { db } from "@reelo/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const redeemSchema = z.object({
  redeemCashback: z.coerce.number().min(0).optional(),
  redeemPoints: z.coerce.number().int().min(0).optional(),
  rewardStageId: z.string().uuid().optional().nullable(),
});

export const POST = withCashierAuth<{ id: string }>(
  async (request: NextRequest, context, params) => {
    try {
      const billId = params?.id;
      if (!billId) {
        return NextResponse.json(
          { error: "Bill ID required", bill: null },
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
          { error: "Bill not found", bill: null },
          { status: 404 },
        );
      }

      const body = await request.json();
      const validation = validateSchema(redeemSchema, body);
      if (!validation.success) {
        return NextResponse.json(
          { error: validation.error, bill: null },
          { status: 400 },
        );
      }

      const redeemCashback = Math.max(0, validation.data.redeemCashback ?? 0);
      const redeemPoints = Math.max(
        0,
        Math.floor(validation.data.redeemPoints ?? 0),
      );

      if (redeemCashback === 0 && redeemPoints === 0) {
        return NextResponse.json(
          { error: "Provide redeemCashback or redeemPoints", bill: null },
          { status: 400 },
        );
      }

      const currentAmountToPay = bill.userPaidAmount ?? bill.finalAmount ?? 0;

      const result = await runTransaction(async (tx) => {
        const redeemInfo = await getRedeemableInfo(tx, {
          businessId: context.business.id,
          customerId: bill.customerId,
          billAmount: currentAmountToPay,
          billSubtotal: bill.subtotal,
          cashbackEarnedThisBill: bill.cashbackAmount ?? 0,
        });

        if (!redeemInfo) {
          throw new Error("Loyalty not configured or customer not found");
        }

        const isCashbackType =
          redeemInfo.loyaltyType === "CASHBACK" ||
          redeemInfo.loyaltyType === "TIER";

        const requestedCashback = redeemCashback;
        const requestedPoints = !isCashbackType ? redeemPoints : 0;

        const maxCashback = isCashbackType
          ? Math.min(redeemInfo.maxRedeemable, redeemInfo.availableForRedeem)
          : (redeemInfo.maxRedeemableFromCashback ?? 0);
        const maxPoints = !isCashbackType
          ? (redeemInfo.maxRedeemableFromPoints ??
            redeemInfo.maxRedeemable ??
            0)
          : 0;

        if (requestedCashback > maxCashback) {
          throw new Error(
            `Cannot redeem more than ₹${maxCashback.toFixed(2)} cashback`,
          );
        }
        if (requestedPoints > maxPoints) {
          throw new Error(`Cannot redeem more than ${maxPoints} points`);
        }

        const loyalty = await applyRedemptionForBill(tx, {
          businessId: context.business.id,
          customerId: bill.customerId,
          billId: bill.id,
          billAmount: currentAmountToPay,
          billSubtotal: bill.subtotal,
          redeemCashbackRequested: requestedCashback,
          redeemPointsRequested: requestedPoints,
          rewardStageId: validation.data.rewardStageId ?? null,
          cashbackEarnedThisBill: bill.cashbackAmount ?? 0,
        });

        const newTotalRedeemed =
          (bill.cashbackRedeemedAmount ?? 0) +
          (loyalty.cashbackRedeemedAmount ?? 0);

        const updatedBill = await tx.bill.update({
          where: { id: bill.id },
          data: {
            cashbackRedeemedAmount: newTotalRedeemed,
            userPaidAmount: loyalty.finalAmount,
          },
        });

        return { bill: updatedBill, loyalty };
      });

      return NextResponse.json(result);
    } catch (error: unknown) {
      console.error("Failed to redeem on bill:", error);
      const msg =
        error instanceof Error
          ? error.message
          : sanitizeErrorMessage(error) || "Failed to redeem";
      return NextResponse.json({ error: msg, bill: null }, { status: 500 });
    }
  },
);
