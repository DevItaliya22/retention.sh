import { prisma } from "@reelo/db";
import { redirect } from "next/navigation";
import { generateRouteMetadata } from "@/lib/utils/route-metadata";
import { getCashierSession } from "@/lib/auth/cashier-session";
import { CashierLogoutButton } from "./_components/CashierLogoutButton";
import type { Metadata } from "next";

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
  const { businessSlug, cashierSlug } = await params;

  const session = await getCashierSession();

  if (!session?.user) {
    redirect(`/cashier/${businessSlug}/${cashierSlug}`);
  }

  const business = await prisma.business.findUnique({
    where: { slug: businessSlug },
    select: { id: true, name: true },
  });

  if (!business) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Business Not Found</h1>
          <p className="text-muted-foreground mt-2">
            The business "{businessSlug}" could not be found.
          </p>
        </div>
      </div>
    );
  }

  const cashier = await prisma.cashier.findFirst({
    where: {
      cashierLinkSlug: cashierSlug,
      businessId: business.id,
      userId: session.user.id,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!cashier) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Cashier Not Found</h1>
          <p className="text-muted-foreground mt-2">
            You are not authorized to access this cashier account.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Cashier Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome, {cashier.user.name}!
          </p>
          <p className="text-sm text-muted-foreground">
            Business: {business.name}
          </p>
        </div>
        <div className="flex justify-center">
          <CashierLogoutButton
            businessSlug={businessSlug}
            cashierSlug={cashierSlug}
          />
        </div>
      </div>
    </div>
  );
}
