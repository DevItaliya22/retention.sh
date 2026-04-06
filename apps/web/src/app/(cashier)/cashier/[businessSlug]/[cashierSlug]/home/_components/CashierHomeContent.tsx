"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { useCashierContext } from "../_context/CashierContext";
import { BillCreatedView } from "./BillCreatedView";
import { BillCreationForm } from "./BillCreationForm";
import { CashierLogoutButton } from "./CashierLogoutButton";
import { CashierMobileLayout } from "./CashierMobileLayout";
import { CashierNav } from "./CashierNav";

interface CashierHomeContentProps {
  billCreatedId?: string;
}

export function CashierHomeContent({ billCreatedId }: CashierHomeContentProps) {
  const router = useRouter();
  const { business, businessSlug, cashierSlug } = useCashierContext();

  const handleCreateAnother = useCallback(() => {
    router.replace(`/cashier/${businessSlug}/${cashierSlug}/home`, {
      scroll: false,
    });
    router.refresh();
  }, [router, businessSlug, cashierSlug]);

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
        {billCreatedId ? (
          <BillCreatedView
            billId={billCreatedId}
            businessId={business.id}
            onCreateAnother={handleCreateAnother}
          />
        ) : (
          <BillCreationForm />
        )}
      </main>
    </CashierMobileLayout>
  );
}
