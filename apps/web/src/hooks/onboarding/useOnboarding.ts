"use client";

import { fetcher } from "@/lib/fetcher";
import { type WelcomeFormValues } from "@/lib/schemas/onboarding";
import { useMutation } from "@tanstack/react-query";
import { useRef } from "react";

export interface OnboardingResponse {
  success: boolean;
  error?: string;
}

export default function useOnboarding() {
  const submittingRef = useRef(false);

  return useMutation<OnboardingResponse, Error, WelcomeFormValues>({
    mutationFn: async (values: WelcomeFormValues) => {
      if (submittingRef.current) {
        return { success: true };
      }
      submittingRef.current = true;
      try {
        return await fetcher<OnboardingResponse>("/api/onboarding", {
          method: "POST",
          body: JSON.stringify(values),
        });
      } finally {
        submittingRef.current = false;
      }
    },
  });
}
