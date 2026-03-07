"use client";

import { handleApiError } from "@/lib/utils/error-handler";
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
      const res = await fetch("/api/auth/cashier/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const text = await res.text();
      const data = (text ? JSON.parse(text) : {}) as CashierLoginResponse;
      if (!res.ok) {
        const msg =
          data.error ||
          (await handleApiError(
            new Response(text, {
              status: res.status,
              statusText: res.statusText,
            }),
            "Invalid email or password. Please try again.",
          ));
        throw new Error(msg);
      }
      return data;
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
