"use client";

import { fetcher } from "@/lib/fetcher";
import { useQuery } from "@tanstack/react-query";

function isR2PrivateSrc(src: string) {
  return (
    src.includes(".r2.cloudflarestorage.com/") ||
    src.startsWith("business/") ||
    src.startsWith("private/business/")
  );
}

export function useSignedImageUrl(src?: string | null) {
  const trimmed = src?.trim() || "";

  const query = useQuery({
    queryKey: ["signed-image-url", trimmed],
    queryFn: async () => {
      const data = await fetcher<{ url: string }>(
        `/api/storage/signed-url?src=${encodeURIComponent(trimmed)}`,
      );
      return data.url;
    },
    enabled:
      trimmed.length > 0 &&
      !trimmed.startsWith("blob:") &&
      isR2PrivateSrc(trimmed),
    staleTime: 1000 * 60 * 4,
  });

  if (!trimmed) return null;
  if (trimmed.startsWith("blob:")) return trimmed;
  if (!isR2PrivateSrc(trimmed)) return trimmed;
  return query.data || null;
}
