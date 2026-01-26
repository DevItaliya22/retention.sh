"use client";

import { PageLayout, ScaffoldContainer } from "@/components/layouts";
import { Suspense } from "react";

import { AddCashierModal } from "@/components/cashier/AddCashierModal";
import { CashierTable } from "@/components/cashier/CashierTable";
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
      <ScaffoldContainer className="px-6">
        <Suspense
          fallback={
            <CashierTable
              cashiers={[]}
              total={0}
              perPage={10}
              isLoading={true}
            />
          }
        >
          <CashierContent />
        </Suspense>
      </ScaffoldContainer>
      <AddCashierModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </PageLayout>
  );
}
