import { generateRouteMetadata } from "@/lib/utils/route-metadata";
import type { Metadata } from "next";
import { CashierBillDetailContent } from "./_components/CashierBillDetailContent";

interface CashierBillDetailPageProps {
  params: Promise<{
    businessSlug: string;
    cashierSlug: string;
    id: string;
  }>;
}

export async function generateMetadata({
  params,
}: CashierBillDetailPageProps): Promise<Metadata> {
  const { businessSlug, cashierSlug, id } = await params;
  return generateRouteMetadata(
    `/cashier/${businessSlug}/${cashierSlug}/home/bills/${id}`,
  );
}

export default async function CashierBillDetailPage({
  params,
}: CashierBillDetailPageProps) {
  const { id } = await params;
  return <CashierBillDetailContent billId={id} />;
}
