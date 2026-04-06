"use client";

import { fetcher } from "@/lib/fetcher";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";

export interface CashierBill {
  id: string;
  billNumber: string;
  amount: number | null;
  customerName: string;
  customerPhone: string | null;
  customerEmail: string;
  createdAt: string;
}

export interface CashierBillsResponse {
  bills: CashierBill[];
  total: number;
  page: number;
  perPage: number;
  error?: string;
}

export function useCashierBillsQuery() {
  const searchParams = useSearchParams();
  const page = searchParams.get("page") || "1";
  const perPage = searchParams.get("perPage") || "10";

  return useQuery<CashierBillsResponse, Error>({
    queryKey: ["cashier", "bills", page, perPage],
    queryFn: () =>
      fetcher<CashierBillsResponse>(
        `/api/cashier/bills?page=${page}&perPage=${perPage}`,
      ),
    placeholderData: (previousData) => previousData,
  });
}
