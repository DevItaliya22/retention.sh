"use client";

import { CustomerImportSheet } from "@/components/customers/CustomerImportSheet";
import { DashboardPageShell, ScaffoldSection } from "@/components/layouts";
import { Button, Tabs, TabsList, TabsTrigger } from "@reelo/ui/components";
import { FileUp } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useState } from "react";

export default function CustomersLayout({ children }: { children: ReactNode }) {
  const [isImportSheetOpen, setIsImportSheetOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const activeTab = pathname === "/customers/rfm" ? "rfm" : "all";

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
        <Tabs value={activeTab} className="w-full">
          <div className="flex items-center justify-between gap-4">
            <TabsList className="space-x-1 p-1">
              <TabsTrigger
                value="all"
                onClick={() => router.push("/customers")}
              >
                Customers
              </TabsTrigger>
              <TabsTrigger
                value="rfm"
                onClick={() => router.push("/customers/rfm")}
              >
                Customer segments
              </TabsTrigger>
            </TabsList>
          </div>
          <div className="mt-4">{children}</div>
        </Tabs>
      </ScaffoldSection>
      <CustomerImportSheet
        isOpen={isImportSheetOpen}
        onClose={() => setIsImportSheetOpen(false)}
      />
    </DashboardPageShell>
  );
}
