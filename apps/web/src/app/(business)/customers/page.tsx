"use client";

import { CustomersTable } from "@/components/customers/CustomersTable";
import { Suspense } from "react";

export default function CustomersPage() {
  return (
    <Suspense fallback={<div className="h-96" />}>
      <CustomersTable />
    </Suspense>
  );
}
