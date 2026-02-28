import { BillDetailPageClient } from "@/components/bills/BillDetailPageClient";
import { BillDetailSkeleton } from "@/components/bills/BillDetailSkeleton";
import { DashboardPageShell } from "@/components/layouts";
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
    <DashboardPageShell title="Bill" subtitle="View bill details and customer">
      <Suspense fallback={<BillDetailSkeleton />}>
        <BillDetailPageClient billId={id} />
      </Suspense>
    </DashboardPageShell>
  );
}
