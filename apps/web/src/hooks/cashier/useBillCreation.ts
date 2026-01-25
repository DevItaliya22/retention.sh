"use client";

import { useState, useCallback, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import { fetcher } from "@/lib/fetcher";
import { useDebouncedCallback } from "@reelo/ui/hooks";
import { BillFormInput } from "@/lib/schemas/bill";

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

export interface CreateBillResponse {
  bill: {
    id: string;
    billNumber: string;
    amount: number | null;
    businessId: string;
    customerId: string;
    createdAt: string;
    updatedAt: string;
  } | null;
  error?: string;
}

export function useBillCreation(businessId: string) {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const searchCustomers = useCallback(
    async (phone: string) => {
      if (phone.length < 4) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const promises: Promise<SearchCustomerResponse>[] = [];

        if (phone.length >= 4) {
          promises.push(
            fetcher<SearchCustomerResponse>(
              `/api/cashier/customer/search/customer?phone=${encodeURIComponent(
                phone,
              )}&businessId=${businessId}`,
            ),
          );
        }

        if (phone.length >= 6) {
          promises.push(
            fetcher<SearchCustomerResponse>(
              `/api/cashier/customer/search/our-customer?phone=${encodeURIComponent(
                phone,
              )}&businessId=${businessId}`,
            ),
          );
        }

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

  const createBillMutation = useMutation<CreateBillResponse, Error, BillFormInput>({
    mutationFn: async (input: BillFormInput) => {
      return fetcher<CreateBillResponse>("/api/cashier/bill", {
        method: "POST",
        body: JSON.stringify(input),
      });
    },
  });

  const handleSubmit = useCallback(
    async (data: BillFormInput) => {
      return createBillMutation.mutateAsync(data);
    },
    [createBillMutation],
  );

  const memoizedSearchResults = useMemo(() => {
    const businessCustomers = searchResults.filter(
      (c) => c.isBusinessCustomer,
    );
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
    resetMutation: createBillMutation.reset,
  };
}
