"use client";

import { fetcher } from "@/lib/fetcher";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";

export interface Bill {
  id: string;
  billNumber: string;
  amount: number | null;
  customerName: string;
  customerPhone: string | null;
  customerEmail: string;
  createdAt: string;
  updatedAt: string;
}

export interface BillsResponse {
  bills: Bill[];
  total: number;
  page: number;
  perPage: number;
  error?: string;
}

export function useBillsQuery() {
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();

  return useQuery<BillsResponse, Error>({
    queryKey: ["bills", queryString],
    queryFn: () => {
      const url = queryString ? `/api/bills?${queryString}` : "/api/bills";
      return fetcher<BillsResponse>(url);
    },
    placeholderData: (previousData) => previousData,
    staleTime: 5000,
  });
}
