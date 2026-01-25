"use client";

import { createContext, useContext } from "react";

interface CashierUser {
  id: string;
  name: string;
  email: string | null;
}

interface Business {
  id: string;
  name: string;
}

interface Cashier {
  id: string;
  cashierLinkSlug: string;
  businessId: string;
  userId: string;
  user: CashierUser;
}

interface CashierContextValue {
  business: Business;
  cashier: Cashier;
  businessSlug: string;
  cashierSlug: string;
}

const CashierContext = createContext<CashierContextValue | null>(null);

export function useCashierContext() {
  const context = useContext(CashierContext);
  if (!context) {
    throw new Error("useCashierContext must be used within CashierProvider");
  }
  return context;
}

export { CashierContext };
export type { CashierContextValue, Business, Cashier, CashierUser };
