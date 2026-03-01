"use client";

import { DashboardPageShell } from "@/components/layouts";
import { ReferralStatsTable } from "@/components/referral-stats/ReferralStatsTable";
import { useReferralStatsQuery } from "@/hooks/referral/useReferralProgram";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { REFERRAL_ONBOARDED_KEY } from "@/lib/constants/settings-storage";
import { isServiceEnabled } from "@/lib/utils/service-enabled";
import {
  Button,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Skeleton,
} from "@reelo/ui/components";
import { Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { Suspense } from "react";

function ReferralEmptyState() {
  const router = useRouter();
  return (
    <Empty className="border-border/45 bg-background rounded-lg border border-dashed py-12">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Users className="text-muted-foreground size-10" strokeWidth={1.25} />
        </EmptyMedia>
        <EmptyTitle>No referral stats yet</EmptyTitle>
        <EmptyDescription>
          You haven&apos;t set up the referral program yet. Get started by
          enabling it in Settings to see who referred and reward referrers.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent className="mt-2">
        <Button onClick={() => router.push("/settings")}>Go to Settings</Button>
      </EmptyContent>
    </Empty>
  );
}

function ReferralStatsContent() {
  const [referralOnboarded] = useLocalStorage(REFERRAL_ONBOARDED_KEY, false);
  const { data, isLoading, isError } = useReferralStatsQuery({
    enabled: referralOnboarded,
  });
  const referralEnabled =
    !isError && isServiceEnabled(data?.isServiceEnabled, "referral");

  if (!referralOnboarded) return <ReferralEmptyState />;

  if (isLoading && data == null) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!referralEnabled) return <ReferralEmptyState />;

  return <ReferralStatsTable />;
}

export function ReferralStatsPageClient() {
  const router = useRouter();
  const [referralOnboarded] = useLocalStorage(REFERRAL_ONBOARDED_KEY, false);
  const { data, isError } = useReferralStatsQuery({
    enabled: referralOnboarded,
  });
  const referralEnabled =
    !isError && isServiceEnabled(data?.isServiceEnabled, "referral");

  return (
    <DashboardPageShell
      title="Referral stats"
      subtitle="Who referred and how many people they referred"
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
    </DashboardPageShell>
  );
}
