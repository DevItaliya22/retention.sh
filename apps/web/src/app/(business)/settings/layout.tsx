import { PageLayout, ScaffoldContainer } from "@/components/layouts";
import { Settings, Users } from "lucide-react";
import { ReactNode } from "react";

interface SettingsLayoutProps {
  children: ReactNode;
}

export default async function SettingsLayout({
  children,
}: SettingsLayoutProps) {
  const navigationItems = [
    {
      label: "General",
      href: `/settings`,
      icon: <Settings className="h-4 w-4" />,
    },
    {
      label: "Cashier",
      href: `/settings/cashier`,
      icon: <Users className="h-4 w-4" />,
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
