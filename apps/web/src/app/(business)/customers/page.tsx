"use client";

import { CustomerImportSheet } from "@/components/customers/CustomerImportSheet";
import { CustomersTable } from "@/components/customers/CustomersTable";
import { DashboardPageShell } from "@/components/layouts";
import { Button } from "@reelo/ui/components";
import { FileUp } from "lucide-react";
import { Suspense, useState } from "react";

export default function CustomersPage() {
  const [isImportSheetOpen, setIsImportSheetOpen] = useState(false);

  return (
    <DashboardPageShell
      title="Customers"
      subtitle="View and manage all customers for your business"
      primaryActions={
        <Button
          variant="outline"
          icon={<FileUp className="h-4 w-4" />}
          onClick={() => setIsImportSheetOpen(true)}
        >
          Import
        </Button>
      }
    >
      <Suspense fallback={<div className="h-96" />}>
        <CustomersTable />
      </Suspense>
      <CustomerImportSheet
        isOpen={isImportSheetOpen}
        onClose={() => setIsImportSheetOpen(false)}
      />
    </DashboardPageShell>
  );
}
