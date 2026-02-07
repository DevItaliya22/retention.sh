"use client";

import { LoyaltyProgramForm } from "@/components/settings/loyalty/_components/LoyaltyProgramForm";
import { LoyaltyExistingSettings } from "@/components/settings/loyalty/LoyaltyExistingSettings";
import { LoyaltySettingsSkeleton } from "@/components/settings/loyalty/LoyaltySettingsSkeleton";
import { PageLayout, ScaffoldContainer } from "@/components/layouts";
import { useCurrentBusiness } from "@/hooks/business/useCurrentBusiness";
import { isServiceEnabled } from "@/lib/utils/service-enabled";
import { fetcher } from "@/lib/fetcher";
import {
  Button,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@reelo/ui/components";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

interface LoyaltySettingsResponse {
  loyalty: unknown;
  error?: string;
}

export function LoyaltySettingsPageClient() {
  const router = useRouter();
  const { data: businessData, isLoading: businessLoading } =
    useCurrentBusiness();
  const { data: loyaltyData, isLoading: loyaltyLoading } = useQuery<
    LoyaltySettingsResponse,
    Error
  >({
    queryKey: ["loyalty-settings"],
    queryFn: () => fetcher<LoyaltySettingsResponse>("/api/loyalty"),
    staleTime: 5000,
  });

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
