"use client";

import { CustomerImportSheet } from "@/components/customers/CustomerImportSheet";
import { CustomersTable } from "@/components/customers/CustomersTable";
import { PageLayout, ScaffoldContainer } from "@/components/layouts";
import { Button } from "@reelo/ui/components";
import { FileUp } from "lucide-react";
import { Suspense, useState } from "react";

export default function CustomersPage() {
  const [isImportSheetOpen, setIsImportSheetOpen] = useState(false);

  return (
    <PageLayout
      title="Customers"
      subtitle="View and manage all customers for your business"
      size="full"
      scaffoldSectionClassName="h-full w-full pt-2 pb-0"
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
      <ScaffoldContainer className="h-full w-full max-w-full px-6">
        <Suspense fallback={<div className="h-96" />}>
          <CustomersTable />
        </Suspense>
      </ScaffoldContainer>
      <CustomerImportSheet
        isOpen={isImportSheetOpen}
        onClose={() => setIsImportSheetOpen(false)}
      />
    </PageLayout>
  );
}
