import { BillDetailPageClient } from "@/components/bills/BillDetailPageClient";
import { BillDetailSkeleton } from "@/components/bills/BillDetailSkeleton";
import { PageLayout, ScaffoldContainer } from "@/components/layouts";
import { generateRouteMetadata } from "@/lib/utils/route-metadata";
import type { Metadata } from "next";
import { Suspense } from "react";

interface BillDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: BillDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  return generateRouteMetadata(`/bills/${id}`);
}

export default async function BillDetailPage({ params }: BillDetailPageProps) {
  const { id } = await params;

  return (
    <PageLayout
      title="Bill"
      subtitle="View bill details and customer"
      size="full"
      scaffoldSectionClassName="pt-2 pb-0"
    >
      <ScaffoldContainer className="max-w-full px-6">
        <Suspense fallback={<BillDetailSkeleton />}>
          <BillDetailPageClient billId={id} />
        </Suspense>
      </ScaffoldContainer>
    </PageLayout>
  );
}
