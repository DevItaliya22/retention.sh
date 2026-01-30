"use client";

import { fetcher } from "@/lib/fetcher";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CreateReferralProgramInput,
  UpdateReferralProgramInput,
} from "@/lib/schemas/referral";

export interface ReferralProgram {
  id: string;
  businessId: string;
  isEnabled: boolean;
  newCustomerBenefitType: string;
  newCustomerBenefitValue: number;
  newCustomerBenefitExpiresInDays: number | null;
  existingCustomerBenefitType: string;
  existingCustomerBenefitValue: number;
  existingCustomerBenefitExpiresInDays: number | null;
  sendReminderToCustomer: boolean;
  informationSections: Array<{ title: string; content: string }>;
  branding: {
    logo?: string | null;
    themeColor?: string | null;
    textColor?: string | null;
    bannerImage?: string | null;
    header?: string | null;
    subtitle?: string | null;
  } | null;
  termsAndConditionsNewCustomer: Array<{ id: string; content: string }>;
  termsAndConditionsExistingCustomer: Array<{ id: string; content: string }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReferralProgramResponse {
  referralProgram: ReferralProgram | null;
  error?: string;
}

export function useReferralProgram() {
  return useQuery<ReferralProgramResponse, Error>({
    queryKey: ["referralProgram"],
    queryFn: () => fetcher<ReferralProgramResponse>("/api/referral/program"),
    placeholderData: (prev) => prev,
    staleTime: 5000,
  });
}

export interface PublicReferralProgramResponse {
  referralProgram: ReferralProgram | null;
  business: {
    name: string;
    slug: string;
    defaultPointsName: string;
    defaultCurrencySymbol: string;
    defaultCurrencyCode: string;
  } | null;
  error?: string;
}

export function usePublicReferralProgram(businessSlug: string) {
  return useQuery<PublicReferralProgramResponse, Error>({
    queryKey: ["publicReferralProgram", businessSlug],
    queryFn: () =>
      fetcher<PublicReferralProgramResponse>(
        `/api/referral/program/${businessSlug}`,
      ),
    enabled: !!businessSlug,
    placeholderData: (prev) => prev,
    staleTime: 5000,
  });
}

export interface CreateReferralProgramResponse {
  referralProgram: ReferralProgram | null;
  error?: string;
}

export function useCreateReferralProgram() {
  const queryClient = useQueryClient();

  return useMutation<
    CreateReferralProgramResponse,
    Error,
    CreateReferralProgramInput
  >({
    mutationFn: async (payload: CreateReferralProgramInput) => {
      return fetcher<CreateReferralProgramResponse>("/api/referral/program", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: (data) => {
      queryClient.setQueryData<ReferralProgramResponse | undefined>(
        ["referralProgram"],
        (existing) => {
          if (!data.referralProgram) {
            return { referralProgram: null, error: data.error };
          }
          return {
            referralProgram: data.referralProgram,
            error: data.error ?? existing?.error,
          };
        },
      );
    },
  });
}

export interface UpdateReferralProgramResponse {
  referralProgram: ReferralProgram | null;
  error?: string;
}

export function useUpdateReferralProgram() {
  const queryClient = useQueryClient();

  return useMutation<
    UpdateReferralProgramResponse,
    Error,
    UpdateReferralProgramInput
  >({
    mutationFn: async (payload: UpdateReferralProgramInput) => {
      return fetcher<UpdateReferralProgramResponse>("/api/referral/program", {
        method: "PUT",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: (data) => {
      if (data.referralProgram) {
        queryClient.setQueryData<ReferralProgramResponse | undefined>(
          ["referralProgram"],
          (existing) => ({
            referralProgram:
              data.referralProgram ?? existing?.referralProgram ?? null,
            error: data.error ?? existing?.error,
          }),
        );
      }
    },
  });
}
