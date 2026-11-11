"use client";

import { fetcher } from "@/lib/fetcher";
import type { AnalyticsPeriod } from "@/lib/schemas/analytics";
import { useQuery } from "@tanstack/react-query";

export interface GamesOverviewCampaignAnalytics {
  id: string;
  name: string;
  type: string;
  status: string;
  fulfillmentMode: string;
  updatedAt: string;
  lastAttemptAt: string | null;
  rewardsConfigured: number;
  attemptsInPeriod: number;
  winsInPeriod: number;
  drawPendingInPeriod: number;
  rateLimitedInPeriod: number;
  winRate: number;
}

export interface GamesOverviewResponse {
  period: AnalyticsPeriod;
  campaigns: number;
  liveCampaigns: number;
  attemptsInPeriod: number;
  winsInPeriod: number;
  drawPendingInPeriod: number;
  rateLimitedInPeriod: number;
  participationRate: number;
  campaignAnalytics: GamesOverviewCampaignAnalytics[];
}

function buildUrl(path: string, period: AnalyticsPeriod = "30d"): string {
  const params = new URLSearchParams();
  params.set("period", period);
  params.set("tzOffsetMinutes", String(new Date().getTimezoneOffset()));
  return `${path}?${params.toString()}`;
}

export function useGamesOverviewQuery(period: AnalyticsPeriod = "30d") {
  return useQuery({
    queryKey: ["analytics", "games", "overview", period],
    queryFn: () =>
      fetcher<GamesOverviewResponse>(
        buildUrl("/api/analytics/games/overview", period),
      ),
    staleTime: 30_000,
  });
}

export function useGamesFunnelQuery(
  campaignId: string | null,
  period: AnalyticsPeriod = "30d",
) {
  return useQuery({
    queryKey: ["analytics", "games", "funnel", campaignId, period],
    queryFn: () =>
      fetcher<{
        funnel: {
          attempts: number;
          won: number;
          drawPending: number;
          rateLimited: number;
        };
      }>(
        buildUrl(`/api/analytics/games/campaigns/${campaignId}/funnel`, period),
      ),
    enabled: !!campaignId,
    staleTime: 30_000,
  });
}

export function useGamesFairnessQuery(
  campaignId: string | null,
  period: AnalyticsPeriod = "30d",
) {
  return useQuery({
    queryKey: ["analytics", "games", "fairness", campaignId, period],
    queryFn: () =>
      fetcher<{
        mode: string | null;
        configured: Array<{
          rewardId: string;
          displayName: string;
          probabilityPercent: number | null;
          weight: number;
        }>;
        actualShares: Array<{
          rewardId: string | null;
          count: number;
          sharePercent: number;
        }>;
        totalWins: number;
      }>(
        buildUrl(
          `/api/analytics/games/campaigns/${campaignId}/fairness`,
          period,
        ),
      ),
    enabled: !!campaignId,
    staleTime: 30_000,
  });
}
