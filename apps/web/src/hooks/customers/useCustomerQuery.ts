"use client";

import { fetcher } from "@/lib/fetcher";
import { useQuery } from "@tanstack/react-query";

export interface CustomerBillSummary {
  id: string;
  billNumber: string;
  amount: number | null;
  createdAt: string;
}

export interface CustomerDetail {
  id: string;
  slugId: string;
  customerId: string;
  name: string;
  email: string;
  phone: string | null;
  pointsBalance: number;
  createdAt: string;
  updatedAt: string;
  bills: CustomerBillSummary[];
}

export interface CustomerDetailResponse {
  customer: CustomerDetail | null;
  error?: string;
}

export function useCustomerQuery(slugId: string | null) {
  return useQuery<CustomerDetailResponse, Error>({
    queryKey: ["customer", slugId],
    queryFn: () => fetcher<CustomerDetailResponse>(`/api/customers/${slugId}`),
    enabled: !!slugId,
    staleTime: 5000,
  });
}
