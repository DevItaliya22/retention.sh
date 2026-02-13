"use client";

import { fetcher } from "@/lib/fetcher";
import { useQuery } from "@tanstack/react-query";

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

export interface BillLoyaltyLog {
  id: string;
  valueKind?: string;
  type: string;
  source: string;
  amount: number;
  createdAt: string;
}

export interface BillDetail {
  id: string;
  billNumber: string;
  /** Legacy: same as finalAmount for display */
  amount: number | null;
  subtotal?: number | null;
  storeDiscount?: number | null;
  tax?: number[];
  finalAmount?: number | null;
  cashbackAmount?: number | null;
  cashbackRedeemedAmount?: number | null;
  userPaidAmount?: number | null;
  loyaltyPointsEarned?: number;
  loyaltyPointsRedeemed?: number;
  /** BusinessCustomer slugId for /customers/[slugId] link */
  businessCustomerId: string;
  customerName: string;
  customerPhone: string | null;
  customerEmail: string;
  feedbackLink: { token: string } | null;
  lineItems: BillLineItemResponse[];
  createdAt: string;
  updatedAt: string;
  loyaltyLogs?: BillLoyaltyLog[];
}

export interface BillDetailResponse {
  bill: BillDetail | null;
  businessSlug?: string;
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
