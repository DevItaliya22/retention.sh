"use client";

import { ReferralExistingSettings } from "./ReferralExistingSettings";
import { ReferralProgramForm } from "./_components/ReferralProgramForm";
import { PageLayout, ScaffoldContainer } from "@/components/layouts";
import { useCurrentBusiness } from "@/hooks/business/useCurrentBusiness";
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
  Skeleton,
} from "@reelo/ui/components";
import { useRouter } from "next/navigation";

export function ReferralSettingsPageClient() {
  const router = useRouter();
  const { data: programData, isLoading: programLoading } = useReferralProgram();
  const { data: businessData, isLoading: businessLoading } =
    useCurrentBusiness();

  const isLoading = programLoading || businessLoading;
  const hasProgram = !!programData?.referralProgram;
  const referralEnabled = businessData?.business?.referralEnabled ?? false;

  if (isLoading && !programData && !businessData) {
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

  const subtitle = !referralEnabled
    ? "Referral is disabled for this business"
    : !hasProgram
      ? "Set up your referral program to reward customers"
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
        ) : !hasProgram ? (
          <ReferralProgramForm initialData={null} />
        ) : (
          <ReferralExistingSettings
            referralProgram={programData!.referralProgram as ReferralProgram}
          />
        )}
      </ScaffoldContainer>
    </PageLayout>
  );
}
