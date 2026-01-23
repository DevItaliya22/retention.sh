"use client";

import { AddCashierModal } from "@/components/cashier/AddCashierModal";
import { CashierTable } from "@/components/cashier/CashierTable";
import { PageLayout, ScaffoldContainer } from "@/components/layouts";
import { useManageCashier } from "@/hooks/cashier/useManageCashier";
import { Button } from "@reelo/ui/components";
import { Plus } from "lucide-react";
import { useState } from "react";

export function CashierSettingPageClient() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { list } = useManageCashier();

  return (
    <PageLayout
      title="Cashier Settings"
      subtitle="Manage your cashier accounts"
      size="full"
      scaffoldSectionClassName="h-full w-full pt-2 pb-0"
      primaryActions={
        <Button
          icon={<Plus className="h-4 w-4" />}
          onClick={() => setIsAddModalOpen(true)}
        >
          Add Cashier
        </Button>
      }
    >
      <ScaffoldContainer>
        {list.isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading cashiers...</div>
          </div>
        ) : list.isError ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-destructive">
              {list.error?.message || "Failed to load cashiers"}
            </div>
          </div>
        ) : (
          <CashierTable cashiers={list.cashiers} />
        )}
      </ScaffoldContainer>
      <AddCashierModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </PageLayout>
  );
}
