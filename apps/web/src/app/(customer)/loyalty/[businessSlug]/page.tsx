"use client";

import { PageLayout, ScaffoldContainer } from "@/components/layouts";
import { fetcher } from "@/lib/fetcher";
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@reelo/ui/components";
import { useQuery } from "@tanstack/react-query";
import { useReducedMotion } from "framer-motion";
import {
  ArrowUpRight,
  CheckCircle2,
  Gift,
  Sparkles,
  Star,
  Trophy,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import {
  LoyaltyContentView,
  LoyaltyLoadingView,
  LoyaltyStateView,
} from "./_components";

export interface RewardStage {
  id: string;
  rewardName: string;
  rewardType: string;
  pointsRequired: number;
  canRedeem: boolean;
  freeItemName: string | null;
  percentageValue: number | null;
  cashAmount: number | null;
}

export interface TierInfo {
  currentTier: {
    name: string;
    cashbackPercentage: number;
  } | null;
  allTiers: {
    name: string;
    minLifetimeSpend: number;
    maxLifetimeSpend: number | null;
    cashbackPercentage: number;
  }[];
  lifetimeSpend: number;
  nextTier: {
    name: string;
    minLifetimeSpend: number;
    cashbackPercentage: number;
  } | null;
  spendToNextTier: number | null;
}

interface LoyaltyDetailResponse {
  loyalty: {
    customer: {
      name: string | null;
      email: string | null;
    };
    business: {
      name: string;
      slug: string;
      currencySymbol: string;
      currencyCode: string;
    };
    loyaltyType: string | null;
    pointsBalance: number;
    cashbackBalance: number;
    /** Unclaimed free items (e.g. from referral) to claim on next visit. */
    freeItems: Array<{
      id: string;
      skuId: string | null;
      skuName: string;
      source: string;
      createdAt: string;
    }>;
    transactions: {
      valueKind: string;
      amount: number;
      type: string;
      source: string;
      description: string | null;
      createdAt: string;
      expiresAt: string | null;
      metadata: unknown;
      campaignTitle: string | null;
    }[];
    tierInfo: TierInfo | null;
    amountSpentInfo: {
      pointsPerRupee: number;
      rewardStages: RewardStage[];
      nextStage: {
        rewardName: string;
        pointsRequired: number;
        pointsNeeded: number;
      } | null;
    } | null;
    visitMadeInfo: {
      visitCount: number;
      pointsPerVisit: number;
      rewardStages: RewardStage[];
      nextStage: {
        rewardName: string;
        pointsRequired: number;
        pointsNeeded: number;
      } | null;
    } | null;
  } | null;
  error?: string;
}

// ─── Progress Bar Component ─────────────────────────────────────────────────

function ProgressBar({
  value,
  max,
  className = "",
  barClassName = "",
}: {
  value: number;
  max: number;
  className?: string;
  barClassName?: string;
}) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div
      className={`bg-muted h-2.5 w-full overflow-hidden rounded-full ${className}`}
    >
      <div
        className={`h-full rounded-full transition-all duration-500 ${barClassName || "bg-primary"}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ─── Tier Progress Visualization ────────────────────────────────────────────

function TierProgressSection({ tierInfo }: { tierInfo: TierInfo }) {
  const { currentTier, allTiers, lifetimeSpend, nextTier, spendToNextTier } =
    tierInfo;

  // Overall progress across all tiers
  const lastTier = allTiers[allTiers.length - 1];
  const maxSpend =
    lastTier?.maxLifetimeSpend ??
    (lastTier?.minLifetimeSpend != null
      ? lastTier.minLifetimeSpend * 2
      : 100000);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Trophy className="size-5 text-amber-500" />
            Your Tier
          </CardTitle>
          {currentTier && (
            <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300">
              {currentTier.name}
            </Badge>
          )}
        </div>
        {currentTier && (
          <CardDescription>
            Earning {currentTier.cashbackPercentage}% cashback on every bill
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tier Track */}
        <div className="space-y-3">
          {allTiers.map((tier, index) => {
            const isCurrent = currentTier?.name === tier.name;
            const isAchieved = lifetimeSpend >= tier.minLifetimeSpend;
            const tierMax = tier.maxLifetimeSpend ?? maxSpend;
            const tierProgress = isAchieved
              ? isCurrent
                ? Math.min(
                    100,
                    ((lifetimeSpend - tier.minLifetimeSpend) /
                      (tierMax - tier.minLifetimeSpend)) *
                      100,
                  )
                : 100
              : 0;

            return (
              <div key={`${tier.name}-${index}`} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex size-6 items-center justify-center rounded-full text-[10px] font-bold ${
                        isAchieved
                          ? "bg-amber-500 text-white"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {index + 1}
                    </div>
                    <span
                      className={`font-medium ${
                        isCurrent
                          ? "text-amber-600 dark:text-amber-400"
                          : isAchieved
                            ? "text-foreground"
                            : "text-muted-foreground"
                      }`}
                    >
                      {tier.name}
                    </span>
                    {isCurrent && (
                      <Badge variant="outline" className="text-[10px]">
                        Current
                      </Badge>
                    )}
                  </div>
                  <span className="text-muted-foreground text-xs">
                    {tier.cashbackPercentage}% cashback
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <ProgressBar
                    value={tierProgress}
                    max={100}
                    barClassName={
                      isAchieved ? "bg-amber-500" : "bg-muted-foreground/20"
                    }
                  />
                  <span className="text-muted-foreground shrink-0 text-right text-[10px]">
                    {tier.maxLifetimeSpend != null
                      ? `₹${tier.minLifetimeSpend.toLocaleString()} – ₹${tier.maxLifetimeSpend.toLocaleString()}`
                      : `₹${tier.minLifetimeSpend.toLocaleString()}+`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Next tier info */}
        {nextTier && spendToNextTier != null && spendToNextTier > 0 && (
          <div className="flex items-center gap-3 rounded-lg bg-amber-50 p-3 dark:bg-amber-900/20">
            <ArrowUpRight className="size-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="text-sm">
              <p className="font-medium text-amber-700 dark:text-amber-300">
                ₹{spendToNextTier.toLocaleString()} more to reach{" "}
                {nextTier.name}
              </p>
              <p className="text-muted-foreground text-xs">
                Unlock {nextTier.cashbackPercentage}% cashback
              </p>
            </div>
          </div>
        )}

        {!nextTier && currentTier && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm dark:bg-emerald-900/20">
            <Star className="size-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-emerald-700 dark:text-emerald-300">
              You&apos;re at the highest tier!
            </span>
          </div>
        )}

        <p className="text-muted-foreground text-xs">
          Lifetime spend: ₹{lifetimeSpend.toLocaleString()}
        </p>
      </CardContent>
    </Card>
  );
}

// ─── Transaction Type Badge ─────────────────────────────────────────────────

function TransactionTypeBadge({ type }: { type: string }) {
  const variants: Record<string, { label: string; className: string }> = {
    EARNED: {
      label: "Earned",
      className:
        "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
    },
    REDEEMED: {
      label: "Redeemed",
      className:
        "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    },
    EXPIRED: {
      label: "Expired",
      className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    },
    GIFTED: {
      label: "Gifted",
      className:
        "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    },
    ADJUSTMENT: {
      label: "Adjusted",
      className:
        "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
    },
    REFUNDED: {
      label: "Refunded",
      className:
        "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    },
  };

  const v = variants[type] ?? { label: type, className: "bg-muted" };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${v.className}`}
    >
      {v.label}
    </span>
  );
}

