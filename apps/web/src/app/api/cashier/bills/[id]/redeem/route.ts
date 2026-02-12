import {
  applyCashbackRedemptionForBill,
  convertPointsForBill,
} from "@/lib/actions/loyalty";
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
  /** Convert points to cashback or free item (AMOUNT_SPENT/VISIT_MADE). Does not apply to bill. */
  rewardStageId: z.string().uuid().optional().nullable(),
  /** Apply this much wallet cashback as discount on the bill. One cashback redemption per bill. */
  redeemCashback: z.coerce.number().min(0).optional(),
  /** For convert: points to use (must match stage.pointsRequired). */
  redeemPoints: z.coerce.number().int().min(0).optional(),
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

      const rewardStageId = validation.data.rewardStageId ?? null;
      const redeemCashback = Math.max(0, validation.data.redeemCashback ?? 0);
      const currentAmountToPay = bill.userPaidAmount ?? bill.finalAmount ?? 0;

      if (!rewardStageId && redeemCashback === 0) {
        return NextResponse.json(
          {
            error:
              "Provide rewardStageId (convert points) or redeemCashback (apply to bill)",
            bill: null,
          },
          { status: 400 },
        );
      }

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

        let billToReturn = bill;
        let convertResult: {
          pointsBalance: number;
          cashbackBalance: number;
          redeemedFreeItems?: Array<{
            rewardName: string;
            freeItemName: string | null;
          }>;
        } | null = null;

        // 1) Convert points → cashback or free item (AMOUNT_SPENT/VISIT_MADE only). Does not change bill.
        if (rewardStageId && !isCashbackType) {
          convertResult = await convertPointsForBill(tx, {
            businessId: context.business.id,
            customerId: bill.customerId,
            billId: bill.id,
            billAmount: currentAmountToPay,
            rewardStageId,
          });
        }

        // 2) Apply cashback to bill (all types). One cashback redemption per bill.
        if (redeemCashback > 0) {
          const availableCashbackForBill =
            convertResult != null
              ? convertResult.cashbackBalance
              : isCashbackType
                ? redeemInfo.availableForRedeem
                : (redeemInfo.cashbackBalance ?? 0);
          const maxCashback = isCashbackType
            ? Math.min(redeemInfo.maxRedeemable, redeemInfo.availableForRedeem)
            : Math.min(
                availableCashbackForBill,
                Math.floor(currentAmountToPay * 100) / 100,
              );
          const capped = Math.min(
            redeemCashback,
            maxCashback,
            currentAmountToPay,
          );
          if (capped <= 0) {
            throw new Error(
              `Cannot redeem cashback on this bill. Max: ₹${Math.min(maxCashback, currentAmountToPay).toFixed(2)}`,
            );
          }

          const loyalty = await tx.loyalty.findUnique({
            where: { businessId: context.business.id },
            select: { id: true },
          });

          const { finalAmount, cashbackRedeemedAmount } =
            await applyCashbackRedemptionForBill(tx, {
              businessId: context.business.id,
              customerId: bill.customerId,
              billId: bill.id,
              billAmount: currentAmountToPay,
              redeemCashbackRequested: capped,
              loyaltyId: loyalty?.id ?? null,
            });

          const newTotalRedeemed =
            (bill.cashbackRedeemedAmount ?? 0) + cashbackRedeemedAmount;

          billToReturn = await tx.bill.update({
            where: { id: bill.id },
            data: {
              cashbackRedeemedAmount: newTotalRedeemed,
              userPaidAmount: finalAmount,
            },
          });
        }

        return {
          bill: billToReturn,
          loyalty: null,
          convert: convertResult ?? undefined,
        };
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
