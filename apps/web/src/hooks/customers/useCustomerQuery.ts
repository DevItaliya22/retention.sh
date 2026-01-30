"use client";

import { fetcher } from "@/lib/fetcher";
import { useQuery } from "@tanstack/react-query";

export interface CustomerBillLineItemSku {
  id: string;
  sku: string;
  name: string;
  price: number | null;
  unit: string | null;
}

export interface CustomerBillLineItem {
  id: string;
  skuId: string;
  qty: number;
  unitPrice: number | null;
  sku: CustomerBillLineItemSku;
}

export interface CustomerBillSummary {
  id: string;
  billNumber: string;
  amount: number | null;
  lineItems?: CustomerBillLineItem[];
  createdAt: string;
}

export interface ReferralLogSummary {
  id: string;
  newCustomerName: string | null;
  newCustomerPhone: string;
  becameCustomer: boolean;
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
  businessSlug?: string;
  referralSlug?: string;
  referralEnabled?: boolean;
  referredBy?: { name: string; slugId: string } | null;
  referrals?: { name: string; slugId: string }[];
  referralLogs?: ReferralLogSummary[];
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
