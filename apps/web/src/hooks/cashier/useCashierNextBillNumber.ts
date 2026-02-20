"use client";

import { fetcher } from "@/lib/fetcher";
import { useQuery } from "@tanstack/react-query";

export interface NextBillNumberResponse {
  nextBillNumber: number;
  error?: string;
}

export function useCashierNextBillNumber() {
  return useQuery<NextBillNumberResponse, Error>({
    queryKey: ["cashier", "nextBillNumber"],
    queryFn: () =>
      fetcher<NextBillNumberResponse>("/api/cashier/next-bill-number"),
    staleTime: 0,
  });
}
