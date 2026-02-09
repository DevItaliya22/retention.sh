"use client";

import { useCashierContext } from "../_context/CashierContext";
import { BillCreationForm } from "./BillCreationForm";
import { CashierLogoutButton } from "./CashierLogoutButton";
import { CashierNav } from "./CashierNav";

export function CashierHomeContent() {
  const { business, businessSlug, cashierSlug } = useCashierContext();

  return (
    <div className="bg-background flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b px-4 py-3 sm:px-6">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold">{business.name}</h1>
          <CashierNav />
        </div>
        <CashierLogoutButton
          businessSlug={businessSlug}
          cashierSlug={cashierSlug}
        />
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-4 py-8">
        <BillCreationForm />
      </main>
    </div>
  );
}
