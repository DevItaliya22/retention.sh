"use client";

import { FreeItemsCard } from "../common/FreeItemsCard";
import { LoyaltyNavbar } from "../common/LoyaltyNavbar";
import { MobileLayout } from "../common/MobileLayout";
import { TransactionHistory } from "../common/TransactionHistory";
import { WalletOverview } from "../common/WalletOverview";
import type { LoyaltyData } from "../common/types";

interface CashbackViewProps {
  data: LoyaltyData;
}

export function CashbackView({ data }: CashbackViewProps) {
  const ac = data.branding?.themeColor ?? undefined;

  return (
    <MobileLayout branding={data.branding}>
      <LoyaltyNavbar
        businessName={data.business.name}
        businessSlug={data.business.slug}
        branding={data.branding}
      />
      <div className="space-y-4 p-4 pb-8">
        <WalletOverview
          pointsBalance={data.pointsBalance}
          cashbackBalance={data.cashbackBalance}
          freeItemCount={data.freeItems.length}
          currencySymbol={data.business.currencySymbol}
          accentColor={ac}
        />
        <FreeItemsCard items={data.freeItems} accentColor={ac} />
        <TransactionHistory transactions={data.transactions} accentColor={ac} />
      </div>
    </MobileLayout>
  );
}
