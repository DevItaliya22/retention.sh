"use client";

import { PageLayout, ScaffoldContainer } from "@/components/layouts";
import { ReferralStatsTable } from "@/components/settings/referral/ReferralStatsTable";
import { useReferralStatsQuery } from "@/hooks/referral/useReferralProgram";
import { Button, Skeleton } from "@reelo/ui/components";
import { useRouter } from "next/navigation";
import { Suspense } from "react";

function ReferralStatsContent() {
  const router = useRouter();
  const { data, isLoading, isError } = useReferralStatsQuery();
  const referralEnabled = !isError && (data?.referralEnabled ?? false);

  if (isLoading && data == null) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!referralEnabled) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <p className="text-muted-foreground mb-2 text-sm font-medium">
          You have not enabled the referral scheme yet.
        </p>
        <p className="text-muted-foreground mb-6 text-sm">
          Please enable it first to see referral stats and reward referrers.
        </p>
        <Button onClick={() => router.push("/settings/referral")}>
          Set up referral program
        </Button>
      </div>
    );
  }

  return <ReferralStatsTable />;
}

export function ReferralStatsPageClient() {
  const router = useRouter();
  const { data, isError } = useReferralStatsQuery();
  const referralEnabled = !isError && (data?.referralEnabled ?? false);

  return (
    <PageLayout
      title="Referral stats"
      subtitle="Who referred and how many people they referred"
      size="full"
      scaffoldSectionClassName="h-full w-full pt-2 pb-0"
      primaryActions={
        referralEnabled ? (
          <Button
            variant="outline"
            onClick={() => router.push("/settings/referral")}
          >
            Edit referral settings
          </Button>
        ) : undefined
      }
    >
      <ScaffoldContainer className="px-6">
        <Suspense
          fallback={
            <div className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          }
        >
          <ReferralStatsContent />
        </Suspense>
      </ScaffoldContainer>
    </PageLayout>
  );
}
