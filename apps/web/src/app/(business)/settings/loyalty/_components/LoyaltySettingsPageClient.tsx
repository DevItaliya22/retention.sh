"use client";

import { PageLayout, ScaffoldContainer } from "@/components/layouts";
import { LoyaltyProgramForm } from "@/components/settings/loyalty/_components/LoyaltyProgramForm";
import { LoyaltyExistingSettings } from "@/components/settings/loyalty/LoyaltyExistingSettings";
import { LoyaltySettingsSkeleton } from "@/components/settings/loyalty/LoyaltySettingsSkeleton";
import { useCurrentBusiness } from "@/hooks/business/useCurrentBusiness";
import { useLoyaltySettingsQuery } from "@/hooks/loyalty/useLoyaltySettings";
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

export function LoyaltySettingsPageClient() {
  const router = useRouter();
  const { data: businessData, isLoading: businessLoading } =
    useCurrentBusiness();
  const { data: loyaltyData, isLoading: loyaltyLoading } =
    useLoyaltySettingsQuery();

  const isLoading = businessLoading || loyaltyLoading;
  const hasLoyalty = !!loyaltyData?.loyalty;
  const loyaltyEnabled =
    isServiceEnabled(businessData?.business?.isServiceEnabled, "loyalty") ??
    false;

  if (isLoading && !loyaltyData && !businessData) {
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
