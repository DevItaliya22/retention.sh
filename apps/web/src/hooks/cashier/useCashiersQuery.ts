"use client";

import { fetcher } from "@/lib/fetcher";
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
  const queryString = searchParams.toString();

  return useQuery<CashiersResponse, Error>({
    queryKey: ["cashiers", queryString],
    queryFn: () => {
      const url = queryString ? `/api/cashier?${queryString}` : "/api/cashier";
      return fetcher<CashiersResponse>(url);
    },
    placeholderData: (previousData) => previousData,
    staleTime: 5000,
  });
}
