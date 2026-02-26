import { withCashierAuth } from "@/lib/auth/middleware";
import { runTransaction } from "@/lib/db/transaction";
import { getPartnerRedeemableInfo, getRedeemableInfo } from "@/lib/loyalty";
import { sanitizeErrorMessage } from "@/lib/utils/error-handler";
import { parseFreeItems } from "@/lib/utils/free-items";
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

      // "Already redeemed" = cashback has been applied to this bill (one cashback redemption per bill)
      const alreadyCashbackRedeemedCount = await db.transaction.count({
        where: {
          billId: bill.id,
          type: "REDEEMED",
          valueKind: "CASHBACK",
        },
      });
      const alreadyRedeemedOnThisBill = alreadyCashbackRedeemedCount > 0;

      // Deferred earn: no EARNED tx yet for this bill → earn will be applied on "Create Another Bill"
      const earnedCountForBill = await db.transaction.count({
        where: { billId: bill.id, type: "EARNED" },
      });
      const earnNotYetApplied = earnedCountForBill === 0;

      const wallet = await db.wallet.findUnique({
        where: {
          businessId_customerId: {
            businessId: context.business.id,
            customerId: bill.customerId,
          },
        },
      });
      const freeItems = parseFreeItems(wallet?.freeItems);

      const [txResult, earnedFromTransactions, redeemedFreeItemTxs] =
        await Promise.all([
          runTransaction(async (tx) => {
            const redeemInfo = await getRedeemableInfo(tx, {
              businessId: context.business.id,
              customerId: bill.customerId,
              billAmount: currentAmountToPay,
              billSubtotal: bill.subtotal,
              cashbackEarnedThisBill: earnNotYetApplied
                ? 0
                : (bill.cashbackAmount ?? 0),
            });
            const partnerRedeemable = await getPartnerRedeemableInfo(tx, {
              currentBusinessId: context.business.id,
              customerId: bill.customerId,
              billAmount: currentAmountToPay,
            });
            return { redeemInfo, partnerRedeemable };
          }),
          db.transaction
            .findMany({
              where: {
                billId: bill.id,
                type: "EARNED",
              },
              select: { valueKind: true, amount: true },
            })
            .then((txs) => {
              const cashbackEarned = txs
                .filter((t) => t.valueKind === "CASHBACK")
                .reduce((s, t) => s + Math.max(0, t.amount), 0);
              const pointsEarned = txs
                .filter(
                  (t) =>
                    t.valueKind === "AMOUNT_SPENT_POINTS" ||
                    t.valueKind === "VISIT_POINTS",
                )
                .reduce((s, t) => s + Math.max(0, t.amount), 0);
              return {
                cashbackEarned: cashbackEarned > 0 ? cashbackEarned : null,
                pointsEarned:
                  pointsEarned > 0 ? Math.round(pointsEarned) : null,
              };
            }),
          db.transaction.findMany({
            where: {
              billId: bill.id,
              type: "REDEEMED",
              valueKind: { in: ["AMOUNT_SPENT_POINTS", "VISIT_POINTS"] },
            },
            select: { metadata: true },
          }),
        ]);

      const redeemedFreeItems = redeemedFreeItemTxs
        .map(
          (t) =>
            t.metadata as {
              rewardType?: string;
              rewardName?: string;
              freeItemName?: string | null;
            } | null,
        )
        .filter(
          (
            m,
          ): m is {
            rewardType: string;
            rewardName: string;
            freeItemName?: string | null;
          } =>
            m != null &&
            typeof m === "object" &&
            m.rewardType === "FREE_ITEM" &&
            typeof m.rewardName === "string",
        )
        .map((m) => ({
          rewardName: m.rewardName,
          freeItemName: m.freeItemName ?? null,
        }));

      const redeemInfoRaw = txResult.redeemInfo;
      const partnerRedeemable = txResult.partnerRedeemable ?? [];

      const redeemInfo = redeemInfoRaw
        ? alreadyRedeemedOnThisBill
          ? {
              ...redeemInfoRaw,
              maxRedeemable: 0,
              maxRedeemableFromCashback: 0,
              maxRedeemableFromPoints: 0,
              availableForRedeem: redeemInfoRaw.availableForRedeem,
              alreadyRedeemedOnThisBill: true as const,
            }
          : { ...redeemInfoRaw, alreadyRedeemedOnThisBill: false as const }
        : null;

      const isCashbackType =
        redeemInfoRaw?.loyaltyType === "CASHBACK" ||
        redeemInfoRaw?.loyaltyType === "TIER";
      const pendingCashbackEarn =
        earnNotYetApplied && isCashbackType
          ? (redeemInfoRaw?.earnablePoints ?? bill.cashbackAmount ?? 0)
          : 0;
      const pendingPointsEarn =
        earnNotYetApplied && !isCashbackType
          ? Math.max(0, redeemInfoRaw?.earnablePoints ?? 0)
          : 0;

      return NextResponse.json({
        bill: {
          id: bill.id,
          billNumber: bill.billNumber,
          finalAmount: bill.finalAmount,
          userPaidAmount: bill.userPaidAmount,
          cashbackAmount: bill.cashbackAmount,
          cashbackRedeemedAmount: bill.cashbackRedeemedAmount,
          partnerRedeemedAmount: bill.partnerRedeemedAmount ?? undefined,
          redeemedFromPartnerBusinessId:
            bill.redeemedFromPartnerBusinessId ?? undefined,
          earnedCashback: earnNotYetApplied
            ? pendingCashbackEarn
            : (earnedFromTransactions.cashbackEarned ??
              bill.cashbackAmount ??
              0),
          earnedPoints: earnNotYetApplied
            ? pendingPointsEarn
            : (earnedFromTransactions.pointsEarned ?? 0),
          earnNotYetApplied,
          pendingCashbackEarn: earnNotYetApplied
            ? pendingCashbackEarn
            : undefined,
          pendingPointsEarn: earnNotYetApplied ? pendingPointsEarn : undefined,
          redeemedFreeItems:
            redeemedFreeItems.length > 0 ? redeemedFreeItems : undefined,
        },
        redeemInfo,
        partnerRedeemable,
        freeItems,
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
