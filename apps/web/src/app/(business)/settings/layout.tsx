"use client";

import { PageLayout, ScaffoldContainer } from "@/components/layouts";
import { Package, Settings, Users } from "lucide-react";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

interface SettingsLayoutProps {
  children: ReactNode;
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  const pathname = usePathname();

  const navigationItems = [
    {
      label: "General",
      href: `/settings`,
      icon: <Settings className="h-4 w-4" />,
      active: pathname === "/settings",
    },
    {
      label: "Cashier",
      href: `/settings/cashier`,
      icon: <Users className="h-4 w-4" />,
      active: pathname === "/settings/cashier",
    },
    {
      label: "SKU",
      href: `/settings/sku`,
      icon: <Package className="h-4 w-4" />,
      active:
        pathname === "/settings/sku" || pathname === "/settings/sku/categories",
    },
  ];

  return (
    <PageLayout
      title="Business Settings"
      subtitle="Manage your business settings"
      navigationItems={navigationItems}
      size="full"
      scaffoldSectionClassName="h-full w-full pt-2 pb-0"
    >
      <ScaffoldContainer className="h-full w-full max-w-full p-0!">
        {children}
      </ScaffoldContainer>
    </PageLayout>
  );
}
