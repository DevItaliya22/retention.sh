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
}

export interface LoyaltyPreviewData {
  loyaltyType: string;
  pointsBalance: number;
  redeemablePoints: number;
  earnablePoints: number;
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
  rewardStages: RewardStagePreview[];
  visitCount: number | null;
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
