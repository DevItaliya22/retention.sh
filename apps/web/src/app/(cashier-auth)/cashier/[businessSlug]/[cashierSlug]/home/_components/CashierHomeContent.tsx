"use client";

import { useCashierContext } from "../_context/CashierContext";
import { CashierLogoutButton } from "./CashierLogoutButton";
import { BillCreationForm } from "./BillCreationForm";

export function CashierHomeContent() {
  const { business, cashier, businessSlug, cashierSlug } = useCashierContext();

  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Cashier Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome, {cashier.user.name}!
          </p>
          <p className="text-sm text-muted-foreground">
            Business: {business.name}
          </p>
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
