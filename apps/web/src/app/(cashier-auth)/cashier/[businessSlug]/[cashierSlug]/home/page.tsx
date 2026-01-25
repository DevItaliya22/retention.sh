import { generateRouteMetadata } from "@/lib/utils/route-metadata";

import type { Metadata } from "next";
import { CashierHomeContent } from "./_components/CashierHomeContent";

interface CashierHomePageProps {
  params: Promise<{
    businessSlug: string;
    cashierSlug: string;
  }>;
}

export async function generateMetadata({
  params,
}: CashierHomePageProps): Promise<Metadata> {
  const { businessSlug, cashierSlug } = await params;
  return generateRouteMetadata(`/cashier/${businessSlug}/${cashierSlug}/home`);
}

export default async function CashierHomePage({
  params,
}: CashierHomePageProps) {
  return <CashierHomeContent />;
}
