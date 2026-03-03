"use client";

import { useDataTableQuery } from "@/hooks/useDataTableQuery";
import { fetcher } from "@/lib/fetcher";
import { useQuery } from "@tanstack/react-query";

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
  return useDataTableQuery<SkusResponse>("skus", "skus", "/api/sku");
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
