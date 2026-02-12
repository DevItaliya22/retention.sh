"use client";

import { fetcher } from "@/lib/fetcher";
import {
  buildApiParams,
  getDataTableConfig,
} from "@/lib/utils/data-table-params";
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
  cashbackBalance: number;
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
  const config = getDataTableConfig("customers");
  const apiParams = buildApiParams(
    searchParams,
    config.prefix,
    config.filterKeys,
  );
  const queryString = apiParams.toString();

  return useQuery<CustomersResponse, Error>({
    queryKey: ["customers", searchParams.toString()],
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
