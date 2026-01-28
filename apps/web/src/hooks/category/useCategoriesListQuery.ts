"use client";

import { fetcher } from "@/lib/fetcher";
import { useQuery } from "@tanstack/react-query";
import type { CategoryItem } from "./useCategoriesQuery";

export interface CategoriesListResponse {
  items: CategoryItem[];
  total: number;
  page: number;
  perPage: number;
}

export function useCategoriesListQuery() {
  return useQuery<CategoriesListResponse, Error>({
    queryKey: ["categories", "list"],
    queryFn: () =>
      fetcher<CategoriesListResponse>("/api/categories?perPage=500"),
    staleTime: 30000,
  });
}
