"use client";

import { APP_CONSTANTS } from "@/lib/constants/app";
import { fetcher } from "@/lib/fetcher";
import { BillFormInput } from "@/lib/schemas/bill";
import { useDebouncedCallback } from "@reelo/ui/hooks";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";

export interface Customer {
  id: string;
  userId: string;
  name: string;
  phoneNumber: string | null;
  email: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
  isBusinessCustomer: boolean;
}

export interface SearchCustomerResponse {
  customers: Customer[];
  error?: string;
}

export interface LoyaltyResult {
  loyaltyType: string;
  earnedPoints: number;
  redeemedPoints: number;
  cashbackAmount: number | null;
  cashbackRedeemedAmount: number | null;
  pointsBalance: number;
  finalAmount: number;
  tierUpgrade?: {
    previousTierName: string | null;
    newTierName: string | null;
    wasUpgraded: boolean;
    newCashbackPercentage: number;
  } | null;
  /** Customer's tier after this bill (TIER type); includes range for cashier UI. */
  currentTier?: {
    name: string;
    cashbackPercentage: number;
    minLifetimeSpend: number;
    maxLifetimeSpend: number | null;
  } | null;
  /** TIER only: when no tier (below first), message for cashier. */
  tierMessage?: string | null;
}

export interface RewardStageResult {
  id: string;
  rewardName: string;
  rewardType: string;
  pointsRequired: number;
  canRedeem: boolean;
  freeItemName: string | null;
  percentageValue: number | null;
  cashAmount: number | null;
}

export interface CampaignAppliedItem {
  campaignId: string;
  campaignTitle: string | null;
  rewardType: string;
  discountAmount: number;
  earnedAmount: number;
  freeItemName: string | null;
}

export interface CampaignDiscountResult {
  totalDiscount: number;
  appliedCampaigns: CampaignAppliedItem[];
  primaryCampaignId: string | null;
}

export interface CreateBillResponse {
  bill: {
    id: string;
    billNumber: string;
    subtotal: number | null;
    storeDiscount: number | null;
    tax: number[];
    finalAmount: number | null;
    cashbackAmount: number | null;
    cashbackRedeemedAmount: number | null;
    /** Discount from redeeming partner loyalty (cashback/points) at this bill. */
    partnerRedeemedAmount: number | null;
    /** Discount auto-applied from active campaign(s). */
    campaignDiscountAmount: number | null;
    campaignId: string | null;
    userPaidAmount: number | null;
    amount?: number | null;
    businessId: string;
    customerId: string;
    createdAt: string;
    updatedAt: string;
  } | null;
  loyalty?: LoyaltyResult;
  rewardStages?: RewardStageResult[];
  campaignDiscount?: CampaignDiscountResult;
  feedbackUrl?: string;
  error?: string;
}

export function useBillCreation(businessId: string) {
  const queryClient = useQueryClient();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const searchCustomers = useCallback(
    async (phone: string) => {
      const digitCount = phone.replace(/\D/g, "").length;
      if (digitCount < APP_CONSTANTS.MIN_PHONE_LENGTH_FOR_SEARCH) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const promises: Promise<SearchCustomerResponse>[] = [
          fetcher<SearchCustomerResponse>(
            `/api/cashier/customer/search/business-customer?phone=${encodeURIComponent(phone)}`,
          ),
          fetcher<SearchCustomerResponse>(
            `/api/cashier/customer/search/other-customer?phone=${encodeURIComponent(phone)}`,
          ),
        ];

        const responses = await Promise.allSettled(promises);

        const allCustomers: Customer[] = [];

        responses.forEach((result) => {
          if (result.status === "fulfilled") {
            const response = result.value;
            if (!response.error && response.customers) {
              allCustomers.push(...response.customers);
            }
          }
        });

        const seenPhones = new Set<string>();
        const uniqueCustomers = allCustomers.filter((customer) => {
          if (seenPhones.has(customer.phoneNumber || "")) {
            return false;
          }
          seenPhones.add(customer.phoneNumber || "");
          return true;
        });

        const businessCustomers = uniqueCustomers.filter(
          (c) => c.isBusinessCustomer,
        );
        const otherCustomers = uniqueCustomers.filter(
          (c) => !c.isBusinessCustomer,
        );

        setSearchResults([...businessCustomers, ...otherCustomers]);
      } catch (error) {
        console.error("Failed to search customers:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    [businessId],
  );

  const debouncedSearch = useDebouncedCallback(searchCustomers, 300);

  const handleCustomerSelect = useCallback((customer: Customer) => {
    setSelectedCustomer(customer);
    setSearchResults([]);
  }, []);

  const clearSelectedCustomer = useCallback(() => {
    setSelectedCustomer(null);
  }, []);

  const createBillMutation = useMutation<
    CreateBillResponse,
    Error,
    BillFormInput
  >({
    mutationFn: async (input: BillFormInput) => {
      return fetcher<CreateBillResponse>("/api/cashier/bill", {
        method: "POST",
        body: JSON.stringify(input),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cashier"] });
    },
  });

  const handleSubmit = useCallback(
    async (data: BillFormInput) => {
      return createBillMutation.mutateAsync(data);
    },
    [createBillMutation],
  );

  const memoizedSearchResults = useMemo(() => {
    const businessCustomers = searchResults.filter((c) => c.isBusinessCustomer);
    const otherCustomers = searchResults.filter((c) => !c.isBusinessCustomer);
    return [...businessCustomers, ...otherCustomers];
  }, [searchResults]);

  return {
    selectedCustomer,
    searchResults: memoizedSearchResults,
    isSearching,
    searchCustomers: debouncedSearch,
    handleCustomerSelect,
    clearSelectedCustomer,
    createBill: handleSubmit,
    isCreating: createBillMutation.isPending,
    createError: createBillMutation.error,
    createSuccess: createBillMutation.isSuccess,
    createData: createBillMutation.data ?? null,
    resetMutation: createBillMutation.reset,
  };
}
