"use client";

import { fetcher } from "@/lib/fetcher";
import type { FeedbackConfigUpdateInput } from "@/lib/schemas/feedback";
import {
  buildApiParams,
  getDataTableConfig,
} from "@/lib/utils/data-table-params";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";

export interface FeedbackQuestionDto {
  id: string;
  question: string;
  iconType: string | null;
}

export interface FeedbackCategoryDto {
  id: string;
  name: string;
}

export interface HowDidYouHearOptionDto {
  id: string;
  name: string;
}

export interface FeedbackConfigDto {
  id: string;
  businessId: string | null;
  positiveFollowUp: string | null;
  negativeFollowUp: string | null;
  timing: string;
  delaySeconds: number | null;
  collectionChannel: string;
  sendViaSmsIfWpFailed: boolean;
  feedbackRewardEnabled: boolean;
  rewardAmount: number | null;
  isHowDidYouHearEnabled: boolean;
  negAlertChannelsWp: boolean;
  negAlertChannelsSms: boolean;
  negAlertChannelsEmail: boolean;
  negFeedbackAlertNumber: string | null;
  negFeedbackAlertSmsNumber: string | null;
  negFeedbackAlertEmailAddress: string | null;
  askForOnlineReviews: boolean;
  onlineReviewLink: string | null;
  onlineReviewPlatform: string | null;
  questions: FeedbackQuestionDto[];
  categories: FeedbackCategoryDto[];
  howDidYouHearOptions: HowDidYouHearOptionDto[];
  branding: unknown;
}

export interface FeedbackConfigResponse {
  config: FeedbackConfigDto | null;
  error?: string;
}

export interface FeedbackStatRow {
  id: string;
  rating: number | null;
  comment: string | null;
  howDidYouHear: string | null;
  selectedCategories: string[];
  createdAt: string;
  customerName: string;
  customerPhone: string | null;
  customerSlugId: string;
}

export interface FeedbackStatsResponse {
  items: FeedbackStatRow[];
  total: number;
  page: number;
  perPage: number;
  error?: string;
}

export function useFeedbackConfigQuery() {
  return useQuery<FeedbackConfigResponse, Error>({
    queryKey: ["feedbackConfig"],
    queryFn: () => fetcher<FeedbackConfigResponse>("/api/feedback/config"),
    placeholderData: (prev) => prev,
    staleTime: 5000,
  });
}

export function useUpdateFeedbackConfig() {
  const queryClient = useQueryClient();
  return useMutation<FeedbackConfigResponse, Error, FeedbackConfigUpdateInput>({
    mutationFn: async (payload) => {
      return fetcher<FeedbackConfigResponse>("/api/feedback/config", {
        method: "PUT",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: (data) => {
      if (data.config) {
        queryClient.setQueryData<FeedbackConfigResponse | undefined>(
          ["feedbackConfig"],
          (existing) => ({
            config: data.config ?? existing?.config ?? null,
            error: data.error ?? existing?.error,
          }),
        );
      }
    },
  });
}

export function useFeedbackStatsQuery() {
  const searchParams = useSearchParams();
  const config = getDataTableConfig("feedbackStats");
  const apiParams = buildApiParams(
    searchParams,
    config.prefix,
    config.filterKeys,
  );
  const queryString = apiParams.toString();

  return useQuery<FeedbackStatsResponse, Error>({
    queryKey: ["feedbackStats", queryString],
    queryFn: () => {
      const url = queryString
        ? `/api/feedback/stats?${queryString}`
        : "/api/feedback/stats";
      return fetcher<FeedbackStatsResponse>(url);
    },
    placeholderData: (prev) => prev,
    staleTime: 5000,
  });
}
