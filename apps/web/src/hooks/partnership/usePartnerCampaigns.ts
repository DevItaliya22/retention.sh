"use client";

import { fetcher } from "@/lib/fetcher";
import type { PartnerCampaignUpdateInput } from "@/lib/schemas/partnership";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PartnershipMember } from "./usePartnerships";

export interface PartnerCampaignItem {
  id: string;
  slug: string;
  title: string | null;
  description: string | null;
  status: string;
  rewardType: string;
  rewardValue: string | null;
  expiresAt: string;
  themeColor: string | null;
  textColor: string | null;
  logo: string | null;
  bannerImage: string | null;
  createdByBusiness: { id: string; name: string; slug: string };
  partnership: {
    id: string;
    status: string;
    members: PartnershipMember[];
  };
  createdAt: string;
  updatedAt: string;
}

interface PartnerCampaignsResponse {
  items: PartnerCampaignItem[];
}

export function usePartnerCampaigns() {
  return useQuery<PartnerCampaignsResponse, Error>({
    queryKey: ["partnerCampaigns"],
    queryFn: () =>
      fetcher<PartnerCampaignsResponse>("/api/partnership/campaigns"),
  });
}

export function useCreatePartnerCampaign() {
  const queryClient = useQueryClient();

  return useMutation<
    { id: string; slug: string },
    Error,
    { partnershipId: string }
  >({
    mutationFn: (data) =>
      fetcher<{ id: string; slug: string }>("/api/partnership/campaigns", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partnerCampaigns"] });
    },
  });
}

export function useUpdatePartnerCampaign(id: string | null) {
  const queryClient = useQueryClient();

  return useMutation<PartnerCampaignItem, Error, PartnerCampaignUpdateInput>({
    mutationFn: (data) =>
      fetcher<PartnerCampaignItem>(`/api/partnership/campaigns/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partnerCampaigns"] });
    },
  });
}
