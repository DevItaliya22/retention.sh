"use client";

import { fetcher } from "@/lib/fetcher";
import {
  buildApiParams,
  getDataTableConfig,
} from "@/lib/utils/data-table-params";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";

export interface Cashier {
  id: string;
  userId: string;
  name: string;
  email: string | null;
  cashierLinkSlug: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CashiersResponse {
  cashiers: Cashier[];
  total: number;
  page: number;
  perPage: number;
  error?: string;
}

export function useCashiersQuery() {
  const searchParams = useSearchParams();
  const config = getDataTableConfig("cashiers");
  const apiParams = buildApiParams(
    searchParams,
    config.prefix,
    config.filterKeys,
  );
  const queryString = apiParams.toString();

  return useQuery<CashiersResponse, Error>({
    queryKey: ["cashiers", searchParams.toString()],
    queryFn: () => {
      const url = queryString ? `/api/cashier?${queryString}` : "/api/cashier";
      return fetcher<CashiersResponse>(url);
    },
    placeholderData: (previousData) => previousData,
    staleTime: 5000,
  });
}
