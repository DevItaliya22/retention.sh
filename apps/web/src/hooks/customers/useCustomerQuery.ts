"use client";

import { fetcher } from "@/lib/fetcher";
import type { FreeItemEntry } from "@/lib/utils/free-items";
import type { IsServiceEnabled } from "@/lib/utils/service-enabled";
import { useQuery } from "@tanstack/react-query";

export interface CustomerProfile {
  id: string;
  slugId: string;
  customerId: string;
  name: string;
  email: string;
  phone: string | null;
  /** Business loyalty program type (null if not configured). */
  loyaltyType?: string | null;
  amountSpentBalance?: number;
  visitPointsBalance?: number;
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
}

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

export interface WalletTxSummary {
  id: string;
  valueKind: string;
  txType: string;
  source: string;
  amount: number;
  campaignTitle: string | null;
  freeItemName: string | null;
  createdAt: string;
}

export type CustomerActivityItem =
  | (PartnerRedemptionSummary & { type: "partner" })
  | (ReferralLogSummary & { type: "referral" })
  | (WalletTxSummary & { type: "walletTx" });

export interface CustomerProfileResponse {
  customer: CustomerProfile | null;
  error?: string;
}

export interface CustomerDetailQueryParams {
  billsPage?: number;
  billsPerPage?: number;
  activityPage?: number;
  activityPerPage?: number;
}

export function useCustomerProfileQuery(slugId: string | null) {
  return useQuery<CustomerProfileResponse, Error>({
    queryKey: ["customerProfile", slugId],
    queryFn: () =>
      fetcher<CustomerProfileResponse>(`/api/customers/${slugId}/profile`),
    enabled: !!slugId,
    staleTime: 5000,
  });
}

export interface CustomerBillsResponse {
  items: CustomerBillSummary[];
  total: number;
  page: number;
  perPage: number;
  error?: string;
}

export function useCustomerBillsQuery(
  slugId: string | null,
  params: { page: number; perPage: number },
) {
  const search = new URLSearchParams();
  search.set("billsPage", String(params.page));
  search.set("billsPerPage", String(params.perPage));
  const qs = search.toString();
  return useQuery<CustomerBillsResponse, Error>({
    queryKey: ["customerBills", slugId, qs],
    queryFn: () =>
      fetcher<CustomerBillsResponse>(`/api/customers/${slugId}/bills?${qs}`),
    enabled: !!slugId,
    staleTime: 5000,
    placeholderData: (prev) => prev,
  });
}

export interface CustomerActivityResponse {
  items: CustomerActivityItem[];
  total: number;
  page: number;
  perPage: number;
  error?: string;
}

export function useCustomerActivityQuery(
  slugId: string | null,
  params: { page: number; perPage: number },
) {
  const search = new URLSearchParams();
  search.set("activityPage", String(params.page));
  search.set("activityPerPage", String(params.perPage));
  const qs = search.toString();
  return useQuery<CustomerActivityResponse, Error>({
    queryKey: ["customerActivity", slugId, qs],
    queryFn: () =>
      fetcher<CustomerActivityResponse>(
        `/api/customers/${slugId}/activity?${qs}`,
      ),
    enabled: !!slugId,
    staleTime: 5000,
    placeholderData: (prev) => prev,
  });
}
