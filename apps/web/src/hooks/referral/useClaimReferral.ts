"use client";

import { fetcher } from "@/lib/fetcher";
import { useMutation } from "@tanstack/react-query";
import { ClaimReferralInput } from "@/lib/schemas/referral";

export interface ClaimReferralResponse {
  success: boolean;
  data?: {
    businessCustomer: {
      id: string;
      slugId: string;
      referralSlug: string;
    };
    referrerPoints: number;
    referredPoints: number;
    businessName: string;
  };
  error?: string;
  alreadyExists?: boolean;
}

export function useClaimReferral() {
  return useMutation<ClaimReferralResponse, Error, ClaimReferralInput>({
    mutationFn: async (payload: ClaimReferralInput) => {
      return fetcher<ClaimReferralResponse>("/api/referral/claim", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
  });
}
