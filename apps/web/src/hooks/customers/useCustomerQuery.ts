"use client";

import { fetcher } from "@/lib/fetcher";
import type { FreeItemEntry } from "@/lib/utils/free-items";
import type { IsServiceEnabled } from "@/lib/utils/service-enabled";
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
  finalAmount?: number | null;
  userPaidAmount?: number | null;
  cashbackAmount?: number | null;
  cashbackRedeemedAmount?: number | null;
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

/** Log when this customer used our balance at a partner store (we are the partner; they redeemed at another business). */
export interface PartnerRedemptionSummary {
  id: string;
  amount: number;
  valueKind: string;
  redeemedAtBusinessId: string;
  redeemedAtBusinessName: string | null;
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
  cashbackBalance?: number;
  /** Unclaimed free items (e.g. from referral) to claim on next visit. */
  freeItems?: FreeItemEntry[];
  createdAt: string;
  updatedAt: string;
  businessSlug?: string;
  referralSlug?: string;
  isServiceEnabled?: IsServiceEnabled | null;
  referredBy?: { name: string; slugId: string } | null;
  referrals?: { name: string; slugId: string }[];
  referralLogs?: ReferralLogSummary[];
  bills: CustomerBillSummary[];
  /** This customer used our balance at these partner stores (for analytics). */
  partnerRedemptions?: PartnerRedemptionSummary[];
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
