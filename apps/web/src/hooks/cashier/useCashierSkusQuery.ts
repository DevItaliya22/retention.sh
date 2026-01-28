"use client";

import { fetcher } from "@/lib/fetcher";
import { useQuery } from "@tanstack/react-query";

export interface CashierSkuItem {
  id: string;
  sku: string;
  name: string;
  price: number | null;
  unit: string | null;
}

export interface CashierSkusResponse {
  items: CashierSkuItem[];
  total: number;
  error?: string;
}

export function useCashierSkusQuery(enabled = true) {
  return useQuery<CashierSkusResponse, Error>({
    queryKey: ["cashier", "skus"],
    queryFn: () => fetcher<CashierSkusResponse>("/api/cashier/sku?perPage=500"),
    enabled,
    staleTime: 60_000,
  });
}
