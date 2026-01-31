import { generateRouteMetadata } from "@/lib/utils/route-metadata";
import type { Metadata } from "next";
import { CashierBillsPageContent } from "./_components/CashierBillsPageContent";

interface CashierBillsPageProps {
  params: Promise<{
    businessSlug: string;
    cashierSlug: string;
  }>;
}

export async function generateMetadata({
  params,
}: CashierBillsPageProps): Promise<Metadata> {
  const { businessSlug, cashierSlug } = await params;
  return generateRouteMetadata(
    `/cashier/${businessSlug}/${cashierSlug}/home/bills`,
  );
}

export default async function CashierBillsPage({}: CashierBillsPageProps) {
  return <CashierBillsPageContent />;
}
