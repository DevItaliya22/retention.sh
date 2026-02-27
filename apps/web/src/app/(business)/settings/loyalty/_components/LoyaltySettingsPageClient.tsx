"use client";

import { PageLayout, ScaffoldContainer } from "@/components/layouts";
import { LoyaltyProgramForm } from "@/components/settings/loyalty/_components/LoyaltyProgramForm";
import { LoyaltyExistingSettings } from "@/components/settings/loyalty/LoyaltyExistingSettings";
import { LoyaltySettingsSkeleton } from "@/components/settings/loyalty/LoyaltySettingsSkeleton";
import { useCurrentBusiness } from "@/hooks/business/useCurrentBusiness";
import { useLoyaltySettingsQuery } from "@/hooks/loyalty/useLoyaltySettings";
import { LOYALTY_ONBOARDED_KEY } from "@/lib/constants/settings-storage";
import { isServiceEnabled } from "@/lib/utils/service-enabled";
import {
  Button,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@reelo/ui/components";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

function LoyaltySkeletonLayout() {
  return (
    <PageLayout
      title="Loyalty Settings"
      subtitle="Configure earning, redemption, expiry, and communication"
      size="default"
      scaffoldSectionClassName="h-full w-full pt-2 pb-0"
    >
      <ScaffoldContainer>
        <LoyaltySettingsSkeleton />
      </ScaffoldContainer>
    </PageLayout>
  );
}

export function LoyaltySettingsPageClient() {
  const router = useRouter();
  const { data: businessData } = useCurrentBusiness();
  const { data: loyaltyData } = useLoyaltySettingsQuery();

  const hasLoyalty = !!loyaltyData?.loyalty;
  const loyaltyEnabled =
    isServiceEnabled(businessData?.business?.isServiceEnabled, "loyalty") ??
    false;

  // Sync localStorage with API so next visit doesn't flash onboarding (API remains source of truth)
  useEffect(() => {
    if (loyaltyData === undefined) return;
    try {
      window.localStorage.setItem(
        LOYALTY_ONBOARDED_KEY,
        JSON.stringify(!!loyaltyData?.loyalty),
      );
    } catch {
      // ignore
    }
  }, [loyaltyData]);

  // Show skeleton until we have a definitive loyalty API response (avoids flash of onboarding)
  if (loyaltyData === undefined) {
    return <LoyaltySkeletonLayout />;
  }

  // Only show onboarding when API has responded and said no program
  if (loyaltyEnabled && !hasLoyalty) {
    return <LoyaltyProgramForm initialData={null} embedded />;
  }

  const subtitle = !loyaltyEnabled
    ? "Loyalty is disabled for this business"
    : "Configure earning, redemption, expiry, and communication";

  return (
    <PageLayout
      title="Loyalty Settings"
      subtitle={subtitle}
      size="default"
      scaffoldSectionClassName="h-full w-full pt-2 pb-0"
    >
      <ScaffoldContainer>
        {!loyaltyEnabled ? (
          <Empty className="min-h-[200px]">
            <EmptyHeader>
              <EmptyTitle>Enable it in General settings first</EmptyTitle>
              <EmptyDescription>
                Turn on &quot;Loyalty enabled&quot; to set up or use the loyalty
                program.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button
                variant="default"
                onClick={() => router.push("/settings")}
              >
                Go to General settings
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <LoyaltyExistingSettings />
        )}
      </ScaffoldContainer>
    </PageLayout>
  );
}
