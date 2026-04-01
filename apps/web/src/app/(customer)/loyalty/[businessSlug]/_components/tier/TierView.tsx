"use client";

import { Sparkles } from "lucide-react";
import { BrandingHero } from "../common/BrandingHero";
import { FreeItemsCard } from "../common/FreeItemsCard";
import { LoyaltyNavbar } from "../common/LoyaltyNavbar";
import { MobileLayout } from "../common/MobileLayout";
import { TransactionHistory } from "../common/TransactionHistory";
import { WalletOverview } from "../common/WalletOverview";
import type { LoyaltyData } from "../common/types";
import { TierProgressionCard } from "./TierProgressionCard";

interface TierViewProps {
  data: LoyaltyData;
}

export function TierView({ data }: TierViewProps) {
  const { tierInfo } = data;
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
        />

        {tierInfo?.currentTier && (
          <div
            className={
              ac
                ? "flex items-center gap-2 rounded-xl p-3 text-sm"
                : "flex items-center gap-2 rounded-xl bg-amber-50 p-3 text-sm dark:bg-amber-900/20"
            }
            style={ac ? { backgroundColor: `${ac}15`, color: ac } : undefined}
          >
            <Sparkles
              className={
                ac ? "size-4" : "size-4 text-amber-600 dark:text-amber-400"
              }
              style={ac ? { color: ac } : undefined}
            />
            <span className={ac ? "" : "text-amber-700 dark:text-amber-300"}>
              {tierInfo.currentTier.name} Tier &middot;{" "}
              {tierInfo.currentTier.cashbackPercentage}% cashback on every bill
            </span>
          </div>
        )}

        {tierInfo && (
          <TierProgressionCard
            tierInfo={tierInfo}
            currencySymbol={data.business.currencySymbol}
            accentColor={ac}
          />
        )}

        <FreeItemsCard items={data.freeItems} accentColor={ac} />
        <TransactionHistory transactions={data.transactions} accentColor={ac} />
      </div>
    </MobileLayout>
  );
}
