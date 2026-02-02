"use client";

import { fetcher } from "@/lib/fetcher";
import {
  buildApiParams,
  getDataTableConfig,
} from "@/lib/utils/data-table-params";
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
  const config = getDataTableConfig("categories");
  const apiParams = buildApiParams(
    searchParams,
    config.prefix,
    config.filterKeys,
  );
  const queryString = apiParams.toString();

  return useQuery<CategoriesResponse, Error>({
    queryKey: ["categories", searchParams.toString()],
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
