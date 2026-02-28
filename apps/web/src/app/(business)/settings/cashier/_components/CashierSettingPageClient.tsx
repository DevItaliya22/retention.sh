"use client";

import { DashboardPageShell } from "@/components/layouts";
import { Suspense } from "react";

import { AddCashierModal } from "@/components/settings/cashier/AddCashierModal";
import { CashierTable } from "@/components/settings/cashier/CashierTable";
import { useCashiersQuery } from "@/hooks/cashier/useCashiersQuery";
import { Button } from "@reelo/ui/components";
import { Plus } from "lucide-react";
import { useState } from "react";

function CashierContent() {
  const { data, isLoading, isError, error } = useCashiersQuery();

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-destructive text-sm font-medium">
          Failed to load cashiers
        </p>
        <p className="text-muted-foreground mt-1 text-sm">
          {error?.message || "Please try again later"}
        </p>
      </div>
    );
  }

  return (
    <CashierTable
      cashiers={data?.cashiers || []}
      total={data?.total || 0}
      perPage={data?.perPage || 10}
      isLoading={isLoading}
    />
  );
}

export function CashierSettingPageClient() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  return (
    <DashboardPageShell
      title="Cashier Settings"
      subtitle="Manage your cashier accounts"
      primaryActions={
        <Button
          icon={<Plus className="h-4 w-4" />}
          onClick={() => setIsAddModalOpen(true)}
        >
          Add Cashier
        </Button>
      }
    >
      <Suspense
        fallback={
          <CashierTable cashiers={[]} total={0} perPage={10} isLoading={true} />
        }
      >
        <CashierContent />
      </Suspense>
      <AddCashierModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </DashboardPageShell>
  );
}
