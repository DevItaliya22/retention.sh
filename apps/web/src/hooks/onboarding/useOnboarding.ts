"use client";

import { fetcher } from "@/lib/fetcher";
import { type WelcomeFormValues } from "@/lib/schemas/onboarding";
import { useMutation } from "@tanstack/react-query";

export interface OnboardingResponse {
  success: boolean;
  error?: string;
}

/**
 * Hook to submit onboarding form data
 */
export default function useOnboarding() {
  return useMutation<OnboardingResponse, Error, WelcomeFormValues>({
    mutationFn: async (values: WelcomeFormValues) => {
      return fetcher<OnboardingResponse>("/api/onboarding", {
        method: "POST",
        body: JSON.stringify(values),
      });
    },
  });
}
