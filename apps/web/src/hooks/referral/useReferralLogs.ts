"use client";

import { fetcher } from "@/lib/fetcher";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";

export interface ReferralLog {
  id: string;
  newCustomerPhone: string;
  newCustomerName: string | null;
  becameCustomer: boolean;
  referredCustomerSlugId?: string | null;
  /** Present only when not filtering by referrerSlugId */
  slug?: string;
  referrerBusinessId?: string;
  referrerCustomerId?: string;
  rewardPoints?: number;
  createdAt?: string;
  referrer?: {
    customer: {
      user: {
        name: string;
        phoneNumber: string | null;
      };
    };
  };
}

export interface ReferralLogsResponse {
  items: ReferralLog[];
  total: number;
  page: number;
  perPage: number;
  error?: string;
}

export function useReferralLogs() {
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();

  return useQuery<ReferralLogsResponse, Error>({
    queryKey: ["referralLogs", queryString],
    queryFn: () =>
      fetcher<ReferralLogsResponse>(`/api/referral/logs?${queryString}`),
    placeholderData: (prev) => prev,
    staleTime: 5000,
  });
}

/** Fetch referral logs for a specific referrer (e.g. for expanded row). */
export function useReferralLogsByReferrer(referrerSlugId: string | null) {
  return useQuery<ReferralLogsResponse, Error>({
    queryKey: ["referralLogsByReferrer", referrerSlugId],
    queryFn: () =>
      fetcher<ReferralLogsResponse>(
        `/api/referral/logs?referrerSlugId=${encodeURIComponent(referrerSlugId!)}&perPage=100`,
      ),
    enabled: !!referrerSlugId,
    staleTime: 5000,
  });
}
