"use client";

import { fetcher } from "@/lib/fetcher";
import type { UpdatePartnershipInput } from "@/lib/schemas/partnership";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface PartnershipMemberBusiness {
  id: string;
  name: string;
  slug: string;
  loyalty?: { loyaltyType: string } | null;
}

export interface PartnershipMember {
  id: string;
  partnershipId: string;
  businessId: string;
  exchangeRate: number;
  pointToCurrencyRate: number;
  business: PartnershipMemberBusiness;
}

export interface Partnership {
  id: string;
  status: "ACTIVE" | "DISSOLVED";
  sharedReferrals: boolean;
  shareReferralRewards: boolean;
  sharedCampaigns: boolean;
  members: PartnershipMember[];
  createdAt: string;
  updatedAt: string;
}

interface PartnershipsResponse {
  items: Partnership[];
}

export function usePartnerships() {
  return useQuery<PartnershipsResponse, Error>({
    queryKey: ["partnerships"],
    queryFn: () => fetcher<PartnershipsResponse>("/api/partnership"),
  });
}

export function usePartnership(id: string | null) {
  return useQuery<Partnership, Error>({
    queryKey: ["partnerships", id],
    queryFn: () => fetcher<Partnership>(`/api/partnership/${id}`),
    enabled: !!id,
  });
}

export function useUpdatePartnership(id: string) {
  const queryClient = useQueryClient();

  return useMutation<Partnership, Error, UpdatePartnershipInput>({
    mutationFn: (data) =>
      fetcher<Partnership>(`/api/partnership/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData(["partnerships", id], updated);
      queryClient.invalidateQueries({ queryKey: ["partnerships"] });
    },
  });
}

export function useDissolvePartnership() {
  const queryClient = useQueryClient();

  return useMutation<{ success: boolean }, Error, string>({
    mutationFn: (partnershipId) =>
      fetcher<{ success: boolean }>(
        `/api/partnership/${partnershipId}/dissolve`,
        { method: "POST" },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partnerships"] });
      queryClient.invalidateQueries({ queryKey: ["partnerCampaigns"] });
    },
  });
}
