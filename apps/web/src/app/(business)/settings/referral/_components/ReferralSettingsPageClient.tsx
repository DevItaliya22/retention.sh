"use client";

import { PageLayout, ScaffoldContainer } from "@/components/layouts";
import { ReferralExistingSettings } from "@/components/settings/referral/ReferralExistingSettings";
import { ReferralSettingsSkeleton } from "@/components/settings/referral/ReferralSettingsSkeleton";
import { ReferralProgramForm } from "@/components/settings/referral/_components/ReferralProgramForm";
import { useCurrentBusiness } from "@/hooks/business/useCurrentBusiness";
import {
  ReferralProgram,
  useReferralProgram,
} from "@/hooks/referral/useReferralProgram";
import { REFERRAL_ONBOARDED_KEY } from "@/lib/constants/settings-storage";
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

function ReferralSkeletonLayout() {
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

export function ReferralSettingsPageClient() {
  const router = useRouter();
  const { data: programData } = useReferralProgram();
  const { data: businessData } = useCurrentBusiness();

  const hasProgram = !!programData?.referralProgram;
  const referralEnabled =
    isServiceEnabled(businessData?.business?.isServiceEnabled, "referral") ??
    false;

  // Sync localStorage with API so next visit doesn't flash onboarding (API remains source of truth)
  useEffect(() => {
    if (programData === undefined) return;
    try {
      window.localStorage.setItem(
        REFERRAL_ONBOARDED_KEY,
        JSON.stringify(!!programData?.referralProgram),
      );
    } catch {
      // ignore
    }
  }, [programData]);

  // Show skeleton until we have a definitive referral API response (avoids flash of onboarding)
  if (programData === undefined) {
    return <ReferralSkeletonLayout />;
  }

  // Only show onboarding when API has responded and said no program
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
