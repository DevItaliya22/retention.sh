"use client";

import { useCurrentBusiness } from "@/hooks/business/useCurrentBusiness";
import { BusinessExistingSettings } from "./BusinessExistingSettings";
import { BusinessOnboardingSettings } from "./BusinessOnboardingSettings";
import { Skeleton } from "@reelo/ui/components";

export function BusinessSettingsContainer() {
  const { data, isLoading, isError } = useCurrentBusiness();

  if (isLoading) {
    return <Skeleton className="h-40 w-full" />;
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

