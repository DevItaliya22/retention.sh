"use client";

import { fetcher } from "@/lib/fetcher";
import type {
  CreateSkuInput,
  SkuImportInput,
  UpdateSkuInput,
} from "@/lib/schemas/sku";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export interface SkuImportResponse {
  created: number;
  failed: number;
  errors: { row: number; sku: string; message: string }[];
  error?: string;
}

export interface SkuItem {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  price: number | null;
  unit: string | null;
  categoryId: string | null;
  categoryName: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SkuResponse {
  item: SkuItem | null;
  error?: string;
}

export function useManageSku() {
  const queryClient = useQueryClient();

  const create = useMutation<SkuResponse, Error, CreateSkuInput>({
    mutationFn: async (input) => {
      return fetcher<SkuResponse>("/api/sku", {
        method: "POST",
        body: JSON.stringify(input),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["skus"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  const update = useMutation<
    SkuResponse,
    Error,
    { id: string; data: UpdateSkuInput }
  >({
    mutationFn: async ({ id, data }) => {
      return fetcher<SkuResponse>(`/api/sku/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["skus"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  const remove = useMutation<
    { success: boolean; error?: string },
    Error,
    string
  >({
    mutationFn: async (id) => {
      return fetcher<{ success: boolean; error?: string }>(`/api/sku/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["skus"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  const importSkus = useMutation<SkuImportResponse, Error, SkuImportInput>({
    mutationFn: async (input) => {
      return fetcher<SkuImportResponse>("/api/sku/import", {
        method: "POST",
        body: JSON.stringify(input),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["skus"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  return {
    create: {
      mutate: create.mutate,
      mutateAsync: create.mutateAsync,
      isPending: create.isPending,
      isError: create.isError,
      error: create.error,
    },
    update: {
      mutate: update.mutate,
      mutateAsync: update.mutateAsync,
      isPending: update.isPending,
      isError: update.isError,
      error: update.error,
    },
    delete: {
      mutate: remove.mutate,
      mutateAsync: remove.mutateAsync,
      isPending: remove.isPending,
      isError: remove.isError,
      error: remove.error,
    },
    import: {
      mutate: importSkus.mutate,
      mutateAsync: importSkus.mutateAsync,
      isPending: importSkus.isPending,
      isError: importSkus.isError,
      error: importSkus.error,
    },
  };
}
