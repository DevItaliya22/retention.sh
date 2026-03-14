"use client";

import { CustomerImportSheet } from "@/components/customers/CustomerImportSheet";
import {
  DashboardPageShell,
  GooeyTabs,
  ScaffoldSection,
} from "@/components/layouts";
import { Button } from "@reelo/ui/components";
import { FileUp } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useState } from "react";

const CUSTOMERS_TABS = [
  { value: "all", label: "Customers", path: "/customers" },
  { value: "rfm", label: "Customer segments", path: "/customers/rfm" },
];

export default function CustomersLayout({ children }: { children: ReactNode }) {
  const [isImportSheetOpen, setIsImportSheetOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const activeTab = pathname === "/customers/rfm" ? "rfm" : "all";
  const isCustomerDetailRoute =
    pathname.startsWith("/customers/") &&
    pathname !== "/customers" &&
    pathname !== "/customers/rfm";

  if (isCustomerDetailRoute) {
    return children;
  }

  return (
    <DashboardPageShell
      title="Customers"
      subtitle="View and manage all customers for your business"
      primaryActions={
        <Button
          variant="outline"
          icon={<FileUp className="h-4 w-4" />}
          onClick={() => setIsImportSheetOpen(true)}
        >
          Import
        </Button>
      }
    >
      <ScaffoldSection isFullWidth className="pt-0!">
        <GooeyTabs
          gooeyId="customers-gooey"
          tabs={CUSTOMERS_TABS}
          activeTab={activeTab}
          onTabChange={(path) => router.push(path)}
        >
          {children}
        </GooeyTabs>
      </ScaffoldSection>
      <CustomerImportSheet
        isOpen={isImportSheetOpen}
        onClose={() => setIsImportSheetOpen(false)}
      />
    </DashboardPageShell>
  );
}
