"use client";

import { DashboardPageShell } from "@/components/layouts";
import { ReferralStatsTable } from "@/components/referral-stats/ReferralStatsTable";
import { Button, Skeleton } from "@reelo/ui/components";
import { useRouter } from "next/navigation";
import { Suspense } from "react";

function ReferralStatsContent() {
  return <ReferralStatsTable />;
}

export function ReferralStatsPageClient() {
  const router = useRouter();

  return (
    <DashboardPageShell
      title="Referral stats"
      subtitle="Who referred and how many people they referred"
      contentClassName="py-3"
      primaryActions={
        <Button
          variant="outline"
          onClick={() => router.push("/settings/referral")}
        >
          Edit referral settings
        </Button>
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
