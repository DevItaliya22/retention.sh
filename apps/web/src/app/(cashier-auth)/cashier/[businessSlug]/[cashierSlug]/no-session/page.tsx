import { prisma } from "@reelo/db";
import { CashierNoSessionPage } from "../_components/CashierNoSessionPage";
import { CashierErrorPage } from "../_components/CashierErrorPage";
import { generateRouteMetadata } from "@/lib/utils/route-metadata";
import type { Metadata } from "next";

interface CashierNoSessionPageProps {
  params: Promise<{
    businessSlug: string;
    cashierSlug: string;
  }>;
}

export async function generateMetadata({
  params,
}: CashierNoSessionPageProps): Promise<Metadata> {
  const { businessSlug, cashierSlug } = await params;
  return generateRouteMetadata(`/cashier/${businessSlug}/${cashierSlug}/no-session`);
}

export default async function CashierNoSessionRoute({
  params,
}: CashierNoSessionPageProps) {
  const { businessSlug, cashierSlug } = await params;

  const business = await prisma.business.findUnique({
    where: { slug: businessSlug },
    select: { id: true, name: true },
  });

  if (!business) {
    return (
      <CashierErrorPage
        title="Business Not Found"
        message={`The business "${businessSlug}" could not be found.`}
      />
    );
  }

  return <CashierNoSessionPage businessName={business.name} />;
}
