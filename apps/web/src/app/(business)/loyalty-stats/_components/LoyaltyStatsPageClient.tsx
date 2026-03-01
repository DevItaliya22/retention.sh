"use client";

import { DashboardPageShell } from "@/components/layouts";
import { LoyaltyStatsTable } from "@/components/loyalty-stats/LoyaltyStatsTable";
import { useLoyaltyStatsQuery } from "@/hooks/loyalty/useLoyaltyStatsQuery";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { LOYALTY_ONBOARDED_KEY } from "@/lib/constants/settings-storage";
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
import { Award } from "lucide-react";
import { useRouter } from "next/navigation";
import { Suspense } from "react";

function LoyaltyEmptyState() {
  const router = useRouter();
  return (
    <Empty className="border-border/45 bg-background rounded-lg border border-dashed py-12">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Award className="text-muted-foreground size-10" strokeWidth={1.25} />
        </EmptyMedia>
        <EmptyTitle>No loyalty stats yet</EmptyTitle>
        <EmptyDescription>
          Loyalty is not enabled yet. Enable it in Settings → General to see
          points earned, redeemed and stats by customer and bill.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent className="mt-2">
        <Button onClick={() => router.push("/settings")}>Go to Settings</Button>
      </EmptyContent>
    </Empty>
  );
}

function LoyaltyStatsContent() {
  const [loyaltyOnboarded] = useLocalStorage(LOYALTY_ONBOARDED_KEY, false);
  const { data, isLoading, isError } = useLoyaltyStatsQuery({
    enabled: loyaltyOnboarded,
  });

  if (!loyaltyOnboarded || isError) return <LoyaltyEmptyState />;

  if (isLoading && data == null) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return <LoyaltyStatsTable />;
}

export function LoyaltyStatsPageClient() {
  return (
    <DashboardPageShell
      title="Loyalty stats"
      subtitle="Earned and redeemed points by source, customer and bill"
    >
      <Suspense
        fallback={
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        }
      >
        <LoyaltyStatsContent />
      </Suspense>
    </DashboardPageShell>
  );
}
