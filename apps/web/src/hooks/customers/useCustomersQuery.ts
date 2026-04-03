"use client";

import { useDataTableQuery } from "@/hooks/useDataTableQuery";

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
  visitCount: number;
  totalSpent: number;
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
  return useDataTableQuery<CustomersResponse>(
    "customers",
    "customers",
    "/api/customers",
  );
}
