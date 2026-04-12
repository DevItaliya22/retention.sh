"use client";

import { DashboardPageShell } from "@/components/layouts";
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

export function ReferralSettingsPageClient() {
  const router = useRouter();
  const { data: programData } = useReferralProgram();
  const { data: businessData } = useCurrentBusiness();
  const hasProgram = !!programData?.referralProgram;
  const referralEnabled =
    isServiceEnabled(businessData?.business?.isServiceEnabled, "referral") ??
    false;

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

  if (programData === undefined) {
    return (
      <DashboardPageShell
        title="Referral Program"
        subtitle="Set up your referral program to reward customers"
        contentVariant="contained"
        tourAnchor="onboarding-tour-referral"
      >
        <ReferralSettingsSkeleton />
      </DashboardPageShell>
    );
  }

  if (referralEnabled && !hasProgram) {
    return (
      <DashboardPageShell
        title="Referral Program"
        subtitle="Set up your referral program to reward customers"
        contentVariant="contained"
        tourAnchor="onboarding-tour-referral"
      >
        <ReferralProgramForm initialData={null} embedded />
      </DashboardPageShell>
    );
  }

  const subtitle = !referralEnabled
    ? "Referral is disabled for this business"
    : "View and edit your referral program settings";

  return (
    <DashboardPageShell
      title="Referral Program"
      subtitle={subtitle}
      contentVariant="contained"
      tourAnchor="onboarding-tour-referral"
    >
      {!referralEnabled ? (
        <Empty className="min-h-[200px]">
          <EmptyHeader>
            <EmptyTitle>Enable it in General settings first</EmptyTitle>
            <EmptyDescription>
              Turn on &quot;Referral enabled&quot; to set up or use the referral
              program.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button variant="default" onClick={() => router.push("/settings")}>
              Go to General settings
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <ReferralExistingSettings
          referralProgram={programData!.referralProgram as ReferralProgram}
        />
      )}
    </DashboardPageShell>
  );
}
