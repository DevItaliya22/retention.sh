"use client";

import { PageLayout } from "@/components/layouts";
import { useState } from "react";
import { BusinessSettingsStep } from "./business/BusinessSettingsStep";
import { CashierSettingsStep } from "./team/CashierSettingsStep";

interface SettingsPageContentProps {
  initialData: {
    business: any;
    cashiers: any[];
  };
}

export function SettingsPageContent({ initialData }: SettingsPageContentProps) {
  const [activeTab, setActiveTab] = useState("business");

  return (
    <PageLayout
      title="Settings"
      subtitle="Manage your business configuration and team members."
      size="full"
      navigationItems={[
        {
          id: "business",
          label: "Business",
          onClick: () => setActiveTab("business"),
          active: activeTab === "business",
        },
        {
          id: "team",
          label: "Team (Cashiers)",
          onClick: () => setActiveTab("team"),
          active: activeTab === "team",
        },
      ]}
    >
      <div className="container mx-auto max-w-5xl px-6 py-8">
        {activeTab === "business" && (
          <BusinessSettingsStep initialData={initialData.business} />
        )}
        {activeTab === "team" && <CashierSettingsStep />}
      </div>
    </PageLayout>
  );
}
