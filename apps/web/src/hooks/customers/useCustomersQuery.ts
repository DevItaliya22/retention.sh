"use client";

import { fetcher } from "@/lib/fetcher";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";

export interface Customer {
  /** BusinessCustomer slugId – use for /customers/[slugId] links */
  id: string;
  slugId: string;
  customerId: string;
  name: string;
  email: string;
  phone: string | null;
  pointsBalance: number;
  createdAt: string;
  updatedAt: string;
}

export interface CustomersResponse {
  items: Customer[];
  total: number;
  page: number;
  perPage: number;
  error?: string;
}

export function useCustomersQuery() {
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();

  return useQuery<CustomersResponse, Error>({
    queryKey: ["customers", queryString],
    queryFn: () => {
      const url = queryString
        ? `/api/customers?${queryString}`
        : "/api/customers";
      return fetcher<CustomersResponse>(url);
    },
    placeholderData: (previousData) => previousData,
    staleTime: 5000,
  });
}
