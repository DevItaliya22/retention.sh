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
  valueKind: string;
  amount: number;
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

export function useLoyaltyStatsQuery(options?: { enabled?: boolean }) {
  const searchParams = useSearchParams();
  const config = getDataTableConfig("loyaltyStats");
  const apiParams = buildApiParams(
    searchParams,
    config.prefix,
    config.filterKeys,
  );
  const queryString = apiParams.toString();
  const enabled = options?.enabled !== false;

  return useQuery<LoyaltyStatsResponse, Error>({
    queryKey: ["loyaltyStats", queryString],
    queryFn: () =>
      fetcher<LoyaltyStatsResponse>(
        queryString
          ? `/api/loyalty-stats?${queryString}`
          : "/api/loyalty-stats",
      ),
    enabled,
    placeholderData: (prev) => prev,
    staleTime: 5000,
  });
}
