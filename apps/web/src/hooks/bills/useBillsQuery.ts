"use client";

import { useDataTableQuery } from "@/hooks/useDataTableQuery";

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
  return useDataTableQuery<BillsResponse>("bills", "bills", "/api/bills");
}
