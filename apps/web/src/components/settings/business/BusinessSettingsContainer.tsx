"use client";

import { PageLayout, ScaffoldContainer } from "@/components/layouts";
import { useCurrentBusiness } from "@/hooks/business/useCurrentBusiness";
import { BusinessExistingSettings } from "./BusinessExistingSettings";
import { BusinessOnboardingSettings } from "./BusinessOnboardingSettings";
import { BusinessSettingsSkeleton } from "./BusinessSettingsSkeleton";

function SettingsSkeleton() {
  return (
    <PageLayout
      size="default"
      scaffoldSectionClassName="h-full w-full pt-2 pb-16"
    >
      <ScaffoldContainer>
        <BusinessSettingsSkeleton />
      </ScaffoldContainer>
    </PageLayout>
  );
}

export function BusinessSettingsContainer() {
  const { data, isLoading, isError } = useCurrentBusiness();

  if (isLoading) {
    return <SettingsSkeleton />;
  }

  if (isError) {
    return (
      <div className="text-destructive text-sm">
        Failed to load business settings. Please try again later.
      </div>
    );
  }

  if (!data || !data.business) {
    return <BusinessOnboardingSettings />;
  }

  return <BusinessExistingSettings business={data.business} />;
}
