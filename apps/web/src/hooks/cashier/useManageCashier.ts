"use client";

import { fetcher } from "@/lib/fetcher";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface Cashier {
  id: string;
  userId: string;
  name: string;
  email: string | null;
  cashierLinkSlug: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CashiersResponse {
  cashiers: Cashier[];
  error?: string;
}

export interface CashierResponse {
  cashier: Cashier | null;
  error?: string;
}

export interface CreateCashierInput {
  name: string;
  email: string;
  password: string;
  cashierLinkSlug: string;
}

export interface UpdateCashierInput {
  name?: string;
  email?: string;
  password?: string;
  cashierLinkSlug?: string;
}

export function useManageCashier(emailFilter?: string) {
  const queryClient = useQueryClient();
  const queryKey = ["cashiers", emailFilter || ""];

  const list = useQuery<CashiersResponse, Error>({
    queryKey,
    queryFn: () => {
      const params = new URLSearchParams();
      if (emailFilter) {
        params.set("email", emailFilter);
      }
      return fetcher<CashiersResponse>(`/api/cashier?${params.toString()}`);
    },
  });

  const create = useMutation<
    CashierResponse,
    Error,
    CreateCashierInput,
    { previousCashiers: CashiersResponse | undefined }
  >({
    mutationFn: async (input: CreateCashierInput) => {
      return fetcher<CashierResponse>("/api/cashier", {
        method: "POST",
        body: JSON.stringify(input),
      });
    },
    onMutate: async (newCashier) => {
      await queryClient.cancelQueries({ queryKey: ["cashiers"] });

      const previousCashiers = queryClient.getQueryData<CashiersResponse>([
        "cashiers",
        "",
      ]);

      queryClient.setQueryData<CashiersResponse>(["cashiers", ""], (old) => {
        if (!old) return old;
        const optimisticCashier: Cashier = {
          id: `temp-${Date.now()}`,
          userId: `temp-user-${Date.now()}`,
          name: newCashier.name,
          email: newCashier.email,
          cashierLinkSlug: newCashier.cashierLinkSlug,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        return {
          ...old,
          cashiers: [optimisticCashier, ...old.cashiers],
        };
      });

      return { previousCashiers };
    },
    onError: (err, newCashier, context) => {
      if (context?.previousCashiers) {
        queryClient.setQueryData(["cashiers", ""], context.previousCashiers);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cashiers"] });
    },
  });

  const update = useMutation<
    CashierResponse,
    Error,
    { id: string; data: UpdateCashierInput },
    {
      previousCashiers: Array<
        [readonly unknown[], CashiersResponse | undefined]
      >;
    }
  >({
    mutationFn: async ({ id, data }) => {
      return fetcher<CashierResponse>(`/api/cashier/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ["cashiers"] });

      const previousCashiers = queryClient.getQueriesData<CashiersResponse>({
        queryKey: ["cashiers"],
      });

      queryClient.setQueriesData<CashiersResponse>(
        { queryKey: ["cashiers"] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            cashiers: old.cashiers.map((cashier) =>
              cashier.id === id
                ? {
                    ...cashier,
                    ...(data.name && { name: data.name }),
                    ...(data.email && { email: data.email }),
                    ...(data.cashierLinkSlug && {
                      cashierLinkSlug: data.cashierLinkSlug,
                    }),
                    updatedAt: new Date(),
                  }
                : cashier,
            ),
          };
        },
      );

      return { previousCashiers };
    },
    onError: (err, variables, context) => {
      if (context?.previousCashiers) {
        context.previousCashiers.forEach(
          ([queryKey, data]: [
            readonly unknown[],
            CashiersResponse | undefined,
          ]) => {
            queryClient.setQueryData(queryKey, data);
          },
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cashiers"] });
    },
  });

  const remove = useMutation<
    { success: boolean; error?: string },
    Error,
    string,
    {
      previousCashiers: Array<
        [readonly unknown[], CashiersResponse | undefined]
      >;
    }
  >({
    mutationFn: async (id: string) => {
      return fetcher<{ success: boolean; error?: string }>(
        `/api/cashier/${id}`,
        {
          method: "DELETE",
        },
      );
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["cashiers"] });

      const previousCashiers = queryClient.getQueriesData<CashiersResponse>({
        queryKey: ["cashiers"],
      });

      queryClient.setQueriesData<CashiersResponse>(
        { queryKey: ["cashiers"] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            cashiers: old.cashiers.filter((cashier) => cashier.id !== id),
          };
        },
      );

      return { previousCashiers };
    },
    onError: (err, id, context) => {
      if (context?.previousCashiers) {
        context.previousCashiers.forEach(
          ([queryKey, data]: [
            readonly unknown[],
            CashiersResponse | undefined,
          ]) => {
            queryClient.setQueryData(queryKey, data);
          },
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cashiers"] });
    },
  });

  return {
    list: {
      cashiers: list.data?.cashiers || [],
      isLoading: list.isLoading,
      isError: list.isError,
      error: list.error,
      refetch: list.refetch,
    },
    create: {
      mutate: create.mutate,
      mutateAsync: create.mutateAsync,
      isPending: create.isPending,
      isError: create.isError,
      error: create.error,
    },
    update: {
      mutate: update.mutate,
      mutateAsync: update.mutateAsync,
      isPending: update.isPending,
      isError: update.isError,
      error: update.error,
    },
    delete: {
      mutate: remove.mutate,
      mutateAsync: remove.mutateAsync,
      isPending: remove.isPending,
      isError: remove.isError,
      error: remove.error,
    },
  };
}
