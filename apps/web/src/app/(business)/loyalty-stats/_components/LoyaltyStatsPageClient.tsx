"use client";

import { LoyaltyStatsTable } from "@/components/loyalty-stats/LoyaltyStatsTable";
import { PageLayout, ScaffoldContainer } from "@/components/layouts";
import { Skeleton } from "@reelo/ui/components";
import { Suspense } from "react";

function LoyaltyStatsContent() {
  return <LoyaltyStatsTable />;
}

export function LoyaltyStatsPageClient() {
  return (
    <PageLayout
      title="Loyalty stats"
      subtitle="Earned and redeemed points by source, customer and bill"
      size="full"
      scaffoldSectionClassName="h-full w-full pt-2 pb-0"
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
          <LoyaltyStatsContent />
        </Suspense>
      </ScaffoldContainer>
    </PageLayout>
  );
}
