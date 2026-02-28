import {
  applyCashbackRedemptionForBill,
  applyPartnerRedemptionForBill,
  convertPointsForBill,
} from "@/lib/actions/loyalty";
import { withCashierAuth } from "@/lib/auth/middleware";
import { runTransaction } from "@/lib/db/transaction";
import {
  getRedeemableInfo,
  sumCashbackEarnedFromTransactions,
} from "@/lib/loyalty";
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
  /** Apply partner balance: partner business id. */
  redeemFromPartnerBusinessId: z.string().uuid().optional().nullable(),
  /** Partner CASHBACK/TIER: ₹ to redeem at partner. */
  redeemPartnerCashback: z.coerce.number().min(0).optional(),
  /** Partner AMOUNT_SPENT/VISIT_MADE: points to redeem. */
  redeemPartnerPoints: z.coerce.number().int().min(0).optional(),
});

const billRedeemInclude = {
  transactions: {
    where: { type: "EARNED" as const, valueKind: "CASHBACK" as const },
    select: { type: true, valueKind: true, amount: true },
  },
};

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
        include: billRedeemInclude,
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
      const redeemFromPartnerBusinessId =
        validation.data.redeemFromPartnerBusinessId ?? null;
      const redeemPartnerCashback = Math.max(
        0,
        validation.data.redeemPartnerCashback ?? 0,
      );
      const redeemPartnerPoints = Math.max(
        0,
        Math.floor(validation.data.redeemPartnerPoints ?? 0),
      );
      const currentAmountToPay = bill.userPaidAmount ?? bill.finalAmount ?? 0;

      const wantsPartner =
        redeemFromPartnerBusinessId &&
        (redeemPartnerCashback > 0 || redeemPartnerPoints > 0);
      if (!rewardStageId && redeemCashback === 0 && !wantsPartner) {
        return NextResponse.json(
          {
            error:
              "Provide rewardStageId (convert points), redeemCashback (apply to bill), or partner redemption",
            bill: null,
          },
          { status: 400 },
        );
      }

      const hasOurStoreRedemption = (bill.cashbackRedeemedAmount ?? 0) > 0;
      const hasPartnerRedemption = (bill.partnerRedeemedAmount ?? 0) > 0;
      if (redeemCashback > 0 && hasPartnerRedemption) {
        return NextResponse.json(
          {
            error:
              "This bill already used partner balance. Only one type of redemption (your store or partner) is allowed per bill.",
            bill: null,
          },
          { status: 400 },
        );
      }
      if (wantsPartner && hasOurStoreRedemption) {
        return NextResponse.json(
          {
            error:
              "This bill already used balance at this store. Only one type of redemption (your store or partner) is allowed per bill.",
            bill: null,
          },
          { status: 400 },
        );
      }

      const cashbackEarnedThisBill = sumCashbackEarnedFromTransactions(
        bill.transactions,
      );

      const result = await runTransaction(async (tx) => {
        const redeemInfo = await getRedeemableInfo(tx, {
          businessId: context.business.id,
          customerId: bill.customerId,
          billAmount: currentAmountToPay,
          billSubtotal: bill.subtotal,
          cashbackEarnedThisBill:
            cashbackEarnedThisBill > 0
              ? cashbackEarnedThisBill
              : (bill.cashbackAmount ?? 0),
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
            include: billRedeemInclude,
          });
        }

        // 3) Apply partner redemption (one partner per bill; deduct from partner wallet, discount on this bill).
        if (wantsPartner && redeemFromPartnerBusinessId) {
          const existingPartnerId = billToReturn.redeemedFromPartnerBusinessId;
          if (
            existingPartnerId != null &&
            existingPartnerId !== redeemFromPartnerBusinessId
          ) {
            throw new Error(
              "One bill can only use one partner. This bill has already used another partner.",
            );
          }
          const partnerDiscount = await applyPartnerRedemptionForBill(tx, {
            currentBusinessId: context.business.id,
            customerId: bill.customerId,
            billId: bill.id,
            partnerBusinessId: redeemFromPartnerBusinessId,
            redeemPartnerCashback:
              redeemPartnerCashback > 0 ? redeemPartnerCashback : undefined,
            redeemPartnerPoints:
              redeemPartnerPoints > 0 ? redeemPartnerPoints : undefined,
          });
          const currentUserPaid =
            billToReturn.userPaidAmount ?? billToReturn.finalAmount ?? 0;
          const existingPartner = billToReturn.partnerRedeemedAmount ?? 0;
          billToReturn = await tx.bill.update({
            where: { id: bill.id },
            data: {
              partnerRedeemedAmount: existingPartner + partnerDiscount,
              redeemedFromPartnerBusinessId:
                existingPartnerId ?? redeemFromPartnerBusinessId,
              userPaidAmount: Math.max(
                0,
                Math.floor((currentUserPaid - partnerDiscount) * 100) / 100,
              ),
            },
            include: billRedeemInclude,
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
      const status = msg.includes("One bill can only use one partner")
        ? 400
        : 500;
      return NextResponse.json({ error: msg, bill: null }, { status });
    }
  },
);
