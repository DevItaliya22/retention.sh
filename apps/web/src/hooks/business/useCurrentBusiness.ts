"use client";

import { fetcher } from "@/lib/fetcher";
import type { IsServiceEnabled } from "@/lib/utils/service-enabled";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface CurrentBusinessBranding {
  id: string;
  logo: string | null;
  themeColor: string | null;
  textColor: string | null;
  bannerImage: string | null;
  header: string | null;
  subtitle: string | null;
}

export interface CurrentBusiness {
  id: string;
  name: string;
  slug: string;
  website?: string | null;
  defaultPointsName: string;
  defaultCurrencySymbol: string;
  defaultCurrencyCode: string;
  useDefaultBrandingForServices: boolean;
  registrationBonusPoints: number;
  nextBillNumber: number;
  defaultBranding?: CurrentBusinessBranding | null;
  isServiceEnabled?: IsServiceEnabled | null;
  referralProgram?: { id: string } | null;
  loyalty?: { id: string } | null;
  feedbackConfig?: { id: string } | null;
}

export interface CurrentBusinessResponse {
  business: CurrentBusiness | null;
  error?: string;
}

export function useCurrentBusiness() {
  return useQuery<CurrentBusinessResponse, Error>({
    queryKey: ["currentBusiness"],
    queryFn: () => fetcher<CurrentBusinessResponse>("/api/business/current"),
  });
}

export interface UpdateBusinessBrandingInput {
  logo?: string | null;
  themeColor?: string | null;
  textColor?: string | null;
  bannerImage?: string | null;
  header?: string | null;
  subtitle?: string | null;
}

export interface UpdateBusinessInput {
  name?: string;
  website?: string | null;
  defaultPointsName?: string;
  defaultCurrencySymbol?: string;
  defaultCurrencyCode?: string;
  useDefaultBrandingForServices?: boolean;
  registrationBonusPoints?: number;
  nextBillNumber?: number;
  serviceEnabled?: IsServiceEnabled;
  defaultBranding?: UpdateBusinessBrandingInput;
}

export interface UpdateBusinessResponse {
  business: CurrentBusiness | null;
  error?: string;
}

export function useUpdateBusiness() {
  const queryClient = useQueryClient();

  return useMutation<UpdateBusinessResponse, Error, UpdateBusinessInput>({
    mutationFn: async (payload: UpdateBusinessInput) => {
      return fetcher<UpdateBusinessResponse>("/api/business/current", {
        method: "PUT",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData<CurrentBusinessResponse | undefined>(
        ["currentBusiness"],
        (existing) => {
          if (!data.business) {
            return { business: null, error: data.error };
          }
          return {
            business: data.business,
            error: data.error ?? existing?.error,
          };
        },
      );
      const shouldRefreshServiceBranding =
        variables.defaultBranding !== undefined ||
        variables.useDefaultBrandingForServices === true;
      if (shouldRefreshServiceBranding) {
        queryClient.invalidateQueries({ queryKey: ["loyalty-settings"] });
        queryClient.invalidateQueries({ queryKey: ["feedbackConfig"] });
      }
    },
  });
}
