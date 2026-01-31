import { getCashierSession } from "@/lib/auth/cashier-session";
import { generateRouteMetadata } from "@/lib/utils/route-metadata";
import { prisma } from "@reelo/db";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CashierErrorPage } from "./_components/CashierErrorPage";
import { CashierLoginForm } from "./_components/CashierLoginForm";

interface CashierLoginPageProps {
  params: Promise<{
    businessSlug: string;
    cashierSlug: string;
  }>;
}

export async function generateMetadata({
  params,
}: CashierLoginPageProps): Promise<Metadata> {
  const { businessSlug, cashierSlug } = await params;
  return generateRouteMetadata(`/cashier/${businessSlug}/${cashierSlug}`);
}

export default async function CashierLoginPage({
  params,
}: CashierLoginPageProps) {
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

  const cashier = await prisma.cashier.findFirst({
    where: {
      cashierLinkSlug: cashierSlug,
      businessId: business.id,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!cashier) {
    return (
      <CashierErrorPage
        title="Cashier Not Found"
        message={`The cashier "${cashierSlug}" could not be found in "${business.name}".`}
      />
    );
  }

  if (!cashier.isActive) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center p-4">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="bg-primary/20 absolute -top-40 -right-40 h-80 w-80 rounded-full blur-3xl" />
          <div className="bg-secondary/20 absolute -bottom-40 -left-40 h-80 w-80 rounded-full blur-3xl" />
        </div>
        <CashierErrorPage
          title="Cashier Inactive"
          message="This cashier account is inactive. Contact your administrator to restore access."
        />
      </div>
    );
  }

  const session = await getCashierSession();

  if (session?.user) {
    const userCashier = await prisma.cashier.findFirst({
      where: {
        userId: session.user.id,
        businessId: business.id,
        cashierLinkSlug: cashierSlug,
      },
    });

    if (userCashier) {
      redirect(`/cashier/${businessSlug}/${cashierSlug}/home`);
    }
  }

  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="bg-primary/20 absolute -top-40 -right-40 h-80 w-80 rounded-full blur-3xl" />
        <div className="bg-secondary/20 absolute -bottom-40 -left-40 h-80 w-80 rounded-full blur-3xl" />
        <div className="bg-muted/10 absolute top-1/2 left-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl" />
      </div>

      <CashierLoginForm
        businessSlug={businessSlug}
        cashierSlug={cashierSlug}
        businessName={business.name}
        cashierName={cashier.user.name}
      />
    </div>
  );
}
