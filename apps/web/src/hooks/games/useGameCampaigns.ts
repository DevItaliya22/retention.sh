"use client";

import { fetcher } from "@/lib/fetcher";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface GameCampaignListItem {
  id: string;
  name: string;
  slug: string;
  type: string;
  status: string;
  fulfillmentMode: string;
  updatedAt: string;
  _count: { attempts: number; rewards: number };
}

export function useGameCampaignsQuery(status?: string) {
  const qs = status ? `?status=${encodeURIComponent(status)}` : "";
  return useQuery<{ campaigns: GameCampaignListItem[] }, Error>({
    queryKey: ["games", "campaigns", status ?? "all"],
    queryFn: () => fetcher(`/api/games/campaigns${qs}`),
    staleTime: 20_000,
  });
}

export function useGameCampaignDetailQuery(id: string | null) {
  return useQuery({
    queryKey: ["games", "campaign", id],
    queryFn: () => fetcher<{ campaign: unknown }>(`/api/games/campaigns/${id}`),
    enabled: !!id,
  });
}

export function usePublishGameCampaignMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetcher(`/api/games/campaigns/${id}/publish`, { method: "POST" }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["games"] });
    },
  });
}

export function usePauseGameCampaignMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetcher(`/api/games/campaigns/${id}/pause`, { method: "POST" }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["games"] });
    },
  });
}

export function useCreateGameCampaignMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      type: "SPIN_WHEEL" | "LOTTERY" | "SCRATCH_CARD";
      name: string;
      slug?: string;
      fulfillmentMode?: "INSTANT" | "SCHEDULED_DRAW";
      drawAt?: string | null;
    }) =>
      fetcher<{
        campaign: {
          id: string;
          name: string;
          slug: string;
          type: string;
          status: string;
        };
      }>("/api/games/campaigns", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["games"] });
    },
  });
}

export function useArchiveGameCampaignMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetcher(`/api/games/campaigns/${id}/archive`, { method: "POST" }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["games"] });
    },
  });
}

export interface GameCampaignDetail {
  id: string;
  name: string;
  slug: string;
  type: "SPIN_WHEEL" | "LOTTERY" | "SCRATCH_CARD";
  status: "DRAFT" | "ACTIVE" | "PAUSED" | "COMPLETED" | "ARCHIVED";
  fulfillmentMode: "INSTANT" | "SCHEDULED_DRAW";
  drawAt: string | null;
  startsAt: string | null;
  endsAt: string | null;
  eligibilityRules: Array<{
    id: string;
    eventType:
      | "BILL_CREATED"
      | "VISIT_QUALIFIED"
      | "REFERRAL_COMPLETED"
      | "CAMPAIGN_ACTION"
      | "MANUAL_GRANT"
      | "CUSTOM_EVENT";
    intervalEnabled: boolean;
    intervalValue: number | null;
    intervalUnit: "MINUTE" | "HOUR" | "DAY" | "WEEK" | "MONTH" | null;
    maxAttemptsPerUserPerInterval: number | null;
    globalAttemptCap: number | null;
    firstNEligibleUsers: number | null;
    segmentId: string | null;
  }>;
  distributionPolicy: {
    id: string;
    mode:
      | "PROBABILITY_WEIGHTED"
      | "POPULATION_RATIO"
      | "FIXED_WINNER_COUNT"
      | "FIRST_N";
    populationWindowSize: number | null;
    populationWinnerCount: number | null;
    maxWinnersTotal: number | null;
  } | null;
  rewards: Array<{
    id: string;
    kind:
      | "NONE"
      | "LOYALTY_POINTS"
      | "CASHBACK"
      | "FREE_ITEM"
      | "PERCENTAGE_DISCOUNT"
      | "VOUCHER_CODE";
    displayName: string;
    weight: number;
    probabilityPercent: number | null;
    maxWinners: number | null;
    stock: number | null;
    priority: number;
    isFallbackNoReward: boolean;
    freeItemSkuId: string | null;
    pointsAmount: number | null;
    cashbackAmount: number | null;
    percentageValue: number | null;
    voucherCode: string | null;
  }>;
}

export interface GameRewardInput {
  id?: string;
  kind: GameCampaignDetail["rewards"][number]["kind"];
  displayName: string;
  weight: number;
  probabilityPercent?: number | null;
  maxWinners?: number | null;
  stock?: number | null;
  priority?: number;
  isFallbackNoReward?: boolean;
  freeItemSkuId?: string | null;
  pointsAmount?: number | null;
  cashbackAmount?: number | null;
  percentageValue?: number | null;
  voucherCode?: string | null;
}

export function useUpdateGameRewardsMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; rewards: GameRewardInput[] }) =>
      fetcher(`/api/games/campaigns/${input.id}/rewards`, {
        method: "PUT",
        body: JSON.stringify({ rewards: input.rewards }),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["games"] });
    },
  });
}

export interface GameDistributionInput {
  mode:
    | "PROBABILITY_WEIGHTED"
    | "POPULATION_RATIO"
    | "FIXED_WINNER_COUNT"
    | "FIRST_N";
  populationWindowSize?: number | null;
  populationWinnerCount?: number | null;
  maxWinnersTotal?: number | null;
  strictInventoryMode?: boolean;
}

export function useUpdateGameDistributionMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; policy: GameDistributionInput }) =>
      fetcher(`/api/games/campaigns/${input.id}/distribution`, {
        method: "PUT",
        body: JSON.stringify(input.policy),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["games"] });
    },
  });
}

export interface GameEligibilityRuleInput {
  eventType: GameCampaignDetail["eligibilityRules"][number]["eventType"];
  intervalEnabled?: boolean;
  intervalValue?: number | null;
  intervalUnit?: "MINUTE" | "HOUR" | "DAY" | "WEEK" | "MONTH" | null;
  maxAttemptsPerUserPerInterval?: number | null;
  globalAttemptCap?: number | null;
  firstNEligibleUsers?: number | null;
  segmentId?: string | null;
}

export function useUpdateGameEligibilityMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; rules: GameEligibilityRuleInput[] }) =>
      fetcher(`/api/games/campaigns/${input.id}/eligibility`, {
        method: "PUT",
        body: JSON.stringify({ rules: input.rules }),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["games"] });
    },
  });
}

export function useUpdateGameFulfillmentMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      id: string;
      fulfillmentMode: "INSTANT" | "SCHEDULED_DRAW";
      drawAt?: string | null;
    }) =>
      fetcher(`/api/games/campaigns/${input.id}/fulfillment`, {
        method: "PUT",
        body: JSON.stringify({
          fulfillmentMode: input.fulfillmentMode,
          drawAt: input.drawAt ?? null,
        }),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["games"] });
    },
  });
}
