"use client";

import { useCallback, useState } from "react";

type UploadType =
  | "business_logo"
  | "business_banner"
  | "campaign_logo"
  | "campaign_banner";

type UploadOptions = {
  type: UploadType;
  campaignId?: string;
};

export function useR2Upload() {
  const [isGettingUploadSignedUrl, setIsGettingUploadSignedUrl] =
    useState(false);
  const [isGettingReadSignedUrl, setIsGettingReadSignedUrl] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getUploadSignedUrl = useCallback(
    async (
      file: File,
      options: UploadOptions,
    ): Promise<{ uploadUrl: string; key: string }> => {
      setIsGettingUploadSignedUrl(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          type: options.type,
          filename: file.name,
          contentType: file.type || "application/octet-stream",
        });

        if (options.campaignId) {
          params.set("campaignId", options.campaignId);
        }

        const res = await fetch(`/api/storage/upload?${params.toString()}`, {
          method: "POST",
        });

        if (!res.ok) {
          let message = "Upload failed";
          try {
            const data = (await res.json()) as { error?: string };
            if (data?.error) {
              message = data.error;
            }
          } catch {}
          setError(message);
          throw new Error(message);
        }

        const data = (await res.json()) as { uploadUrl: string; key: string };
        return data;
      } finally {
        setIsGettingUploadSignedUrl(false);
      }
    },
    [],
  );

  const getReadSignedUrl = useCallback(async (src: string): Promise<string> => {
    setIsGettingReadSignedUrl(true);
    setError(null);
    try {
      const trimmed = src.trim();
      const res = await fetch(
        `/api/storage/signed-url?src=${encodeURIComponent(trimmed)}`,
      );
      if (!res.ok) {
        let message = "Failed to resolve image URL";
        try {
          const data = (await res.json()) as { error?: string };
          if (data?.error) {
            message = data.error;
          }
        } catch {}
        setError(message);
        throw new Error(message);
      }

      const data = (await res.json()) as { url: string };
      return data.url;
    } finally {
      setIsGettingReadSignedUrl(false);
    }
  }, []);

  return {
    isGettingUploadSignedUrl,
    isGettingReadSignedUrl,
    error,
    getUploadSignedUrl,
    getReadSignedUrl,
  };
}
