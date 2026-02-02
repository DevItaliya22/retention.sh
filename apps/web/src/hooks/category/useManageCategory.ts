"use client";

import { fetcher } from "@/lib/fetcher";
import type {
  CategoryImportInput,
  CreateCategoryInput,
  UpdateCategoryInput,
} from "@/lib/schemas/sku";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export interface CategoryImportResponse {
  created: number;
  failed: number;
  errors: { row: number; name: string; message: string }[];
  error?: string;
}

export interface CategoryItem {
  id: string;
  parentId: string | null;
  parentName: string | null;
  name: string;
  description: string | null;
  sortOrder: number;
  skuCount: number;
  subcategoryCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryResponse {
  item: CategoryItem | null;
  error?: string;
}

export function useManageCategory() {
  const queryClient = useQueryClient();

  const create = useMutation<CategoryResponse, Error, CreateCategoryInput>({
    mutationFn: async (input) => {
      return fetcher<CategoryResponse>("/api/categories", {
        method: "POST",
        body: JSON.stringify(input),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["skus"] });
    },
  });

  const update = useMutation<
    CategoryResponse,
    Error,
    { id: string; data: UpdateCategoryInput }
  >({
    mutationFn: async ({ id, data }) => {
      return fetcher<CategoryResponse>(`/api/categories/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["skus"] });
    },
  });

  const remove = useMutation<
    { success: boolean; error?: string },
    Error,
    string
  >({
    mutationFn: async (id) => {
      return fetcher<{ success: boolean; error?: string }>(
        `/api/categories/${id}`,
        { method: "DELETE" },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["skus"] });
    },
  });

  const importCategories = useMutation<
    CategoryImportResponse,
    Error,
    CategoryImportInput
  >({
    mutationFn: async (input) => {
      return fetcher<CategoryImportResponse>("/api/categories/import", {
        method: "POST",
        body: JSON.stringify(input),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["skus"] });
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
      mutate: importCategories.mutate,
      mutateAsync: importCategories.mutateAsync,
      isPending: importCategories.isPending,
      isError: importCategories.isError,
      error: importCategories.error,
    },
  };
}
