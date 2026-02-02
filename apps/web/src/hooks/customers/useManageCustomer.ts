"use client";

import { fetcher } from "@/lib/fetcher";
import type { CustomerImportInput } from "@/lib/schemas/customer";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export interface CustomerImportResponse {
  created: number;
  failed: number;
  errors: { row: number; phone: string; message: string }[];
  error?: string;
}

export function useManageCustomer() {
  const queryClient = useQueryClient();

  const importCustomers = useMutation<
    CustomerImportResponse,
    Error,
    CustomerImportInput
  >({
    mutationFn: async (input) => {
      return fetcher<CustomerImportResponse>("/api/customers/import", {
        method: "POST",
        body: JSON.stringify(input),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });

  return {
    import: {
      mutate: importCustomers.mutate,
      mutateAsync: importCustomers.mutateAsync,
      isPending: importCustomers.isPending,
      isError: importCustomers.isError,
      error: importCustomers.error,
    },
  };
}
