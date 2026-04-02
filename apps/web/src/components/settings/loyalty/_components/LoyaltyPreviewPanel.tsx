"use client";

import { FreeItemsCard } from "@/app/(customer)/loyalty/[businessSlug]/_components/common/FreeItemsCard";
import { LoyaltyNavbar } from "@/app/(customer)/loyalty/[businessSlug]/_components/common/LoyaltyNavbar";
import { RewardOffersGrid } from "@/app/(customer)/loyalty/[businessSlug]/_components/common/RewardOffersGrid";
import { TransactionHistory } from "@/app/(customer)/loyalty/[businessSlug]/_components/common/TransactionHistory";
import type {
  FreeItem,
  LoyaltyBranding,
  LoyaltyTransaction,
  RewardStage,
  TierInfo,
} from "@/app/(customer)/loyalty/[businessSlug]/_components/common/types";
import { VisitCountCard } from "@/app/(customer)/loyalty/[businessSlug]/_components/common/VisitCountCard";
import { WalletOverview } from "@/app/(customer)/loyalty/[businessSlug]/_components/common/WalletOverview";
import { TierProgressionCard } from "@/app/(customer)/loyalty/[businessSlug]/_components/tier/TierProgressionCard";
import { VisitProgressionCard } from "@/app/(customer)/loyalty/[businessSlug]/_components/visit-made/VisitProgressionCard";
import type { LoyaltyResponse } from "@/hooks/loyalty/useLoyaltySettings";
import { useR2Upload } from "@/hooks/storage/useR2Upload";
import {
  Button,
  Input,
  Label,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@reelo/ui/components";
import { Smartphone, Sparkles } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface BrandingFormValues {
  logo: string | null;
  bannerImage: string | null;
  themeColor: string | null;
  textColor: string | null;
  header: string | null;
  subtitle: string | null;
}

interface LoyaltyPreviewPanelProps {
  loyaltyType: LoyaltyResponse["loyaltyType"];
  brandingValues: BrandingFormValues;
  businessName: string;
}

// ── Mock data ──────────────────────────────────────────────────────────────

const MOCK_FREE_ITEMS: FreeItem[] = [
  {
    id: "fi-1",
    skuId: null,
    skuName: "Free Coffee",
    source: "LOYALTY",
    createdAt: new Date().toISOString(),
  },
  {
    id: "fi-2",
    skuId: null,
    skuName: "Free Pastry",
    source: "LOYALTY",
    createdAt: new Date().toISOString(),
  },
];

const now = new Date();
const MOCK_TRANSACTIONS: LoyaltyTransaction[] = [
  {
    valueKind: "POINTS",
    amount: 50,
    type: "EARNED",
    source: "BILL",
    description: "Bill #1001",
    createdAt: new Date(now.getTime() - 30 * 60000).toISOString(),
    expiresAt: new Date(now.getTime() + 90 * 86400000).toISOString(),
    metadata: null,
    campaignTitle: null,
  },
  {
    valueKind: "CASHBACK",
    amount: -25,
    type: "REDEEMED",
    source: "BILL",
    description: "Points redeemed",
    createdAt: new Date(now.getTime() - 60 * 60000).toISOString(),
    expiresAt: null,
    metadata: null,
    campaignTitle: null,
  },
  {
    valueKind: "FREE_ITEM",
    amount: 1,
    type: "EARNED",
    source: "LOYALTY",
    description: "Free item: Free Coffee",
    createdAt: new Date(now.getTime() - 120 * 60000).toISOString(),
    expiresAt: null,
    metadata: JSON.stringify({ freeItemName: "Free Coffee" }),
    campaignTitle: null,
  },
  {
    valueKind: "POINTS",
    amount: 30,
    type: "EARNED",
    source: "BILL",
    description: "Bill #1002",
    createdAt: new Date(now.getTime() - 180 * 60000).toISOString(),
    expiresAt: new Date(now.getTime() + 90 * 86400000).toISOString(),
    metadata: null,
    campaignTitle: null,
  },
];

const MOCK_REWARD_STAGES: RewardStage[] = [
  {
    id: "rs-1",
    rewardName: "5% off",
    rewardType: "PERCENTAGE_DISCOUNT",
    pointsRequired: 100,
    canRedeem: true,
    freeItemName: null,
    percentageValue: 5,
    cashAmount: null,
  },
  {
    id: "rs-2",
    rewardName: "Flat Rs 100 off",
    rewardType: "CASH_DISCOUNT",
    pointsRequired: 200,
    canRedeem: false,
    freeItemName: null,
    percentageValue: null,
    cashAmount: 100,
  },
  {
    id: "rs-3",
    rewardName: "Free item 3",
    rewardType: "FREE_ITEM",
    pointsRequired: 300,
    canRedeem: false,
    freeItemName: "Free item 3",
    percentageValue: null,
    cashAmount: null,
  },
];

const MOCK_TIER_INFO: TierInfo = {
  currentTier: { name: "Silver", cashbackPercentage: 5 },
  allTiers: [
    {
      name: "Bronze",
      minLifetimeSpend: 0,
      maxLifetimeSpend: 5000,
      cashbackPercentage: 2,
    },
    {
      name: "Silver",
      minLifetimeSpend: 5000,
      maxLifetimeSpend: 15000,
      cashbackPercentage: 5,
    },
    {
      name: "Gold",
      minLifetimeSpend: 15000,
      maxLifetimeSpend: null,
      cashbackPercentage: 10,
    },
  ],
  lifetimeSpend: 8500,
  nextTier: { name: "Gold", minLifetimeSpend: 15000, cashbackPercentage: 10 },
  spendToNextTier: 6500,
};

// ── Component ──────────────────────────────────────────────────────────────

export function LoyaltyPreviewPanel({
  loyaltyType,
  brandingValues,
  businessName,
}: LoyaltyPreviewPanelProps) {
  const { getReadSignedUrl } = useR2Upload();
  const [resolvedUrls, setResolvedUrls] = useState<Record<string, string>>({});

  const resolveKey = useCallback(
    (key: string | null) => {
      if (!key) return null;
      if (key.startsWith("blob:") || key.startsWith("http")) return key;
      return resolvedUrls[key] ?? null;
    },
    [resolvedUrls],
  );

  useEffect(() => {
    const keys = [brandingValues.logo, brandingValues.bannerImage].filter(
      (k): k is string =>
        !!k && !k.startsWith("blob:") && !k.startsWith("http"),
    );
    if (keys.length === 0) return;

    let cancelled = false;
    void Promise.all(
      keys.map(async (k) => {
        if (resolvedUrls[k]) return;
        try {
          const url = await getReadSignedUrl(k);
          if (!cancelled) setResolvedUrls((prev) => ({ ...prev, [k]: url }));
        } catch {}
      }),
    );
    return () => {
      cancelled = true;
    };
  }, [
    brandingValues.logo,
    brandingValues.bannerImage,
    getReadSignedUrl,
    resolvedUrls,
  ]);

  const branding: LoyaltyBranding = {
    logoUrl: resolveKey(brandingValues.logo),
    bannerImageUrl: resolveKey(brandingValues.bannerImage),
    themeColor: brandingValues.themeColor,
    textColor: brandingValues.textColor,
    header: brandingValues.header,
    subtitle: brandingValues.subtitle,
  };

  const themeColor = branding.themeColor ?? undefined;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Smartphone className="text-muted-foreground size-4" />
        <p className="text-sm font-medium">Preview</p>
      </div>

      <Tabs defaultValue="loyalty" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="login" className="flex-1">
            Login Page
          </TabsTrigger>
          <TabsTrigger value="loyalty" className="flex-1">
            Loyalty Page
          </TabsTrigger>
        </TabsList>

        <TabsContent value="login" className="mt-3">
          <PhoneFrame>
            <LoginPreview businessName={businessName} branding={branding} />
          </PhoneFrame>
        </TabsContent>

        <TabsContent value="loyalty" className="mt-3">
          <PhoneFrame>
            <LoyaltyPagePreview
              businessName={businessName}
              loyaltyType={loyaltyType}
              branding={branding}
              themeColor={themeColor}
            />
          </PhoneFrame>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── Phone frame wrapper ────────────────────────────────────────────────────

function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[340px]">
      <div className="overflow-hidden rounded-[2rem] border-[3px] border-zinc-300 shadow-xl dark:border-zinc-600">
        {/* Notch */}
        <div className="flex items-center justify-center bg-zinc-900 py-1.5">
          <div className="h-3 w-20 rounded-full bg-zinc-800" />
        </div>
        {/* Scrollable content — rendered at 430px then scaled to fit */}
        <div className="relative h-[560px] overflow-hidden bg-white">
          <div
            className="origin-top-left overflow-y-auto"
            style={{
              width: 430,
              height: 560 / 0.79,
              transform: "scale(0.79)",
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Login page preview (uses same structure as real login) ─────────────────

function LoginPreview({
  businessName,
  branding,
}: {
  businessName: string;
  branding: LoyaltyBranding;
}) {
  const themeColor = branding.themeColor;

  return (
    <div className="flex min-h-full flex-col bg-white">
      {/* Header with optional banner (with theme tint) and logo */}
      <div
        className="relative flex flex-col items-center overflow-hidden px-6 pt-12 pb-6"
        style={
          themeColor
            ? {
                backgroundColor: themeColor,
                color: branding.textColor || "#fff",
              }
            : undefined
        }
      >
        {branding.bannerImageUrl && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={branding.bannerImageUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div
              className="absolute inset-0"
              style={{
                backgroundColor: themeColor || "#000000",
                opacity: 0.65,
              }}
            />
          </>
        )}
        <div className="relative z-10 flex flex-col items-center">
          {branding.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={branding.logoUrl}
              alt=""
              className="mb-4 h-16 w-auto object-contain"
            />
          )}
          <h1
            className={`text-center text-lg font-bold ${!themeColor ? "text-foreground" : ""}`}
          >
            Check your loyalty points
          </h1>
          <p
            className={`mt-1 text-center text-sm ${!themeColor ? "text-muted-foreground" : "opacity-80"}`}
          >
            for {businessName}
          </p>
        </div>
      </div>

      <div className="flex flex-1 items-start justify-center px-6 pt-6 pb-8">
        <div className="w-full space-y-4">
          <div className="space-y-2">
            <Label>Phone Number</Label>
            <Input placeholder="9876543210" disabled />
          </div>
          <div className="space-y-2">
            <Label>Name</Label>
            <Input placeholder="Your name" disabled />
          </div>
          <Button
            className="w-full"
            disabled
            style={
              themeColor
                ? {
                    backgroundColor: themeColor,
                    color: branding.textColor || "#fff",
                    opacity: 1,
                  }
                : undefined
            }
          >
            Send OTP
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Loyalty page preview (uses real components with mock data) ─────────────

function LoyaltyPagePreview({
  businessName,
  loyaltyType,
  branding,
  themeColor,
}: {
  businessName: string;
  loyaltyType: LoyaltyResponse["loyaltyType"];
  branding: LoyaltyBranding;
  themeColor: string | undefined;
}) {
  return (
    <div
      className="flex min-h-full flex-col"
      style={{
        backgroundColor: themeColor ? `${themeColor}06` : "#ffffff",
      }}
    >
      <LoyaltyNavbar
        businessName={businessName}
        businessSlug="preview"
        branding={branding}
        previewMode
      />

      <div className="space-y-4 p-4 pb-8">
        <WalletOverview
          pointsBalance={100}
          cashbackBalance={0}
          freeItemCount={2}
          currencySymbol="₹"
          accentColor={themeColor}
          pointsSubtitle={
            loyaltyType === "AMOUNT_SPENT"
              ? "1 pt / ₹1"
              : loyaltyType === "VISIT_MADE"
                ? "1 pt / visit"
                : undefined
          }
        />

        {loyaltyType === "TIER" && (
          <>
            <div
              className={
                themeColor
                  ? "flex items-center gap-2 rounded-xl p-3 text-sm"
                  : "flex items-center gap-2 rounded-xl bg-amber-50 p-3 text-sm dark:bg-amber-900/20"
              }
              style={
                themeColor
                  ? { backgroundColor: `${themeColor}15`, color: themeColor }
                  : undefined
              }
            >
              <Sparkles
                className={
                  themeColor
                    ? "size-4"
                    : "size-4 text-amber-600 dark:text-amber-400"
                }
                style={themeColor ? { color: themeColor } : undefined}
              />
              <span
                className={
                  themeColor ? "" : "text-amber-700 dark:text-amber-300"
                }
              >
                Silver Tier &middot; 5% cashback on every bill
              </span>
            </div>
            <TierProgressionCard
              tierInfo={MOCK_TIER_INFO}
              currencySymbol="₹"
              accentColor={themeColor}
            />
          </>
        )}

        {loyaltyType === "AMOUNT_SPENT" && (
          <RewardOffersGrid
            stages={MOCK_REWARD_STAGES}
            currentPoints={100}
            accentColor={themeColor}
          />
        )}

        {loyaltyType === "VISIT_MADE" && (
          <>
            <VisitCountCard count={12} accentColor={themeColor} />
            <VisitProgressionCard
              stages={MOCK_REWARD_STAGES}
              currentPoints={100}
              nextStage={{
                rewardName: "Flat Rs 100 off",
                pointsRequired: 200,
                pointsNeeded: 100,
              }}
              accentColor={themeColor}
            />
            <RewardOffersGrid
              stages={MOCK_REWARD_STAGES}
              currentPoints={100}
              accentColor={themeColor}
            />
          </>
        )}

        <FreeItemsCard items={MOCK_FREE_ITEMS} accentColor={themeColor} />
        <TransactionHistory
          transactions={MOCK_TRANSACTIONS}
          accentColor={themeColor}
        />
      </div>
    </div>
  );
}
