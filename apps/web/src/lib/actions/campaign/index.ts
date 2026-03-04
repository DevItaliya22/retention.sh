import { parseFreeItems, type FreeItemEntry } from "@/lib/utils/free-items";
import {
  Prisma,
  TransactionSource,
  TransactionType,
  TransactionValueKind,
} from "@reelo/db";

export interface CampaignAppliedItem {
  campaignId: string;
  campaignTitle: string | null;
  rewardType: string;
  discountAmount: number;
  earnedAmount: number;
  freeItemName: string | null;
}

export interface CampaignResult {
  totalDiscount: number;
  appliedCampaigns: CampaignAppliedItem[];
  primaryCampaignId: string | null;
}

const noCampaignResult: CampaignResult = {
  totalDiscount: 0,
  appliedCampaigns: [],
  primaryCampaignId: null,
};

export async function applyCampaignForBill(
  tx: Prisma.TransactionClient,
  params: {
    businessId: string;
    customerId: string;
    billId: string;
    billAmount: number;
  },
): Promise<CampaignResult> {
  const { businessId, customerId, billId, billAmount } = params;
  const now = new Date();

  const activeCampaigns = await tx.campaign.findMany({
    where: {
      businessId,
      status: "ACTIVE",
      expiresAt: { gte: now },
      OR: [{ startsAt: null }, { startsAt: { lte: now } }],
    },
    orderBy: { createdAt: "asc" },
  });

  if (activeCampaigns.length === 0) return noCampaignResult;

  const appliedCampaigns: CampaignAppliedItem[] = [];
  let totalDiscount = 0;
  let remainingAmount = billAmount;

  for (const campaign of activeCampaigns) {
    if (campaign.rewardType === "NO_REWARD") continue;

    if (
      campaign.minPurchaseForEarningEnabled &&
      campaign.minPurchaseForEarning != null &&
      billAmount < campaign.minPurchaseForEarning
    ) {
      continue;
    }

    if (campaign.rewardType === "FREE_ITEM") {
      await applyFreeItemCampaign(tx, {
        businessId,
        customerId,
        billId,
        campaign,
      });
      appliedCampaigns.push({
        campaignId: campaign.id,
        campaignTitle: campaign.title,
        rewardType: "FREE_ITEM",
        discountAmount: 0,
        earnedAmount: 0,
        freeItemName: campaign.rewardValue,
      });
      continue;
    }

    if (remainingAmount <= 0) continue;

    let discount = 0;

    if (campaign.rewardType === "CASH_DISCOUNT") {
      const cashValue = parseFloat(campaign.rewardValue ?? "0");
      if (!(cashValue > 0)) continue;
      discount = cashValue;
    } else if (campaign.rewardType === "PERCENTAGE_DISCOUNT") {
      const pct = parseFloat(campaign.rewardValue ?? "0");
      if (!(pct > 0)) continue;
      discount = Math.floor(((remainingAmount * pct) / 100) * 100) / 100;
    }

    if (
      campaign.maxRedemptionEnabled &&
      campaign.maxRedemptionAmount != null &&
      campaign.maxRedemptionAmount > 0
    ) {
      discount = Math.min(discount, campaign.maxRedemptionAmount);
    }

    discount = Math.min(discount, remainingAmount);
    discount = Math.floor(discount * 100) / 100;

    if (discount <= 0) continue;

    const meetsMinForRedemption =
      !campaign.minPurchaseForRedemptionEnabled ||
      campaign.minPurchaseForRedemption == null ||
      billAmount >= campaign.minPurchaseForRedemption;

    const autoRedeem =
      campaign.instantCashbackRedeemable && meetsMinForRedemption;

    await applyCashDiscountCampaign(tx, {
      businessId,
      customerId,
      billId,
      campaignId: campaign.id,
      discount,
      autoRedeem,
    });

    if (autoRedeem) {
      totalDiscount += discount;
      remainingAmount -= discount;
    }

    appliedCampaigns.push({
      campaignId: campaign.id,
      campaignTitle: campaign.title,
      rewardType: campaign.rewardType,
      discountAmount: autoRedeem ? discount : 0,
      earnedAmount: discount,
      freeItemName: null,
    });
  }

  totalDiscount = Math.floor(totalDiscount * 100) / 100;

  const discountCampaign = appliedCampaigns.find((c) => c.discountAmount > 0);

  return {
    totalDiscount,
    appliedCampaigns,
    primaryCampaignId:
      discountCampaign?.campaignId ?? appliedCampaigns[0]?.campaignId ?? null,
  };
}

async function applyFreeItemCampaign(
  tx: Prisma.TransactionClient,
  params: {
    businessId: string;
    customerId: string;
    billId: string;
    campaign: {
      id: string;
      rewardValue: string | null;
      expiresAt: Date;
    };
  },
) {
  const { businessId, customerId, billId, campaign } = params;
  const itemName = campaign.rewardValue ?? "Free item";

  const wallet = await tx.wallet.findUnique({
    where: { businessId_customerId: { businessId, customerId } },
  });

  const existing = parseFreeItems(wallet?.freeItems);
  const newEntry: FreeItemEntry = {
    id: crypto.randomUUID(),
    skuId: null,
    skuName: itemName,
    source: "CAMPAIGN",
    sourceId: campaign.id,
    expiresAt: campaign.expiresAt.toISOString(),
    createdAt: new Date().toISOString(),
  };

  await tx.wallet.update({
    where: { businessId_customerId: { businessId, customerId } },
    data: { freeItems: [...existing, newEntry] as unknown as Prisma.JsonArray },
  });

  await tx.transaction.create({
    data: {
      businessId,
      customerId,
      billId,
      campaignId: campaign.id,
      valueKind: TransactionValueKind.FREE_ITEM,
      amount: 0,
      type: TransactionType.EARNED,
      source: TransactionSource.CAMPAIGN,
      sourceId: campaign.id,
      description: `Free item from campaign: ${itemName}`,
      metadata: { freeItemName: itemName, campaignId: campaign.id },
    },
  });
}

async function applyCashDiscountCampaign(
  tx: Prisma.TransactionClient,
  params: {
    businessId: string;
    customerId: string;
    billId: string;
    campaignId: string;
    discount: number;
    autoRedeem: boolean;
  },
) {
  const { businessId, customerId, billId, campaignId, discount, autoRedeem } =
    params;

  await tx.transaction.create({
    data: {
      businessId,
      customerId,
      billId,
      campaignId,
      valueKind: TransactionValueKind.CASHBACK,
      amount: discount,
      type: TransactionType.EARNED,
      source: TransactionSource.CAMPAIGN,
      sourceId: campaignId,
      description: `Campaign cashback earned: ₹${discount}`,
      metadata: { campaignId, autoApplied: autoRedeem },
    },
  });

  await tx.wallet.update({
    where: { businessId_customerId: { businessId, customerId } },
    data: { cashbackBalance: { increment: discount } },
  });

  if (autoRedeem) {
    await tx.transaction.create({
      data: {
        businessId,
        customerId,
        billId,
        campaignId,
        valueKind: TransactionValueKind.CASHBACK,
        amount: -discount,
        type: TransactionType.REDEEMED,
        source: TransactionSource.CAMPAIGN,
        sourceId: campaignId,
        description: `Campaign discount applied to bill: ₹${discount}`,
        metadata: { campaignId, autoApplied: true },
      },
    });

    await tx.wallet.update({
      where: { businessId_customerId: { businessId, customerId } },
      data: { cashbackBalance: { decrement: discount } },
    });
  }
}
