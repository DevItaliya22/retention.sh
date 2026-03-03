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

/** Activity item: partner redemption or referral log (merged, sorted by date). */
export type CustomerActivityItem =
  | (PartnerRedemptionSummary & { type: "partner" })
  | (ReferralLogSummary & { type: "referral" });

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
  billsTotal: number;
  activityItems: CustomerActivityItem[];
  activityTotal: number;
}

export interface CustomerDetailResponse {
  customer: CustomerDetail | null;
  error?: string;
}

export interface CustomerDetailQueryParams {
  billsPage?: number;
  billsPerPage?: number;
  activityPage?: number;
  activityPerPage?: number;
}

export function useCustomerQuery(
  slugId: string | null,
  params?: CustomerDetailQueryParams,
) {
  const search = new URLSearchParams();
  if (params?.billsPage != null)
    search.set("billsPage", String(params.billsPage));
  if (params?.billsPerPage != null)
    search.set("billsPerPage", String(params.billsPerPage));
  if (params?.activityPage != null)
    search.set("activityPage", String(params.activityPage));
  if (params?.activityPerPage != null)
    search.set("activityPerPage", String(params.activityPerPage));
  const queryString = search.toString();
  const url = queryString
    ? `/api/customers/${slugId}?${queryString}`
    : `/api/customers/${slugId}`;

  return useQuery<CustomerDetailResponse, Error>({
    queryKey: ["customer", slugId, queryString],
    queryFn: () => fetcher<CustomerDetailResponse>(url),
    enabled: !!slugId,
    staleTime: 5000,
  });
}
