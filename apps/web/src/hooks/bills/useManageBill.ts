"use client";

import { fetcher } from "@/lib/fetcher";
import type { BillImportInput } from "@/lib/schemas/bill";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export interface BillImportResponse {
  created: number;
  failed: number;
  errors: { row: number; billNumber: string; message: string }[];
  error?: string;
}

export function useManageBill() {
  const queryClient = useQueryClient();

  const importBills = useMutation<BillImportResponse, Error, BillImportInput>({
    mutationFn: async (input) => {
      return fetcher<BillImportResponse>("/api/bills/import", {
        method: "POST",
        body: JSON.stringify(input),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bills"] });
    },
  });

  return {
    import: {
      mutate: importBills.mutate,
      mutateAsync: importBills.mutateAsync,
      isPending: importBills.isPending,
      isError: importBills.isError,
      error: importBills.error,
    },
  };
}
