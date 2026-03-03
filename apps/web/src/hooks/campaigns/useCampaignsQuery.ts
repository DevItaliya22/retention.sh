"use client";

import { fetcher } from "@/lib/fetcher";
import {
  buildApiParams,
  getDataTableConfig,
} from "@/lib/utils/data-table-params";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";

export type CampaignRewardType =
  | "FREE_ITEM"
  | "PERCENTAGE_DISCOUNT"
  | "CASH_DISCOUNT"
  | "NO_REWARD";

export type CampaignAppliesTo = "ENTIRE_PURCHASE" | "SPECIFIC_ITEMS";

export type CampaignRedemptionLimit = "ONCE" | "MULTIPLE";

export interface CampaignListItem {
  id: string;
  slug: string;
  title: string | null;
  description: string | null;
  status: string;
  rewardType: string;
  rewardValue: string | null; // raw value (e.g. "coke", "10", "200")
  offerStatement: string | null; // full sentence
  appliesTo: string;
  expiresAt: string;
  themeColor: string | null;
  bannerImage: string | null;
  logo: string | null;
  contactNumber: string | null;
  termsAndConditions: string[];
  maxRedemptionEnabled: boolean;
  maxRedemptionAmount: number | null;
  minPurchaseForEarningEnabled: boolean;
  minPurchaseForEarning: number | null;
  minPurchaseForRedemptionEnabled: boolean;
  minPurchaseForRedemption: number | null;
  instantCashbackRedeemable: boolean;
  redemptionLimit: string;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignsResponse {
  items: CampaignListItem[];
  total: number;
  page: number;
  perPage: number;
  error?: string;
}

export function useCampaignsQuery() {
  const searchParams = useSearchParams();
  const config = getDataTableConfig("campaigns");
  const apiParams = buildApiParams(
    searchParams,
    config.prefix,
    config.filterKeys,
  );
  const queryString = apiParams.toString();

  return useQuery<CampaignsResponse, Error>({
    queryKey: ["campaigns", searchParams.toString()],
    queryFn: () => {
      const url = queryString
        ? `/api/campaigns?${queryString}`
        : "/api/campaigns";
      return fetcher<CampaignsResponse>(url);
    },
    placeholderData: (prev) => prev,
    staleTime: 5000,
  });
}

export interface CreateCampaignDraftResponse {
  id: string;
  slug: string;
}

export function useCreateCampaignDraft() {
  const queryClient = useQueryClient();

  return useMutation<CreateCampaignDraftResponse, Error>({
    mutationFn: () =>
      fetcher<CreateCampaignDraftResponse>("/api/campaigns", {
        method: "POST",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });
}

/** Full campaign as returned by GET /api/campaigns/[id] */
export interface CampaignFull extends CampaignListItem {
  targetCustomerTags: string[];
  emailSubject: string | null;

  // Branding
  textColor: string | null;

  // Reward
  appliesTo: CampaignAppliesTo;

  whatsappEnabled: boolean;
  emailEnabled: boolean;
}

export function useCampaignQuery(
  id: string | null,
  initialData?: CampaignFull,
) {
  return useQuery<CampaignFull, Error>({
    queryKey: ["campaign", id],
    queryFn: async () => {
      const campaign = await fetcher<CampaignFull>(`/api/campaigns/${id}`, {
        cache: "no-store",
      });
      if (id && campaign.id !== id) {
        throw new Error("Loaded campaign does not match requested campaign.");
      }
      return campaign;
    },
    enabled: !!id,
    initialData:
      id && initialData && initialData.id === id ? initialData : undefined,
  });
}

export interface UpdateCampaignInput {
  title?: string | null;
  description?: string | null;
  contactNumber?: string | null;
  expiresAt?: string;
  targetCustomerTags?: string[];
  status?: string;
  emailSubject?: string | null;

  // Branding
  themeColor?: string | null;
  textColor?: string | null;
  logo?: string | null;
  bannerImage?: string | null;

  // Reward
  rewardType?: CampaignRewardType;
  rewardValue?: string | null;
  offerStatement?: string | null;
  appliesTo?: CampaignAppliesTo;
  maxRedemptionAmount?: number | null;
  maxRedemptionEnabled?: boolean;

  // Min purchase requirements
  minPurchaseForEarningEnabled?: boolean;
  minPurchaseForEarning?: number | null;
  minPurchaseForRedemptionEnabled?: boolean;
  minPurchaseForRedemption?: number | null;

  // Instant cashback
  instantCashbackRedeemable?: boolean;

  // Terms
  redemptionLimit?: CampaignRedemptionLimit;
  termsAndConditions?: string[];

  whatsappEnabled?: boolean;
  emailEnabled?: boolean;
}

export function useUpdateCampaign(id: string | null) {
  const queryClient = useQueryClient();

  return useMutation<CampaignFull, Error, UpdateCampaignInput>({
    mutationFn: (data) =>
      fetcher<CampaignFull>(`/api/campaigns/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData(["campaign", id], updated);
      queryClient.invalidateQueries({ queryKey: ["campaign", id] });
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });
}
