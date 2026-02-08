"use client";

import { fetcher } from "@/lib/fetcher";
import type {
  LoyaltyCreateInput,
  LoyaltyRewardType,
  LoyaltyUpdateInput,
  VisitIntervalUnit,
} from "@/lib/schemas/loyalty";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface LoyaltyBranding {
  logo: string | null;
  themeColor: string | null;
  textColor: string | null;
  bannerImage: string | null;
  header: string | null;
  subtitle: string | null;
}

export interface LoyaltyRewardStage {
  id: string;
  pointsRequired: number;
  rewardType: LoyaltyRewardType;
  rewardName: string;
  freeItemSkuId: string | null;
  freeItemName: string | null;
  percentageValue: number | null;
  appliesToEntirePurchase: boolean;
  specificProductIds: string[];
  cashAmount: number | null;
  minPurchaseForRedemptionEnabled: boolean;
  minPurchaseForRedemption: number | null;
  maxDiscountCapEnabled: boolean;
  maxDiscountCap: number | null;
}

export interface LoyaltyTier {
  id: string;
  name: string;
  rank: number;
  minLifetimeSpend: number;
  maxLifetimeSpend: number | null;
  cashbackPercentage: number;
  minPurchaseForEarningEnabled: boolean;
  minPurchaseForEarning: number | null;
  minPurchaseForRedemptionEnabled: boolean;
  minPurchaseForRedemption: number | null;
  maxCashbackCapEnabled: boolean;
  maxCashbackCap: number | null;
}

export interface LoyaltyResponse {
  id: string;
  loyaltyType: "CASHBACK" | "TIER" | "AMOUNT_SPENT" | "VISIT_MADE";
  businessId: string;
  brandingId: string | null;
  pointReminderDays: number | null;
  pointExpiryDays: number | null;
  whatsappEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  termsAndConditions: { id: string; content: string }[];
  branding: LoyaltyBranding | null;
  cashbackConfig?: {
    id: string;
    cashbackPercentage: number;
    onFinalAmount: boolean;
    maxCashbackCap: number | null;
    minPurchaseForEarningEnabled: boolean;
    minPurchaseForEarning: number | null;
    minPurchaseForRedemptionEnabled: boolean;
    minPurchaseForRedemption: number | null;
    redemptionBalanceLimitEnabled: boolean;
    redemptionBalanceLimitAmount: number | null;
    redemptionBalanceLimitPercentage: number | null;
    redemptionBillLimitEnabled: boolean;
    redemptionBillLimitAmount: number | null;
    redemptionBillLimitPercentage: number | null;
  } | null;
  tierConfig?: {
    id: string;
    pointsPerRupee: number;
    maxCashbackCapEnabled: boolean;
    maxCashbackCap: number | null;
    tiers: LoyaltyTier[];
  } | null;
  amountSpentConfig?: {
    id: string;
    pointsPerRupee: number;
    onFinalAmount: boolean;
    maxPointsPerPurchase: number | null;
    rewardStages: LoyaltyRewardStage[];
  } | null;
  visitMadeConfig?: {
    id: string;
    pointsPerVisit: number;
    visitIntervalEnabled: boolean;
    visitIntervalValue: number | null;
    visitIntervalUnit: VisitIntervalUnit | null;
    rewardStages: LoyaltyRewardStage[];
  } | null;
}

export interface LoyaltySettingsResponse {
  loyalty: LoyaltyResponse | null;
  error?: string;
}

// ─── Query ──────────────────────────────────────────────────────────────────

export function useLoyaltySettingsQuery() {
  return useQuery<LoyaltySettingsResponse, Error>({
    queryKey: ["loyalty-settings"],
    queryFn: () => fetcher<LoyaltySettingsResponse>("/api/loyalty"),
    staleTime: 5000,
  });
}

// ─── Mutations ──────────────────────────────────────────────────────────────

export function useCreateLoyaltyMutation() {
  const queryClient = useQueryClient();
  return useMutation<LoyaltySettingsResponse, Error, LoyaltyCreateInput>({
    mutationFn: async (payload) =>
      fetcher<LoyaltySettingsResponse>("/api/loyalty", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loyalty-settings"] });
      queryClient.invalidateQueries({ queryKey: ["currentBusiness"] });
    },
  });
}

export function useUpdateLoyaltyMutation() {
  const queryClient = useQueryClient();
  return useMutation<LoyaltySettingsResponse, Error, LoyaltyUpdateInput>({
    mutationFn: async (payload) =>
      fetcher<LoyaltySettingsResponse>("/api/loyalty", {
        method: "PUT",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loyalty-settings"] });
    },
  });
}
