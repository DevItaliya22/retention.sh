"use client";

import { fetcher } from "@/lib/fetcher";
import {
  buildApiParams,
  getDataTableConfig,
} from "@/lib/utils/data-table-params";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";

export interface LoyaltyStatRow {
  id: string;
  type: string;
  source: string;
  amount: number;
  balanceAfter: number;
  createdAt: string;
  customerSlugId: string;
  customerName: string;
  customerPhone: string | null;
  billId: string | null;
  billNumber: string | null;
}

export interface LoyaltyStatsResponse {
  items: LoyaltyStatRow[];
  total: number;
  page: number;
  perPage: number;
  error?: string;
}

export function useLoyaltyStatsQuery() {
  const searchParams = useSearchParams();
  const config = getDataTableConfig("loyaltyStats");
  const apiParams = buildApiParams(
    searchParams,
    config.prefix,
    config.filterKeys,
  );
  const queryString = apiParams.toString();

  return useQuery<LoyaltyStatsResponse, Error>({
    queryKey: ["loyaltyStats", queryString],
    queryFn: () =>
      fetcher<LoyaltyStatsResponse>(
        queryString
          ? `/api/loyalty-stats?${queryString}`
          : "/api/loyalty-stats",
      ),
    placeholderData: (prev) => prev,
    staleTime: 5000,
  });
}
