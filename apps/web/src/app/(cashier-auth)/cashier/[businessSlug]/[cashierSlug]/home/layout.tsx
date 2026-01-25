import { prisma } from "@reelo/db";
import { redirect } from "next/navigation";
import { getCashierSession } from "@/lib/auth/cashier-session";
import { CashierProvider } from "./_context/CashierProvider";

interface CashierHomeLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    businessSlug: string;
    cashierSlug: string;
  }>;
}

export default async function CashierHomeLayout({
  children,
  params,
}: CashierHomeLayoutProps) {
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
    <CashierProvider
      value={{
        business,
        cashier,
        businessSlug,
        cashierSlug,
      }}
    >
      {children}
    </CashierProvider>
  );
}
