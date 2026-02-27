import { CustomerDetailPageClient } from "@/components/customers/CustomerDetailPageClient";
import { CustomerDetailSkeleton } from "@/components/customers/CustomerDetailSkeleton";
import { DashboardPageShell } from "@/components/layouts";
import { generateRouteMetadata } from "@/lib/utils/route-metadata";
import type { Metadata } from "next";
import { Suspense } from "react";

/**
 * Route segment is [slugId] (not [id]) to avoid confusion with Customer.id or
 * BusinessCustomer composite id (businessId + customerId). The value is
 * BusinessCustomer.slugId – a short uuid used in URLs and API.
 */
interface CustomerDetailPageProps {
  params: Promise<{ slugId: string }>;
}

export async function generateMetadata({
  params,
}: CustomerDetailPageProps): Promise<Metadata> {
  const { slugId } = await params;
  return generateRouteMetadata(`/customers/${slugId}`);
}

export default async function CustomerDetailPage({
  params,
}: CustomerDetailPageProps) {
  const { slugId } = await params;

  return (
    <DashboardPageShell
      title="Customer"
      subtitle="View customer details and loyalty info"
    >
      <Suspense fallback={<CustomerDetailSkeleton />}>
        <CustomerDetailPageClient slugId={slugId} />
      </Suspense>
    </DashboardPageShell>
  );
}
