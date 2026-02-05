"use client";

import { fetcher } from "@/lib/fetcher";
import { SLUG_MAX_LENGTH, SLUG_MIN_LENGTH } from "@/lib/utils/slug";
import { useQuery } from "@tanstack/react-query";
import slugify from "slugify";

export type BusinessSlugAvailabilityResponse = {
  available: boolean;
};

export default function useBusinessSlugAvailability(slug: string) {
  const normalized = slugify((slug ?? "").trim(), {
    lower: true,
    strict: true,
    trim: true,
  });
  const isValid =
    normalized.length >= SLUG_MIN_LENGTH &&
    normalized.length <= SLUG_MAX_LENGTH &&
    /^[a-z0-9-]+$/.test(normalized) &&
    !normalized.startsWith("-");

  return useQuery<BusinessSlugAvailabilityResponse, Error>({
    queryKey: ["businessSlugAvailability", normalized],
    enabled: isValid,
    queryFn: async () => {
      return fetcher<BusinessSlugAvailabilityResponse>(
        `/api/onboarding/business-slug?slug=${encodeURIComponent(normalized)}`,
      );
    },
  });
}
