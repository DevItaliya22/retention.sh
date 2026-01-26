"use client";

import { useCustomersQuery } from "@/hooks/customers/useCustomersQuery";
import { Suspense } from "react";
import { CustomersTable } from "./CustomersTable";

function CustomersContent() {
  const { data, isLoading, isError, error } = useCustomersQuery();

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-destructive text-sm font-medium">
          Failed to load customers
        </p>
        <p className="text-muted-foreground mt-1 text-sm">
          {error?.message || "Please try again later"}
        </p>
      </div>
    );
  }

  return (
    <CustomersTable
      customers={data?.items || []}
      total={data?.total || 0}
      perPage={data?.perPage || 10}
      isLoading={isLoading}
    />
  );
}

export function CustomersPageClient() {
  return (
    <Suspense
      fallback={
        <CustomersTable
          customers={[]}
          total={0}
          perPage={10}
          isLoading={true}
        />
      }
    >
      <CustomersContent />
    </Suspense>
  );
}
