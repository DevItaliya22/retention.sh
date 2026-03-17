"use client";

import { useCallback, useState } from "react";

type UploadType =
  | "avatar"
  | "business_logo"
  | "business_banner"
  | "bill_receipt";

type UploadResult = {
  url: string;
  key?: string;
  contentType?: string;
};

type UploadOptions = {
  type: UploadType;
  billId?: string;
};

export function useR2Upload() {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = useCallback(
    async (file: File, options: UploadOptions): Promise<UploadResult> => {
      setIsUploading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          type: options.type,
          filename: file.name,
          contentType: file.type || "application/octet-stream",
        });

        if (options.type === "bill_receipt" && options.billId) {
          params.set("billId", options.billId);
        }

        const res = await fetch(`/api/storage/upload?${params.toString()}`, {
          method: "POST",
          headers: {
            "content-type": "application/octet-stream",
          },
          body: await file.arrayBuffer(),
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

        const data = (await res.json()) as UploadResult;
        return data;
      } finally {
        setIsUploading(false);
      }
    },
    [],
  );

  return {
    isUploading,
    error,
    uploadFile,
  };
}
