"use client";

import { CashierContext, type CashierContextValue } from "./CashierContext";

interface CashierProviderProps {
  children: React.ReactNode;
  value: CashierContextValue;
}

export function CashierProvider({ children, value }: CashierProviderProps) {
  return (
    <CashierContext.Provider value={value}>{children}</CashierContext.Provider>
  );
}
