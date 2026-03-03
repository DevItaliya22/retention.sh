"use client";

import { useDataTableQuery } from "@/hooks/useDataTableQuery";

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

export interface CategoriesResponse {
  items: CategoryItem[];
  total: number;
  page: number;
  perPage: number;
  error?: string;
}

export function useCategoriesQuery() {
  return useDataTableQuery<CategoriesResponse>(
    "categories",
    "categories",
    "/api/categories",
  );
}
