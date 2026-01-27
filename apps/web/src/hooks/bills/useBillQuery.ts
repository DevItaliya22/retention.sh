"use client";

import { fetcher } from "@/lib/fetcher";
import { useQuery } from "@tanstack/react-query";

export interface BillDetail {
  id: string;
  billNumber: string;
  amount: number | null;
  /** BusinessCustomer slugId for /customers/[id] link */
  businessCustomerId: string;
  customerName: string;
  customerPhone: string | null;
  customerEmail: string;
  createdAt: string;
  updatedAt: string;
}

export interface BillDetailResponse {
  bill: BillDetail | null;
  error?: string;
}

export function useBillQuery(billId: string | null) {
  return useQuery<BillDetailResponse, Error>({
    queryKey: ["bill", billId],
    queryFn: () => fetcher<BillDetailResponse>(`/api/bills/${billId}`),
    enabled: !!billId,
    staleTime: 5000,
  });
}
