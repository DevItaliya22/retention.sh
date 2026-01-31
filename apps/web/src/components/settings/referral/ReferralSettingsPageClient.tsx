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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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

  const subtitle = !hasProgram
    ? "Set up your referral program to reward customers"
    : !referralEnabled
      ? "Referral is set up but turned off. Enable it in General settings to use it."
      : "View and edit your referral program settings";

  return (
    <PageLayout
      title="Referral Program"
      subtitle={subtitle}
      size="default"
      scaffoldSectionClassName="h-full w-full pt-2 pb-0"
    >
      <ScaffoldContainer>
        {!hasProgram ? (
          <>
            <Card className="mb-6 border-dashed">
              <CardHeader>
                <CardTitle className="text-base">
                  Your referral is not yet set up
                </CardTitle>
                <CardDescription>
                  Create your referral program below. After setup, turn it on in
                  Settings → General.
                </CardDescription>
              </CardHeader>
            </Card>
            <ReferralProgramForm initialData={null} />
          </>
        ) : !referralEnabled ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Referral is set up but it&apos;s off
              </CardTitle>
              <CardDescription>
                Your referral program is configured but not enabled. Turn on
                &quot;Referral enabled&quot; in General settings for customers
                to use referral links.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="default"
                onClick={() => router.push("/settings")}
              >
                Go to General settings
              </Button>
            </CardContent>
          </Card>
        ) : (
          <ReferralExistingSettings
            referralProgram={programData!.referralProgram as ReferralProgram}
          />
        )}
      </ScaffoldContainer>
    </PageLayout>
  );
}
