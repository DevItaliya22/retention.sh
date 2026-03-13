"use client";

import { fetcher } from "@/lib/fetcher";
import type { UpdatePartnershipInput } from "@/lib/schemas/partnership";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type PartnershipEventType =
  | "REQUEST_SENT"
  | "REQUEST_ACCEPTED"
  | "REQUEST_REJECTED"
  | "REQUEST_PERMANENTLY_REJECTED"
  | "REQUEST_UN_PERMANENTLY_REJECTED"
  | "PARTNERSHIP_DISSOLVED"
  | "SETTINGS_UPDATED"
  | "SETTINGS_LOCKED"
  | "SETTINGS_UNLOCK_REQUESTED"
  | "SETTINGS_UNLOCK_ACCEPTED"
  | "SETTINGS_UNLOCK_REJECTED";

export interface PartnershipEventLog {
  id: string;
  partnershipId: string | null;
  partnerRequestId: string | null;
  actorBusinessId: string;
  actorBusiness: { id: string; name: string; slug: string };
  event: PartnershipEventType;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

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
  settingsLocked: boolean;
  settingsLockedByBusinessId: string | null;
  unlockRequestByBusinessId: string | null;
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

export function useLockPartnership(id: string) {
  const queryClient = useQueryClient();

  return useMutation<Partnership, Error, void>({
    mutationFn: () =>
      fetcher<Partnership>(`/api/partnership/${id}/lock`, { method: "POST" }),
    onSuccess: (updated) => {
      queryClient.setQueryData(["partnerships", id], updated);
      queryClient.invalidateQueries({ queryKey: ["partnerships"] });
    },
  });
}

export function useRequestUnlock(id: string) {
  const queryClient = useQueryClient();

  return useMutation<Partnership, Error, void>({
    mutationFn: () =>
      fetcher<Partnership>(`/api/partnership/${id}/unlock-request`, {
        method: "POST",
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData(["partnerships", id], updated);
      queryClient.invalidateQueries({ queryKey: ["partnerships"] });
    },
  });
}

export function usePartnershipLogs(id: string | null) {
  return useQuery<{ items: PartnershipEventLog[] }, Error>({
    queryKey: ["partnershipLogs", id],
    queryFn: () =>
      fetcher<{ items: PartnershipEventLog[] }>(`/api/partnership/${id}/logs`),
    enabled: !!id,
  });
}

export function useAllPartnershipLogs() {
  return useQuery<{ items: PartnershipEventLog[] }, Error>({
    queryKey: ["partnershipLogs", "all"],
    queryFn: () =>
      fetcher<{ items: PartnershipEventLog[] }>("/api/partnership/logs"),
  });
}

export function useRespondUnlockRequest(id: string) {
  const queryClient = useQueryClient();

  return useMutation<Partnership, Error, "accept" | "reject">({
    mutationFn: (action) =>
      fetcher<Partnership>(`/api/partnership/${id}/unlock-request`, {
        method: "PATCH",
        body: JSON.stringify({ action }),
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData(["partnerships", id], updated);
      queryClient.invalidateQueries({ queryKey: ["partnerships"] });
    },
  });
}
