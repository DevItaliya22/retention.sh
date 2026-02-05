"use client";

import { fetcher } from "@/lib/fetcher";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

export interface CashierLoginInput {
  businessSlug: string;
  cashierSlug: string;
  email: string;
  password: string;
}

export interface CashierSession {
  user: {
    id: string;
    name: string;
    email: string | null;
    role: string | null;
  };
  session: {
    id: string;
    token: string;
    expiresAt: string;
  };
}

export interface CashierLoginResponse {
  session: CashierSession | null;
  error?: string;
}

export function useCashierLogin() {
  const router = useRouter();

  return useMutation<CashierLoginResponse, Error, CashierLoginInput>({
    mutationFn: async (input: CashierLoginInput) => {
      return fetcher<CashierLoginResponse>("/api/auth/cashier/login", {
        method: "POST",
        body: JSON.stringify(input),
      });
    },
    onSuccess: (data, variables) => {
      if (data.session) {
        router.push(
          `/cashier/${variables.businessSlug}/${variables.cashierSlug}/home`,
        );
        router.refresh();
      }
    },
  });
}
