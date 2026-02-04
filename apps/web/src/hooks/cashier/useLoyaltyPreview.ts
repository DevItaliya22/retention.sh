"use client";

import { fetcher } from "@/lib/fetcher";
import { useQuery } from "@tanstack/react-query";

export interface LoyaltyPreviewResponse {
  preview: {
    pointsBalance: number;
    redeemablePoints: number;
    earnablePoints: number;
    expiringBuckets: {
      id: string;
      remainingAmount: number;
      expiresAt: string;
    }[];
    cashbackInFinalAmount: boolean;
  } | null;
  error?: string;
}

export function useLoyaltyPreview(params: {
  businessId: string;
  phone: string;
  billAmount: number;
}) {
  const enabled =
    params.phone.trim().length >= 4 && Number.isFinite(params.billAmount);

  return useQuery<LoyaltyPreviewResponse, Error>({
    queryKey: [
      "loyalty-preview",
      params.businessId,
      params.phone,
      params.billAmount,
    ],
    queryFn: () =>
      fetcher<LoyaltyPreviewResponse>(
        `/api/cashier/loyalty/preview?phone=${encodeURIComponent(
          params.phone,
        )}&businessId=${encodeURIComponent(
          params.businessId,
        )}&billAmount=${encodeURIComponent(params.billAmount)}`,
      ),
    enabled,
    staleTime: 5000,
  });
}
