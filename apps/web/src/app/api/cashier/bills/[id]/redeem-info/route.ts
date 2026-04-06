import { withCashierAuth } from "@/lib/auth/middleware";
import { runTransaction } from "@/lib/db/transaction";
import { getPartnerRedeemableInfo, getRedeemableInfo } from "@/lib/loyalty";
import { sanitizeErrorMessage } from "@/lib/utils/error-handler";
import { parseFreeItems } from "@/lib/utils/free-items";
import { isServiceEnabled } from "@/lib/utils/service-enabled";
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
      const feedbackLink = await db.feedbackLink.findUnique({
        where: { billId: bill.id },
        select: { token: true },
      });
      const businessServiceFlags = await db.business.findUnique({
        where: { id: context.business.id },
        select: { isServiceEnabled: true },
      });
      const isFeedbackOn = isServiceEnabled(
        businessServiceFlags?.isServiceEnabled as
          | Record<string, boolean>
          | null
          | undefined,
        "feedback",
      );
      const isLoyaltyOn = isServiceEnabled(
        businessServiceFlags?.isServiceEnabled as
          | Record<string, boolean>
          | null
          | undefined,
        "loyalty",
      );
      const customerForLoyalty = await db.customer.findUnique({
        where: { id: bill.customerId },
        select: {
          user: {
            select: { phoneNumber: true },
          },
        },
      });
      const customerPhone = customerForLoyalty?.user?.phoneNumber ?? null;
      const baseUrl = process.env.NEXT_PUBLIC_URL || "https://dy.com";
      const feedbackUrl =
        isFeedbackOn && feedbackLink?.token
          ? `${baseUrl}/feedback/${context.business.slug}/${feedbackLink.token}`
          : null;
      const loyaltyLoginUrl =
        isLoyaltyOn && customerPhone
          ? `${baseUrl}/loyalty/${context.business.slug}/login?phone=${encodeURIComponent(customerPhone)}`
          : null;

      const alreadyCashbackRedeemedCount = await db.transaction.count({
        where: {
          billId: bill.id,
          type: "REDEEMED",
          valueKind: "CASHBACK",
          source: { not: "CAMPAIGN" },
        },
      });
      const alreadyRedeemedOnThisBill = alreadyCashbackRedeemedCount > 0;

      const earnedCountForBill = await db.transaction.count({
        where: {
          billId: bill.id,
          type: "EARNED",
          source: { not: "CAMPAIGN" },
        },
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

      const campaignRewardGiven = await db.transaction.count({
        where: {
          billId: bill.id,
          type: "EARNED",
          source: "CAMPAIGN",
          valueKind: { in: ["CASHBACK", "FREE_ITEM"] },
        },
      });

      const [
        txResult,
        earnedFromTransactions,
        redeemedFreeItemTxs,
        campaignEarnings,
      ] = await Promise.all([
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
              source: { not: "CAMPAIGN" },
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
              pointsEarned: pointsEarned > 0 ? Math.round(pointsEarned) : null,
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
        db.transaction
          .findMany({
            where: { billId: bill.id, source: "CAMPAIGN" },
            select: {
              type: true,
              valueKind: true,
              amount: true,
              metadata: true,
              campaignId: true,
              campaign: { select: { title: true, rewardType: true } },
            },
          })
          .then((txs) => {
            const grouped = new Map<
              string,
              {
                campaignId: string;
                campaignTitle: string | null;
                rewardType: string;
                earnedAmount: number;
                autoRedeemed: number;
                freeItemName: string | null;
              }
            >();
            for (const tx of txs) {
              if (!tx.campaignId) continue;
              let entry = grouped.get(tx.campaignId);
              if (!entry) {
                entry = {
                  campaignId: tx.campaignId,
                  campaignTitle: tx.campaign?.title ?? null,
                  rewardType: tx.campaign?.rewardType ?? "CASH_DISCOUNT",
                  earnedAmount: 0,
                  autoRedeemed: 0,
                  freeItemName: null,
                };
                grouped.set(tx.campaignId, entry);
              }
              if (tx.type === "EARNED" && tx.valueKind === "CASHBACK") {
                entry.earnedAmount += Math.max(0, tx.amount);
              } else if (
                tx.type === "REDEEMED" &&
                tx.valueKind === "CASHBACK"
              ) {
                entry.autoRedeemed += Math.abs(tx.amount);
              } else if (tx.type === "EARNED" && tx.valueKind === "FREE_ITEM") {
                entry.rewardType = "FREE_ITEM";
                const meta = tx.metadata as {
                  freeItemName?: string;
                } | null;
                entry.freeItemName = meta?.freeItemName ?? null;
              }
            }
            return Array.from(grouped.values());
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
      const loyaltyEarnBlockedByCampaign = campaignRewardGiven > 0;
      const pendingCashbackEarn =
        !loyaltyEarnBlockedByCampaign && earnNotYetApplied && isCashbackType
          ? (redeemInfoRaw?.earnablePoints ?? bill.cashbackAmount ?? 0)
          : 0;
      const pendingPointsEarn =
        !loyaltyEarnBlockedByCampaign && earnNotYetApplied && !isCashbackType
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
          campaignDiscountAmount: bill.campaignDiscountAmount ?? undefined,
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
        campaignEarnings:
          campaignEarnings.length > 0 ? campaignEarnings : undefined,
        feedbackUrl,
        loyaltyLoginUrl,
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
