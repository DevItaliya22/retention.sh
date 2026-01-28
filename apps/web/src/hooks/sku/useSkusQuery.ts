"use client";

import { fetcher } from "@/lib/fetcher";
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
  const queryString = searchParams.toString();

  return useQuery<SkusResponse, Error>({
    queryKey: ["skus", queryString],
    queryFn: () => {
      const url = queryString ? `/api/sku?${queryString}` : "/api/sku";
      return fetcher<SkusResponse>(url);
    },
    placeholderData: (previousData) => previousData,
    staleTime: 5000,
  });
}
