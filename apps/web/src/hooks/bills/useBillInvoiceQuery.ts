"use client";

import { fetcher } from "@/lib/fetcher";
import type { BillInvoiceResponse } from "@/lib/schemas/invoice";
import { useQuery } from "@tanstack/react-query";

export function useBillInvoiceQuery(billId: string | null) {
  return useQuery<BillInvoiceResponse, Error>({
    queryKey: ["bill-invoice", billId],
    queryFn: () => fetcher<BillInvoiceResponse>(`/api/bills/${billId}/invoice`),
    enabled: !!billId,
    staleTime: 10000,
  });
}
