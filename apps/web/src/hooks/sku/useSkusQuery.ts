"use client";

import { fetcher } from "@/lib/fetcher";
import {
  buildApiParams,
  getDataTableConfig,
} from "@/lib/utils/data-table-params";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";

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

export interface SkusResponse {
  items: SkuItem[];
  total: number;
  page: number;
  perPage: number;
  error?: string;
}

export function useSkusQuery() {
  const searchParams = useSearchParams();
  const config = getDataTableConfig("skus");
  const apiParams = buildApiParams(
    searchParams,
    config.prefix,
    config.filterKeys,
  );
  const queryString = apiParams.toString();

  return useQuery<SkusResponse, Error>({
    queryKey: ["skus", searchParams.toString()],
    queryFn: () => {
      const url = queryString ? `/api/sku?${queryString}` : "/api/sku";
      return fetcher<SkusResponse>(url);
    },
    placeholderData: (previousData) => previousData,
    staleTime: 5000,
  });
}

/** Fetch active SKUs for dropdowns (e.g. referral free item, loyalty reward stage). */
export function useActiveSkusForSelect() {
  return useQuery<SkusResponse, Error>({
    queryKey: ["skus", "active", "select"],
    queryFn: () =>
      fetcher<SkusResponse>("/api/sku?isActive=true&perPage=100&sort=name:asc"),
    staleTime: 30000,
  });
}
