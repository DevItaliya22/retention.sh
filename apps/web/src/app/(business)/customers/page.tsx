import { CustomersPageClient } from "@/components/customers/CustomersPageClient";
import { PageLayout, ScaffoldContainer } from "@/components/layouts";
import { generateRouteMetadata } from "@/lib/utils/route-metadata";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = generateRouteMetadata("/customers");

export default function CustomersPage() {
  return (
    <PageLayout
      title="Customers"
      subtitle="View and manage all customers for your business"
      size="full"
      scaffoldSectionClassName="h-full w-full pt-2 pb-0"
    >
      <ScaffoldContainer className="h-full w-full max-w-full px-6">
        <Suspense fallback={<div className="h-96" />}>
          <CustomersPageClient />
        </Suspense>
      </ScaffoldContainer>
    </PageLayout>
  );
}
