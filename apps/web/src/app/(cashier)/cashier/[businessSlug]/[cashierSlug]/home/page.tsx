import { generateRouteMetadata } from "@/lib/utils/route-metadata";

import type { Metadata } from "next";
import { CashierHomeContent } from "./_components/CashierHomeContent";

interface CashierHomePageProps {
  params: Promise<{
    businessSlug: string;
    cashierSlug: string;
  }>;
  searchParams: Promise<{ billCreated?: string }>;
}

export async function generateMetadata({
  params,
}: CashierHomePageProps): Promise<Metadata> {
  const { businessSlug, cashierSlug } = await params;
  return generateRouteMetadata(`/cashier/${businessSlug}/${cashierSlug}/home`);
}

export default async function CashierHomePage({
  params,
  searchParams,
}: CashierHomePageProps) {
  const { billCreated } = await searchParams;
  return <CashierHomeContent billCreatedId={billCreated} />;
}
