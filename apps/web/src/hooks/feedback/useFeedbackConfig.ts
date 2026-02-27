"use client";

import { fetcher } from "@/lib/fetcher";
import type {
  FeedbackConfigUpdateInput,
  FeedbackSelectionOptionCreateInput,
  FeedbackSelectionOptionReorderInput,
  FeedbackSelectionOptionUpdateInput,
} from "@/lib/schemas/feedback";
import {
  buildApiParams,
  getDataTableConfig,
} from "@/lib/utils/data-table-params";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";

const FEEDBACK_SELECTION_OPTIONS_BASE =
  "/api/feedback/config/selection-options";

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

export interface FeedbackSelectionOptionDto {
  id: string;
  label: string;
  seq: number;
}

export interface FeedbackBrandingDto {
  logo: string | null;
  themeColor: string | null;
  textColor: string | null;
  bannerImage: string | null;
  header: string | null;
  subtitle: string | null;
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
  selectionOptions: FeedbackSelectionOptionDto[];
  branding: FeedbackBrandingDto | null;
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
  selectedSelectionOptions: { id: string; label: string }[];
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

export interface FeedbackDetailDto {
  id: string;
  rating: number | null;
  comment: string | null;
  howDidYouHear: string | null;
  selectedCategories: string[];
  selectedSelectionOptions: { id: string; label: string }[];
  createdAt: string;
  customerName: string;
  customerPhone: string | null;
  customerSlugId: string;
  bill: {
    id: string;
    billNumber: string;
    createdAt: string;
    finalAmount: number | null;
    userPaidAmount: number | null;
  } | null;
}

export function useFeedbackDetailQuery(feedbackResponseId: string | null) {
  return useQuery<FeedbackDetailDto, Error>({
    queryKey: ["feedbackDetail", feedbackResponseId],
    queryFn: () =>
      fetcher<FeedbackDetailDto>(`/api/feedback/stats/${feedbackResponseId}`),
    enabled: !!feedbackResponseId,
    staleTime: 30_000,
  });
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

export interface FeedbackSelectionOptionListResponse {
  items: FeedbackSelectionOptionDto[];
  error?: string;
}

export function useCreateFeedbackSelectionOption() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: FeedbackSelectionOptionCreateInput) => {
      const res = await fetcher<{
        option: FeedbackSelectionOptionDto;
        error?: string;
      }>(FEEDBACK_SELECTION_OPTIONS_BASE, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (res.error && !res.option) throw new Error(res.error);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feedbackConfig"] });
    },
  });
}

export function useUpdateFeedbackSelectionOption() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...payload
    }: FeedbackSelectionOptionUpdateInput & { id: string }) => {
      const res = await fetcher<{
        option: FeedbackSelectionOptionDto;
        error?: string;
      }>(`${FEEDBACK_SELECTION_OPTIONS_BASE}/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      if (res.error && !res.option) throw new Error(res.error);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feedbackConfig"] });
    },
  });
}

export function useDeleteFeedbackSelectionOption() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetcher<{ ok?: boolean; error?: string }>(
        `${FEEDBACK_SELECTION_OPTIONS_BASE}/${id}`,
        { method: "DELETE" },
      );
      if (res.error) throw new Error(res.error);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feedbackConfig"] });
    },
  });
}

export function useReorderFeedbackSelectionOptions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: FeedbackSelectionOptionReorderInput) => {
      const res = await fetcher<{ ok?: boolean; error?: string }>(
        `${FEEDBACK_SELECTION_OPTIONS_BASE}/reorder`,
        { method: "PUT", body: JSON.stringify(payload) },
      );
      if (res.error) throw new Error(res.error);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feedbackConfig"] });
    },
  });
}
