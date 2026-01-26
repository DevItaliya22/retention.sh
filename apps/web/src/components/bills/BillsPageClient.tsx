"use client";

import { useBillsQuery } from "@/hooks/bills/useBillsQuery";
import { Suspense } from "react";
import { BillsTable } from "./BillsTable";

function BillsContent() {
  const { data, isLoading, isError, error } = useBillsQuery();

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-destructive text-sm font-medium">
          Failed to load bills
        </p>
        <p className="text-muted-foreground mt-1 text-sm">
          {error?.message || "Please try again later"}
        </p>
      </div>
    );
  }

  return (
    <BillsTable
      bills={data?.bills || []}
      total={data?.total || 0}
      perPage={data?.perPage || 10}
      isLoading={isLoading}
    />
  );
}

export function BillsPageClient() {
  return (
    <Suspense
      fallback={
        <BillsTable bills={[]} total={0} perPage={10} isLoading={true} />
      }
    >
      <BillsContent />
    </Suspense>
  );
}
