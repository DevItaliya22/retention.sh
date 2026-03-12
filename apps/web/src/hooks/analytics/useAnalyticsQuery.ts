"use client";

import { fetcher } from "@/lib/fetcher";
import type { AnalyticsPeriod } from "@/lib/schemas/analytics";
import type {
  CampaignAnalyticsResponse,
  CustomerFrequencyResponse,
  CustomerSegmentsResponse,
  CustomerSnapshotResponse,
  FeedbackAnalyticsResponse,
  HighlightsResponse,
  InsightsResponse,
  LoyaltyChartResponse,
  LoyaltyOverviewResponse,
  NewVsRepeatResponse,
  ReferralAnalyticsResponse,
  RevenueResponse,
} from "@/lib/types/analytics";
import { useQuery } from "@tanstack/react-query";

function getBrowserTzOffsetMinutes(): number {
  return new Date().getTimezoneOffset();
}

function buildUrl(path: string, period?: AnalyticsPeriod): string {
  const params = new URLSearchParams();
  if (period) params.set("period", period);
  params.set("tzOffsetMinutes", String(getBrowserTzOffsetMinutes()));
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

// --- Section 1: Highlights ---

export function useHighlightsQuery(period: AnalyticsPeriod = "30d") {
  const tzOffsetMinutes = getBrowserTzOffsetMinutes();
  return useQuery<HighlightsResponse, Error>({
    queryKey: ["analytics", "highlights", period, tzOffsetMinutes],
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
  const tzOffsetMinutes = getBrowserTzOffsetMinutes();
  return useQuery<RevenueResponse, Error>({
    queryKey: ["analytics", "revenue", period, tzOffsetMinutes],
    queryFn: () =>
      fetcher<RevenueResponse>(buildUrl("/api/analytics/revenue", period)),
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });
}

// --- Section 3: Customers (4 hooks) ---

export function useCustomerSnapshotQuery(period: AnalyticsPeriod = "30d") {
  const tzOffsetMinutes = getBrowserTzOffsetMinutes();
  return useQuery<CustomerSnapshotResponse, Error>({
    queryKey: ["analytics", "customers", "snapshot", period, tzOffsetMinutes],
    queryFn: () =>
      fetcher<CustomerSnapshotResponse>(
        buildUrl("/api/analytics/customers/snapshot", period),
      ),
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });
}

export function useNewVsRepeatQuery(period: AnalyticsPeriod = "30d") {
  const tzOffsetMinutes = getBrowserTzOffsetMinutes();
  return useQuery<NewVsRepeatResponse, Error>({
    queryKey: [
      "analytics",
      "customers",
      "new-vs-repeat",
      period,
      tzOffsetMinutes,
    ],
    queryFn: () =>
      fetcher<NewVsRepeatResponse>(
        buildUrl("/api/analytics/customers/new-vs-repeat", period),
      ),
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });
}

export function useCustomerFrequencyQuery(period: AnalyticsPeriod = "30d") {
  const tzOffsetMinutes = getBrowserTzOffsetMinutes();
  return useQuery<CustomerFrequencyResponse, Error>({
    queryKey: ["analytics", "customers", "frequency", period, tzOffsetMinutes],
    queryFn: () =>
      fetcher<CustomerFrequencyResponse>(
        buildUrl("/api/analytics/customers/frequency", period),
      ),
    staleTime: 60_000,
  });
}

// --- Section 4: Loyalty (3 hooks) ---

export function useLoyaltyOverviewQuery(period: AnalyticsPeriod = "30d") {
  const tzOffsetMinutes = getBrowserTzOffsetMinutes();
  return useQuery<LoyaltyOverviewResponse, Error>({
    queryKey: ["analytics", "loyalty", "overview", period, tzOffsetMinutes],
    queryFn: () =>
      fetcher<LoyaltyOverviewResponse>(
        buildUrl("/api/analytics/loyalty/overview", period),
      ),
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });
}

export function useLoyaltyChartQuery(period: AnalyticsPeriod = "30d") {
  const tzOffsetMinutes = getBrowserTzOffsetMinutes();
  return useQuery<LoyaltyChartResponse, Error>({
    queryKey: ["analytics", "loyalty", "chart", period, tzOffsetMinutes],
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

// --- Section 5: Customer Segments ---

export function useCustomerSegmentsQuery() {
  return useQuery<CustomerSegmentsResponse, Error>({
    queryKey: ["analytics", "segments"],
    queryFn: () => fetcher<CustomerSegmentsResponse>("/api/analytics/segments"),
    placeholderData: (prev) => prev,
    staleTime: 60_000,
  });
}

// --- Section 6: Engagement (3 hooks) ---

export function useFeedbackAnalyticsQuery(period: AnalyticsPeriod = "30d") {
  const tzOffsetMinutes = getBrowserTzOffsetMinutes();
  return useQuery<FeedbackAnalyticsResponse, Error>({
    queryKey: ["analytics", "feedback", period, tzOffsetMinutes],
    queryFn: () =>
      fetcher<FeedbackAnalyticsResponse>(
        buildUrl("/api/analytics/feedback", period),
      ),
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });
}

export function useCampaignAnalyticsQuery(period: AnalyticsPeriod = "30d") {
  const tzOffsetMinutes = getBrowserTzOffsetMinutes();
  return useQuery<CampaignAnalyticsResponse, Error>({
    queryKey: ["analytics", "campaigns", period, tzOffsetMinutes],
    queryFn: () =>
      fetcher<CampaignAnalyticsResponse>(
        buildUrl("/api/analytics/campaigns", period),
      ),
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });
}

export function useReferralAnalyticsQuery(period: AnalyticsPeriod = "30d") {
  const tzOffsetMinutes = getBrowserTzOffsetMinutes();
  return useQuery<ReferralAnalyticsResponse, Error>({
    queryKey: ["analytics", "referrals", period, tzOffsetMinutes],
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

// --- Section 8: RFM Stats ---

export interface RfmStatsResponse {
  totalCustomers: number;
  repeatCustomers: number;
  filteredCount: number;
}

export function useRfmStatsQuery(params?: {
  period?: AnalyticsPeriod;
  segment?: string;
}) {
  const period = params?.period ?? "30d";
  const segment = params?.segment;
  const tzOffsetMinutes = new Date().getTimezoneOffset();
  return useQuery<RfmStatsResponse, Error>({
    queryKey: [
      "analytics",
      "rfm-stats",
      period,
      segment ?? "",
      tzOffsetMinutes,
    ],
    queryFn: () => {
      const qs = new URLSearchParams({
        period,
        tzOffsetMinutes: String(tzOffsetMinutes),
      });
      if (segment) qs.set("segment", segment);
      return fetcher<RfmStatsResponse>(`/api/analytics/rfm-stats?${qs}`);
    },
    placeholderData: (prev) => prev,
    staleTime: 60_000,
  });
}
