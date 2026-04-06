"use client";

import { CashierBillsList } from "../../_components/CashierBillsList";
import { CashierLogoutButton } from "../../_components/CashierLogoutButton";
import { CashierMobileLayout } from "../../_components/CashierMobileLayout";
import { CashierNav } from "../../_components/CashierNav";
import { useCashierContext } from "../../_context/CashierContext";

export function CashierBillsPageContent() {
  const { business, businessSlug, cashierSlug } = useCashierContext();

  return (
    <CashierMobileLayout>
      <header className="bg-background/95 sticky top-0 z-10 border-b backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="truncate text-base font-semibold tracking-tight">
            {business.name}
          </h1>
          <CashierLogoutButton
            businessSlug={businessSlug}
            cashierSlug={cashierSlug}
          />
        </div>
        <div className="px-4 pb-3">
          <CashierNav />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4">
        <CashierBillsList />
      </main>
    </CashierMobileLayout>
  );
}
