"use client";

import { fetcher } from "@/lib/fetcher";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";

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
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();

  return useQuery<CategoriesResponse, Error>({
    queryKey: ["categories", queryString],
    queryFn: () => {
      const url = queryString
        ? `/api/categories?${queryString}`
        : "/api/categories";
      return fetcher<CategoriesResponse>(url);
    },
    placeholderData: (previousData) => previousData,
    staleTime: 5000,
  });
}
