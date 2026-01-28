"use client";

import { fetcher } from "@/lib/fetcher";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";

export interface BillLineItemSku {
  id: string;
  sku: string;
  name: string;
  price: number | null;
  unit: string | null;
}

export interface BillLineItemResponse {
  id: string;
  skuId: string;
  qty: number;
  unitPrice: number | null;
  sku: BillLineItemSku;
}

export interface Bill {
  id: string;
  billNumber: string;
  amount: number | null;
  customerName: string;
  customerPhone: string | null;
  customerEmail: string;
  lineItems: BillLineItemResponse[];
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
