"use client";

import { ReferralExistingSettings } from "./ReferralExistingSettings";
import { ReferralProgramForm } from "./_components/ReferralProgramForm";
import { PageLayout, ScaffoldContainer } from "@/components/layouts";
import {
  ReferralProgram,
  useReferralProgram,
} from "@/hooks/referral/useReferralProgram";
import { Skeleton } from "@reelo/ui/components";

export function ReferralSettingsPageClient() {
  const { data, isLoading } = useReferralProgram();

  if (isLoading && !data) {
    return (
      <PageLayout
        title="Referral Program"
        subtitle="Set up your referral program to reward customers"
        size="default"
        scaffoldSectionClassName="h-full w-full pt-2 pb-0"
      >
        <ScaffoldContainer>
          <div className="space-y-4">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </ScaffoldContainer>
      </PageLayout>
    );
  }

  const hasProgram = !!data?.referralProgram;

  return (
    <PageLayout
      title="Referral Program"
      subtitle={
        hasProgram
          ? "View and edit your referral program settings"
          : "Set up your referral program to reward customers"
      }
      size="default"
      scaffoldSectionClassName="h-full w-full pt-2 pb-0"
    >
      <ScaffoldContainer>
        {hasProgram ? (
          <ReferralExistingSettings
            referralProgram={data.referralProgram as ReferralProgram}
          />
        ) : (
          <ReferralProgramForm initialData={null} />
        )}
      </ScaffoldContainer>
    </PageLayout>
  );
}
