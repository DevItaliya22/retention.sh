"use client";

import { fetcher } from "@/lib/fetcher";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface ShopifyStoreItem {
  id: string;
  shopDomain: string;
  shopName: string | null;
  returnWindowDays: number;
  lastSyncedAt: string | null;
  createdAt: string;
  _count: { productSyncs: number };
}

export interface ShopifyStoresResponse {
  items: ShopifyStoreItem[];
  error?: string;
}

export function useShopifyStores() {
  return useQuery({
    queryKey: ["shopify", "stores"],
    queryFn: () => fetcher<ShopifyStoresResponse>("/api/shopify/stores"),
    placeholderData: (prev) => prev,
  });
}

export function useUpdateShopifyStore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      storeId,
      returnWindowDays,
    }: {
      storeId: string;
      returnWindowDays: number;
    }) =>
      fetcher<{ success?: boolean; error?: string }>(
        `/api/shopify/stores/${storeId}`,
        {
          method: "PATCH",
          body: JSON.stringify({ returnWindowDays }),
          headers: { "Content-Type": "application/json" },
        },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shopify", "stores"] });
    },
  });
}

export function useDisconnectShopifyStore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (storeId: string) =>
      fetcher<{ success?: boolean; error?: string }>(
        `/api/shopify/stores/${storeId}`,
        { method: "DELETE" },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shopify", "stores"] });
    },
  });
}

export function useSyncShopifyProducts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      fetcher<{
        success?: boolean;
        created?: number;
        updated?: number;
        message?: string;
        error?: string;
      }>("/api/shopify/sync/products", { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shopify", "stores"] });
    },
  });
}
