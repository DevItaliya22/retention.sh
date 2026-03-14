"use client";

import { fetcher } from "@/lib/fetcher";
import {
  buildApiParams,
  getDataTableConfig,
} from "@/lib/utils/data-table-params";
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
  finalAmount?: number | null;
  userPaidAmount?: number | null;
  cashbackAmount?: number | null;
  cashbackRedeemedAmount?: number | null;
  loyaltyPointsEarned?: number;
  loyaltyPointsRedeemed?: number;
  customerName: string;
  customerPhone: string | null;
  customerEmail: string;
  feedbackLink: { token: string } | null;
  feedback: {
    rating: number | null;
    howDidYouHear: string | null;
    selectionOptions: { id: string; label: string }[];
  } | null;
  lineItems: BillLineItemResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface BillsResponse {
  bills: Bill[];
  total: number;
  page: number;
  perPage: number;
  businessSlug?: string;
  error?: string;
}

export function useBillsQuery() {
  const searchParams = useSearchParams();
  const config = getDataTableConfig("bills");
  const apiParams = buildApiParams(
    searchParams,
    config.prefix,
    config.filterKeys,
  );
  const queryString = apiParams.toString();

  return useQuery<BillsResponse, Error>({
    queryKey: ["bills", searchParams.toString()],
    queryFn: () => {
      const url = queryString ? `/api/bills?${queryString}` : "/api/bills";
      return fetcher<BillsResponse>(url);
    },
    placeholderData: (previousData) => previousData,
    staleTime: 5000,
  });
}
