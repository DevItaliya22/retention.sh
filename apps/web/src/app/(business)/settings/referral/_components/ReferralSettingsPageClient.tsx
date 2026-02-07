"use client";

import { ReferralExistingSettings } from "@/components/settings/referral/ReferralExistingSettings";
import { ReferralSettingsSkeleton } from "@/components/settings/referral/ReferralSettingsSkeleton";
import { ReferralProgramForm } from "@/components/settings/referral/_components/ReferralProgramForm";
import { PageLayout, ScaffoldContainer } from "@/components/layouts";
import { useCurrentBusiness } from "@/hooks/business/useCurrentBusiness";
import { isServiceEnabled } from "@/lib/utils/service-enabled";
import {
  ReferralProgram,
  useReferralProgram,
} from "@/hooks/referral/useReferralProgram";
import {
  Button,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@reelo/ui/components";
import { useRouter } from "next/navigation";

export function ReferralSettingsPageClient() {
  const router = useRouter();
  const { data: programData, isLoading: programLoading } = useReferralProgram();
  const { data: businessData, isLoading: businessLoading } =
    useCurrentBusiness();

  const isLoading = programLoading || businessLoading;
  const hasProgram = !!programData?.referralProgram;
  const referralEnabled =
    isServiceEnabled(businessData?.business?.isServiceEnabled, "referral") ??
    false;

  if (isLoading && !programData && !businessData) {
    return (
      <PageLayout
        title="Referral Program"
        subtitle="Set up your referral program to reward customers"
        size="default"
        scaffoldSectionClassName="h-full w-full pt-2 pb-0"
      >
        <ScaffoldContainer>
          <ReferralSettingsSkeleton />
        </ScaffoldContainer>
      </PageLayout>
    );
  }

  // Embedded multi-step form: render directly (no PageLayout/Scaffold), same as BusinessOnboardingSettings
  if (referralEnabled && !hasProgram) {
    return <ReferralProgramForm initialData={null} embedded />;
  }

  const subtitle = !referralEnabled
    ? "Referral is disabled for this business"
    : "View and edit your referral program settings";

  return (
    <PageLayout
      title="Referral Program"
      subtitle={subtitle}
      size="default"
      scaffoldSectionClassName="h-full w-full pt-2 pb-0"
    >
      <ScaffoldContainer>
        {!referralEnabled ? (
          <Empty className="min-h-[200px]">
            <EmptyHeader>
              <EmptyTitle>Enable it in General settings first</EmptyTitle>
              <EmptyDescription>
                Turn on &quot;Referral enabled&quot; to set up or use the
                referral program.
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
          <ReferralExistingSettings
            referralProgram={programData!.referralProgram as ReferralProgram}
          />
        )}
      </ScaffoldContainer>
    </PageLayout>
  );
}
