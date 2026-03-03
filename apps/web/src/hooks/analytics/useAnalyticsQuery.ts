"use client";

import { fetcher } from "@/lib/fetcher";
import type { AnalyticsPeriod } from "@/lib/schemas/analytics";
import type {
  CampaignAnalyticsResponse,
  CustomerFrequencyResponse,
  CustomerSnapshotResponse,
  FeedbackAnalyticsResponse,
  HighlightsResponse,
  InsightsResponse,
  LoyaltyChartResponse,
  LoyaltyOverviewResponse,
  NewVsRepeatResponse,
  ReferralAnalyticsResponse,
  RevenueResponse,
  RfmResponse,
} from "@/lib/types/analytics";
import { useQuery } from "@tanstack/react-query";

function buildUrl(path: string, period?: AnalyticsPeriod): string {
  const params = new URLSearchParams();
  if (period) params.set("period", period);
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

// --- Section 1: Highlights ---

export function useHighlightsQuery(period: AnalyticsPeriod = "30d") {
  return useQuery<HighlightsResponse, Error>({
    queryKey: ["analytics", "highlights", period],
    queryFn: () =>
      fetcher<HighlightsResponse>(
        buildUrl("/api/analytics/highlights", period),
      ),
    placeholderData: (prev) => prev,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

// --- Section 2: Revenue ---

export function useRevenueChartQuery(period: AnalyticsPeriod = "30d") {
  return useQuery<RevenueResponse, Error>({
    queryKey: ["analytics", "revenue", period],
    queryFn: () =>
      fetcher<RevenueResponse>(buildUrl("/api/analytics/revenue", period)),
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });
}

// --- Section 3: Customers (4 hooks) ---

export function useCustomerSnapshotQuery(period: AnalyticsPeriod = "30d") {
  return useQuery<CustomerSnapshotResponse, Error>({
    queryKey: ["analytics", "customers", "snapshot", period],
    queryFn: () =>
      fetcher<CustomerSnapshotResponse>(
        buildUrl("/api/analytics/customers/snapshot", period),
      ),
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });
}

export function useNewVsRepeatQuery(period: AnalyticsPeriod = "30d") {
  return useQuery<NewVsRepeatResponse, Error>({
    queryKey: ["analytics", "customers", "new-vs-repeat", period],
    queryFn: () =>
      fetcher<NewVsRepeatResponse>(
        buildUrl("/api/analytics/customers/new-vs-repeat", period),
      ),
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });
}

export function useCustomerFrequencyQuery() {
  return useQuery<CustomerFrequencyResponse, Error>({
    queryKey: ["analytics", "customers", "frequency"],
    queryFn: () =>
      fetcher<CustomerFrequencyResponse>("/api/analytics/customers/frequency"),
    staleTime: 60_000,
  });
}

// --- Section 4: Loyalty (3 hooks) ---

export function useLoyaltyOverviewQuery(period: AnalyticsPeriod = "30d") {
  return useQuery<LoyaltyOverviewResponse, Error>({
    queryKey: ["analytics", "loyalty", "overview", period],
    queryFn: () =>
      fetcher<LoyaltyOverviewResponse>(
        buildUrl("/api/analytics/loyalty/overview", period),
      ),
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });
}

export function useLoyaltyChartQuery(period: AnalyticsPeriod = "30d") {
  return useQuery<LoyaltyChartResponse, Error>({
    queryKey: ["analytics", "loyalty", "chart", period],
    queryFn: () =>
      fetcher<LoyaltyChartResponse>(
        buildUrl("/api/analytics/loyalty/chart", period),
      ),
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });
}

// export function useTopRewardsQuery(period: AnalyticsPeriod = "30d") {
//   return useQuery<TopRewardsResponse, Error>({
//     queryKey: ["analytics", "loyalty", "top-rewards", period],
//     queryFn: () =>
//       fetcher<TopRewardsResponse>(
//         buildUrl("/api/analytics/loyalty/top-rewards", period),
//       ),
//     placeholderData: (prev) => prev,
//     staleTime: 30_000,
//   });
// }

// --- Section 5: RFM ---

export function useRfmQuery() {
  return useQuery<RfmResponse, Error>({
    queryKey: ["analytics", "rfm"],
    queryFn: () => fetcher<RfmResponse>("/api/analytics/rfm"),
    staleTime: 60_000,
  });
}

// --- Section 6: Engagement (3 hooks) ---

export function useFeedbackAnalyticsQuery(period: AnalyticsPeriod = "30d") {
  return useQuery<FeedbackAnalyticsResponse, Error>({
    queryKey: ["analytics", "feedback", period],
    queryFn: () =>
      fetcher<FeedbackAnalyticsResponse>(
        buildUrl("/api/analytics/feedback", period),
      ),
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });
}

export function useCampaignAnalyticsQuery(period: AnalyticsPeriod = "30d") {
  return useQuery<CampaignAnalyticsResponse, Error>({
    queryKey: ["analytics", "campaigns", period],
    queryFn: () =>
      fetcher<CampaignAnalyticsResponse>(
        buildUrl("/api/analytics/campaigns", period),
      ),
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });
}

export function useReferralAnalyticsQuery(period: AnalyticsPeriod = "30d") {
  return useQuery<ReferralAnalyticsResponse, Error>({
    queryKey: ["analytics", "referrals", period],
    queryFn: () =>
      fetcher<ReferralAnalyticsResponse>(
        buildUrl("/api/analytics/referrals", period),
      ),
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });
}

// --- Section 7: Insights ---

export function useInsightsQuery() {
  return useQuery<InsightsResponse, Error>({
    queryKey: ["analytics", "insights"],
    queryFn: () => fetcher<InsightsResponse>("/api/analytics/insights"),
    staleTime: 60_000,
  });
}
