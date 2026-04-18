"use client";

import { fetcher } from "@/lib/fetcher";
import type { AnalyticsPeriod } from "@/lib/schemas/analytics";
import { useQuery } from "@tanstack/react-query";

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
      fetcher<{
        campaigns: number;
        attemptsInPeriod: number;
        winsInPeriod: number;
        participationRate: number;
      }>(buildUrl("/api/analytics/games/overview", period)),
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
