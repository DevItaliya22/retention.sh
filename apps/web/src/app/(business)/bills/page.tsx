import { BillsTable } from "@/components/bills/BillsTable";
import { BillsTableSkeleton } from "@/components/bills/BillsTableSkeleton";
import { PageLayout, ScaffoldContainer } from "@/components/layouts";
import { generateRouteMetadata } from "@/lib/utils/route-metadata";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = generateRouteMetadata("/bills");

export default function BillsPage() {
  return (
    <PageLayout
      title="Bills"
      subtitle="View and manage all bills for your business"
      size="full"
      scaffoldSectionClassName="h-full w-full pt-2 pb-0"
    >
      <ScaffoldContainer className="h-full w-full max-w-full px-6">
        <Suspense fallback={<BillsTableSkeleton />}>
          <BillsTable />
        </Suspense>
      </ScaffoldContainer>
    </PageLayout>
  );
}
