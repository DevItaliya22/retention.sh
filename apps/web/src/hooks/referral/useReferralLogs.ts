"use client";

import { fetcher } from "@/lib/fetcher";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ReferralQueryInput } from "@/lib/schemas/referral";

export interface ReferralLog {
  id: string;
  slug: string;
  referrerBusinessId: string;
  referrerCustomerId: string;
  newCustomerPhone: string;
  newCustomerName: string | null;
  becameCustomer: boolean;
  rewardPoints: number;
  createdAt: Date;
  referrer: {
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
