"use client";

import { BillImportSheet } from "@/components/bills/BillImportSheet";
import { BillsTable } from "@/components/bills/BillsTable";
import { BillsTableSkeleton } from "@/components/bills/BillsTableSkeleton";
import { DashboardPageShell } from "@/components/layouts";
import { Button } from "@reelo/ui/components";
import { FileUp } from "lucide-react";
import { Suspense, useState } from "react";

export function BillsPageClient() {
  const [isImportSheetOpen, setIsImportSheetOpen] = useState(false);

  return (
    <DashboardPageShell
      title="Bills"
      subtitle="View and manage all bills for your business"
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
      <Suspense fallback={<BillsTableSkeleton />}>
        <BillsTable />
      </Suspense>
      <BillImportSheet
        isOpen={isImportSheetOpen}
        onClose={() => setIsImportSheetOpen(false)}
      />
    </DashboardPageShell>
  );
}