function RewardStagesSection({
  stages,
  pointsBalance,
  nextStage,
  icon,
  title,
  subtitle,
}: {
  stages: RewardStage[];
  pointsBalance: number;
  nextStage: {
    rewardName: string;
    pointsRequired: number;
    pointsNeeded: number;
  } | null;
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  if (stages.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          {icon}
          {title}
        </CardTitle>
        {subtitle && <CardDescription>{subtitle}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {stages.map((stage) => (
            <div key={stage.id} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  {stage.canRedeem ? (
                    <CheckCircle2 className="size-4 text-emerald-500" />
                  ) : (
                    <div className="bg-muted size-4 rounded-full" />
                  )}
                  <span
                    className={
                      stage.canRedeem ? "font-medium" : "text-muted-foreground"
                    }
                  >
                    {stage.rewardName}
                  </span>
                </div>
                <Badge
                  variant={stage.canRedeem ? "default" : "outline"}
                  className="text-xs"
                >
                  {stage.pointsRequired} pts
                </Badge>
              </div>
              <ProgressBar
                value={Math.min(pointsBalance, stage.pointsRequired)}
                max={stage.pointsRequired}
                barClassName={
                  stage.canRedeem ? "bg-emerald-500" : "bg-primary/60"
                }
              />
              {!stage.canRedeem && (
                <p className="text-muted-foreground text-[10px]">
                  {stage.pointsRequired - pointsBalance} more points needed
                </p>
              )}
            </div>
          ))}
        </div>

        {nextStage && (
          <div className="flex items-center gap-3 rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
            <Gift className="size-5 shrink-0 text-blue-600 dark:text-blue-400" />
            <div className="text-sm">
              <p className="font-medium text-blue-700 dark:text-blue-300">
                {nextStage.pointsNeeded} more points for &quot;
                {nextStage.rewardName}
                &quot;
              </p>
              <p className="text-muted-foreground text-xs">
                {nextStage.pointsRequired} points required
              </p>
            </div>
          </div>
        )}

        {!nextStage && stages.some((s) => s.canRedeem) && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm dark:bg-emerald-900/20">
            <Sparkles className="size-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-emerald-700 dark:text-emerald-300">
              You&apos;ve unlocked all rewards! Redeem on your next visit.
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Transaction Label Helper ────────────────────────────────────────────────

const TX_PER_PAGE = 15;

export type TxItem = {
  type: string;
  source: string;
  valueKind: string;
  description: string | null;
  campaignTitle: string | null;
  metadata: unknown;
};

function getFreeItemName(tx: TxItem): string | null {
  const meta = tx.metadata as { freeItemName?: string } | null;
  return meta?.freeItemName ?? null;
}

function getTransactionLabel(tx: TxItem): string {
  if (tx.type === "EXPIRED")
    return tx.valueKind === "CASHBACK" ? "Cashback expired" : "Points expired";
  if (tx.type === "ADJUSTMENT") return "Balance adjustment";
  if (tx.type === "REFUNDED") return "Refund";
  if (tx.type === "GIFTED") return "Gift";

  if (tx.source === "CAMPAIGN") {
    const campName = tx.campaignTitle ?? "";
    if (tx.valueKind === "FREE_ITEM") {
      const itemName = getFreeItemName(tx) ?? "Free item";
      return campName ? `${itemName} (${campName})` : itemName;
    }
    if (tx.type === "EARNED")
      return campName ? `Campaign cashback: ${campName}` : "Campaign cashback";
    if (tx.type === "REDEEMED")
      return campName ? `Campaign discount: ${campName}` : "Campaign discount";
  }

  if (tx.source === "REFERRAL")
    return tx.type === "EARNED" ? "Referral reward" : "Referral";
  if (tx.source === "FEEDBACK") return "Feedback reward";

  if (tx.type === "EARNED") {
    if (tx.valueKind === "CASHBACK") return "Loyalty cashback";
    if (tx.valueKind === "FREE_ITEM") {
      const itemName = getFreeItemName(tx);
      return itemName ? `Free item: ${itemName}` : "Free item earned";
    }
    return "Points earned";
  }
  if (tx.type === "REDEEMED") {
    if (tx.valueKind === "CASHBACK") return "Cashback redeemed";
    if (tx.valueKind === "FREE_ITEM") {
      const itemName = getFreeItemName(tx);
      return itemName ? `Claimed: ${itemName}` : "Free item claimed";
    }
    return "Points redeemed";
  }

  return tx.description || tx.source;
}

export type LoyaltyData = NonNullable<LoyaltyDetailResponse["loyalty"]>;

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function LoyaltyDetailPage() {
  const params = useParams();
  const businessSlug = params?.businessSlug as string | undefined;

  const { data, isLoading, isError, error } = useQuery<
    LoyaltyDetailResponse,
    Error
  >({
    queryKey: ["customer-loyalty-detail", businessSlug],
    queryFn: () =>
      fetcher<LoyaltyDetailResponse>(`/api/customer/loyalty/${businessSlug}`),
    enabled: !!businessSlug,
  });

  const [txPage, setTxPage] = useState(1);
  const [ledgerPage, setLedgerPage] = useState(1);
  const prefersReducedMotion = useReducedMotion();

  const paginatedTxs = useMemo(() => {
    const all = data?.loyalty?.transactions ?? [];
    const total = all.length;
    const totalPages = Math.max(1, Math.ceil(total / TX_PER_PAGE));
    const safePage = Math.min(txPage, totalPages);
    const start = (safePage - 1) * TX_PER_PAGE;
    return {
      items: all.slice(start, start + TX_PER_PAGE),
      total,
      totalPages,
      page: safePage,
    };
  }, [data?.loyalty?.transactions, txPage]);

  if (!businessSlug) {
    return (
      <LoyaltyStateView
        subtitle="Invalid link"
        message="Missing business. Please use the link shared with you."
        destructive
      />
    );
  }

  if (isLoading) {
    return <LoyaltyLoadingView />;
  }

  if (isError) {
    return (
      <PageLayout
        title="Loyalty"
        subtitle="Something went wrong"
        size="default"
        scaffoldSectionClassName="h-full w-full pt-2 pb-0"
      >
        <ScaffoldContainer>
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-destructive text-sm font-medium">
              Failed to load loyalty details
            </p>
            <p className="text-muted-foreground mt-1 text-sm">
              {error?.message ?? "Please try again later."}
            </p>
          </div>
        </ScaffoldContainer>
      </PageLayout>
    );
  }

  if (!data?.loyalty) {
    return (
      <LoyaltyStateView
        subtitle="Not found"
        message="Loyalty data not found."
      />
    );
  }

  const { loyalty } = data;
  const {
    loyaltyType,
    pointsBalance,
    cashbackBalance,
    tierInfo,
    amountSpentInfo,
    visitMadeInfo,
  } = loyalty;

  const LEDGER_PAGE_SIZE = 5;
  const ledgerTotalPages = Math.max(
    1,
    Math.ceil(loyalty.transactions.length / LEDGER_PAGE_SIZE),
  );
  const safeLedgerPage = Math.min(ledgerPage, ledgerTotalPages);
  const ledgerStart = (safeLedgerPage - 1) * LEDGER_PAGE_SIZE;
  const ledgerItems = loyalty.transactions.slice(
    ledgerStart,
    ledgerStart + LEDGER_PAGE_SIZE,
  );
  const customerDisplayName =
    loyalty.customer.name?.trim() ||
    loyalty.customer.email?.split("@")[0] ||
    "Member";
  const currentTierName = tierInfo?.currentTier?.name ?? "Silver";
  const currentCashbackPct = tierInfo?.currentTier?.cashbackPercentage ?? 0;
  const topTier = tierInfo?.allTiers[tierInfo.allTiers.length - 1];
  const totalTierRange =
    topTier?.minLifetimeSpend && topTier.minLifetimeSpend > 0
      ? topTier.minLifetimeSpend
      : 50000;
  const tierProgressPct = Math.min(
    100,
    ((tierInfo?.lifetimeSpend ?? 0) / totalTierRange) * 100,
  );
  return (
    <LoyaltyContentView
      loyalty={loyalty}
      loyaltyType={loyaltyType}
      pointsBalance={pointsBalance}
      cashbackBalance={cashbackBalance}
      tierInfo={tierInfo}
      amountSpentInfo={amountSpentInfo}
      visitMadeInfo={visitMadeInfo}
      customerDisplayName={customerDisplayName}
      currentTierName={currentTierName}
      currentCashbackPct={currentCashbackPct}
      totalTierRange={totalTierRange}
      tierProgressPct={tierProgressPct}
      ledgerItems={ledgerItems}
      safeLedgerPage={safeLedgerPage}
      ledgerTotalPages={ledgerTotalPages}
      setLedgerPage={setLedgerPage}
      paginatedTxs={paginatedTxs}
      setTxPage={setTxPage}
      prefersReducedMotion={Boolean(prefersReducedMotion)}
      getTransactionLabel={getTransactionLabel}
      getFreeItemName={getFreeItemName}
      TransactionTypeBadge={TransactionTypeBadge}
      TierProgressSection={TierProgressSection}
      RewardStagesSection={RewardStagesSection}
    />
  );
}
