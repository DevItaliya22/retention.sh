"use client";

import { useCashierContext } from "../_context/CashierContext";
import { BillCreationForm } from "./BillCreationForm";
import { CashierLogoutButton } from "./CashierLogoutButton";
import { CashierNav } from "./CashierNav";

export function CashierHomeContent() {
  const { business, cashier, businessSlug, cashierSlug } = useCashierContext();

  return (
    <div className="bg-background flex min-h-screen flex-col items-center p-4">
      <div className="w-full max-w-4xl space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Cashier Dashboard</h1>
          <p className="text-muted-foreground">Welcome, {cashier.user.name}!</p>
          <p className="text-muted-foreground text-sm">
            Business: {business.name}
          </p>
        </div>
        <div className="flex justify-center">
          <CashierNav />
        </div>
        <BillCreationForm />
        <div className="flex justify-center">
          <CashierLogoutButton
            businessSlug={businessSlug}
            cashierSlug={cashierSlug}
          />
        </div>
      </div>
    </div>
  );
}
