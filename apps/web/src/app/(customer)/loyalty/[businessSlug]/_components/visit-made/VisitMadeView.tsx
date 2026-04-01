"use client";

import { BrandingHero } from "../common/BrandingHero";
import { FreeItemsCard } from "../common/FreeItemsCard";
import { LoyaltyNavbar } from "../common/LoyaltyNavbar";
import { MobileLayout } from "../common/MobileLayout";
import { RewardOffersGrid } from "../common/RewardOffersGrid";
import { TransactionHistory } from "../common/TransactionHistory";
import { VisitCountCard } from "../common/VisitCountCard";
import { WalletOverview } from "../common/WalletOverview";
import type { LoyaltyData } from "../common/types";
import { VisitProgressionCard } from "./VisitProgressionCard";

interface VisitMadeViewProps {
  data: LoyaltyData;
}

export function VisitMadeView({ data }: VisitMadeViewProps) {
  const { visitMadeInfo } = data;
  const ac = data.branding?.themeColor ?? undefined;

  return (
    <MobileLayout branding={data.branding}>
      <LoyaltyNavbar
        businessName={data.business.name}
        businessSlug={data.business.slug}
        branding={data.branding}
      />
      <BrandingHero branding={data.branding} />
      <div className="space-y-4 p-4 pb-8">
        <WalletOverview
          pointsBalance={data.pointsBalance}
          cashbackBalance={data.cashbackBalance}
          freeItemCount={data.freeItems.length}
          currencySymbol={data.business.currencySymbol}
          accentColor={ac}
          pointsSubtitle={
            visitMadeInfo
              ? `${visitMadeInfo.pointsPerVisit} pt${visitMadeInfo.pointsPerVisit !== 1 ? "s" : ""} / visit`
              : undefined
          }
        />

        <VisitCountCard
          count={visitMadeInfo?.visitCount ?? 0}
          accentColor={ac}
        />

        {visitMadeInfo && visitMadeInfo.rewardStages.length > 0 && (
          <VisitProgressionCard
            stages={visitMadeInfo.rewardStages}
            currentPoints={data.pointsBalance}
            nextStage={visitMadeInfo.nextStage}
            accentColor={ac}
          />
        )}

        {visitMadeInfo && visitMadeInfo.rewardStages.length > 0 && (
          <RewardOffersGrid
            stages={visitMadeInfo.rewardStages}
            currentPoints={data.pointsBalance}
            accentColor={ac}
          />
        )}

        <FreeItemsCard items={data.freeItems} accentColor={ac} />
        <TransactionHistory transactions={data.transactions} accentColor={ac} />
      </div>
    </MobileLayout>
  );
}
