"use client";

import { BillImportSheet } from "@/components/bills/BillImportSheet";
import { BillsTable } from "@/components/bills/BillsTable";
import { BillsTableSkeleton } from "@/components/bills/BillsTableSkeleton";
import { PageLayout, ScaffoldContainer } from "@/components/layouts";
import { Button } from "@reelo/ui/components";
import { FileUp } from "lucide-react";
import { Suspense, useState } from "react";

export function BillsPageClient() {
  const [isImportSheetOpen, setIsImportSheetOpen] = useState(false);

  return (
    <PageLayout
      title="Bills"
      subtitle="View and manage all bills for your business"
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
        <Suspense fallback={<BillsTableSkeleton />}>
          <BillsTable />
        </Suspense>
      </ScaffoldContainer>
      <BillImportSheet
        isOpen={isImportSheetOpen}
        onClose={() => setIsImportSheetOpen(false)}
      />
    </PageLayout>
  );
}
