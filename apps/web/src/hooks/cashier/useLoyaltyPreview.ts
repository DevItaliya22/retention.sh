"use client";

import { fetcher } from "@/lib/fetcher";
import { useQuery } from "@tanstack/react-query";

export interface RewardStagePreview {
  id: string;
  rewardName: string;
  rewardType: string;
  pointsRequired: number;
  canRedeem: boolean;
  freeItemName: string | null;
  percentageValue: number | null;
  cashAmount: number | null;
  minPurchaseForRedemptionEnabled?: boolean;
  minPurchaseForRedemption?: number | null;
}

export interface FreeItemPreview {
  id: string;
  skuId: string | null;
  skuName: string;
  source: string;
  createdAt: string;
}

export interface PartnerRedeemablePreview {
  partnerBusinessId: string;
  partnerBusinessName: string;
  loyaltyType: string;
  balance: number;
  valueAtCurrentStore: number;
  maxRedeemableOnBill: number;
}

export interface LoyaltyPreviewData {
  loyaltyType: string;
  pointsBalance: number;
  /** Cashback balance (₹) for CASHBACK/TIER types. */
  cashbackBalance?: number;
  redeemablePoints: number;
  /** AMOUNT_SPENT / VISIT_MADE: max wallet cashback (₹) applicable to this bill. */
  maxRedeemableFromCashback?: number;
  earnablePoints: number;
  /** Unclaimed free items (e.g. from referral) that can be claimed on this bill. */
  freeItems: FreeItemPreview[];
  expiringBuckets: {
    id: string;
    remainingAmount: number;
    expiresAt: string;
  }[];
  cashbackInFinalAmount: boolean;
  tierInfo: {
    currentTierName: string;
    cashbackPercentage: number;
  } | null;
  /** TIER only: when no tier (below first), message for cashier. */
  tierMessage?: string | null;
  rewardStages: RewardStagePreview[];
  visitCount: number | null;
  /** Partner balances redeemable at this store (them → you). */
  partnerRedeemable?: PartnerRedeemablePreview[];
}

export interface LoyaltyPreviewResponse {
  preview: LoyaltyPreviewData | null;
  error?: string;
}

export function useLoyaltyPreview(params: {
  businessId: string;
  phone: string;
  billAmount: number;
  /** Optional. When provided, used for earnable calculation when program uses subtotal for earning. */
  subtotal?: number | null;
}) {
  const enabled =
    params.phone.trim().length >= 4 && Number.isFinite(params.billAmount);

  const searchParams = new URLSearchParams({
    phone: params.phone,
    businessId: params.businessId,
    billAmount: String(params.billAmount),
  });
  if (params.subtotal != null && params.subtotal > 0) {
    searchParams.set("subtotal", String(params.subtotal));
  }

  return useQuery<LoyaltyPreviewResponse, Error>({
    queryKey: [
      "loyalty-preview",
      params.businessId,
      params.phone,
      params.billAmount,
      params.subtotal ?? null,
    ],
    queryFn: () =>
      fetcher<LoyaltyPreviewResponse>(
        `/api/cashier/loyalty/preview?${searchParams.toString()}`,
      ),
    enabled,
    staleTime: 5000,
  });
}
