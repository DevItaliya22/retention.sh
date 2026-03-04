import { withCashierAuth } from "@/lib/auth/middleware";
import {
  sanitizeErrorMessage,
  validateSchema,
} from "@/lib/utils/error-handler";
import { parseFreeItems } from "@/lib/utils/free-items";
import {
  db,
  TransactionSource,
  TransactionType,
  TransactionValueKind,
} from "@reelo/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const claimFreeItemSchema = z.object({
  freeItemId: z.string().uuid("Invalid free item ID"),
});

/** POST: claim one free item (remove from wallet). Called from bill-created view after bill creation. */
export const POST = withCashierAuth<{ id: string }>(
  async (request: NextRequest, context, params) => {
    try {
      const billId = params?.id;
      if (!billId) {
        return NextResponse.json(
          { error: "Bill ID required", success: false },
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
          { error: "Bill not found", success: false },
          { status: 404 },
        );
      }

      const body = await request.json();
      const validation = validateSchema(claimFreeItemSchema, body);
      if (!validation.success) {
        return NextResponse.json(
          { error: validation.error, success: false },
          { status: 400 },
        );
      }

      const { freeItemId } = validation.data;

      const wallet = await db.wallet.findUnique({
        where: {
          businessId_customerId: {
            businessId: context.business.id,
            customerId: bill.customerId,
          },
        },
      });

      if (!wallet) {
        return NextResponse.json(
          { error: "Wallet not found", success: false },
          { status: 404 },
        );
      }

      const currentFreeItems = parseFreeItems(wallet.freeItems);
      const claimedItem = currentFreeItems.find(
        (item) => item.id === freeItemId,
      );

      if (!claimedItem) {
        return NextResponse.json(
          { error: "Free item not found or already claimed", success: false },
          { status: 404 },
        );
      }

      if (claimedItem.source === "CAMPAIGN" && claimedItem.sourceId) {
        const campaign = await db.campaign.findUnique({
          where: { id: claimedItem.sourceId },
          select: {
            minPurchaseForRedemptionEnabled: true,
            minPurchaseForRedemption: true,
          },
        });
        if (
          campaign?.minPurchaseForRedemptionEnabled &&
          campaign.minPurchaseForRedemption != null &&
          (bill.finalAmount ?? 0) < campaign.minPurchaseForRedemption
        ) {
          return NextResponse.json(
            {
              error: `Minimum bill of ₹${campaign.minPurchaseForRedemption} is required to claim this free item.`,
              success: false,
            },
            { status: 400 },
          );
        }
      }

      const remaining = currentFreeItems.filter(
        (item) => item.id !== freeItemId,
      );

      const updatedFreeItems = remaining.map((item) => ({
        id: item.id,
        skuId: item.skuId,
        skuName: item.skuName,
        source: item.source,
        sourceId: item.sourceId ?? null,
        expiresAt: item.expiresAt ?? null,
        createdAt: item.createdAt,
      }));

      const isCampaignSource = claimedItem.source === "CAMPAIGN";
      const txSource = isCampaignSource
        ? TransactionSource.CAMPAIGN
        : claimedItem.source === "REFERRAL"
          ? TransactionSource.REFERRAL
          : TransactionSource.BILL;

      await db.$transaction([
        db.wallet.update({
          where: {
            businessId_customerId: {
              businessId: context.business.id,
              customerId: bill.customerId,
            },
          },
          data: { freeItems: updatedFreeItems as any },
        }),
        db.transaction.create({
          data: {
            businessId: context.business.id,
            customerId: bill.customerId,
            billId: bill.id,
            campaignId: isCampaignSource
              ? (claimedItem.sourceId ?? null)
              : null,
            valueKind: TransactionValueKind.FREE_ITEM,
            amount: 0,
            type: TransactionType.REDEEMED,
            source: txSource,
            sourceId: claimedItem.sourceId ?? null,
            description: `Claimed: ${claimedItem.skuName}`,
            metadata: {
              freeItemName: claimedItem.skuName,
              freeItemId: claimedItem.id,
              claimedOnBillId: bill.id,
            },
          },
        }),
      ]);

      return NextResponse.json({ success: true });
    } catch (error: unknown) {
      console.error("Failed to claim free item:", error);
      return NextResponse.json(
        {
          success: false,
          error: sanitizeErrorMessage(error) || "Failed to claim free item",
        },
        { status: 500 },
      );
    }
  },
);
