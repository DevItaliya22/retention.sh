"use client";

import { CustomerLogoutButton } from "@/components/customer-portal/CustomerLogoutButton";
import { PageLayout, ScaffoldContainer } from "@/components/layouts";
import { fetcher } from "@/lib/fetcher";
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DateDisplay,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@reelo/ui/components";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Coins,
  Footprints,
  Gift,
  Receipt,
  Sparkles,
  Star,
  Trophy,
  Wallet,
} from "lucide-react";
import { useParams } from "next/navigation";

// ─── Types ──────────────────────────────────────────────────────────────────

interface RewardStage {
  id: string;
  rewardName: string;
  rewardType: string;
  pointsRequired: number;
  canRedeem: boolean;
  freeItemName: string | null;
  percentageValue: number | null;
  cashAmount: number | null;
}

interface TierInfo {
  currentTier: {
    name: string;
    rank: number;
    cashbackPercentage: number;
  } | null;
  allTiers: {
    id: string;
    name: string;
    rank: number;
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
    business: {
      id: string;
      name: string;
      slug: string;
      currencySymbol: string;
      currencyCode: string;
    };
    loyaltyType: string | null;
    pointsBalance: number;
    cashbackBalance: number;
    buckets: { id: string; remainingAmount: number; expiresAt: string }[];
    transactions: {
      id: string;
      amount: number;
      type: string;
      source: string;
      description: string | null;
      createdAt: string;
      expiresAt: string | null;
      metadata: unknown;
    }[];
    /** CASHBACK / TIER: history from CashbackTransaction + Bill (date, amount spent, cashback, tier). */
    cashbackHistory: Array<{
      id: string;
      date: string;
      billNumber: string;
      amountSpent: number;
      cashbackReceived: number;
      tierName: string | null;
      cashbackPercentage: number | null;
    }>;
    tierInfo: TierInfo | null;
    cashbackInfo: { cashbackPercentage: number } | null;
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
            const isCurrent = currentTier?.rank === tier.rank;
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
              <div key={tier.id} className="space-y-1.5">
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

// ─── Reward Stages Progress ─────────────────────────────────────────────────

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
        {/* Stages visualization */}
        <div className="space-y-3">
          {stages.map((stage) => {
            const progressPct = Math.min(
              100,
              (pointsBalance / stage.pointsRequired) * 100,
            );

            return (
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
                        stage.canRedeem
                          ? "font-medium"
                          : "text-muted-foreground"
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
            );
          })}
        </div>

        {/* Next stage callout */}
        {nextStage && (
          <div className="flex items-center gap-3 rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
            <Gift className="size-5 shrink-0 text-blue-600 dark:text-blue-400" />
            <div className="text-sm">
              <p className="font-medium text-blue-700 dark:text-blue-300">
                {nextStage.pointsNeeded} more points for &quot;
                {nextStage.rewardName}&quot;
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

  if (!businessSlug) {
    return (
      <PageLayout
        title="Loyalty"
        subtitle="Invalid link"
        size="default"
        scaffoldSectionClassName="h-full w-full pt-2 pb-0"
      >
        <ScaffoldContainer>
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-destructive text-sm font-medium">
              Missing business. Please use the link shared with you.
            </p>
          </div>
        </ScaffoldContainer>
      </PageLayout>
    );
  }

  if (isLoading) {
    return (
      <PageLayout
        title="Loyalty"
        subtitle="Loading..."
        size="default"
        scaffoldSectionClassName="h-full w-full pt-2 pb-0"
      >
        <ScaffoldContainer>
          <div className="space-y-4">
            <Skeleton className="h-28 w-full rounded-lg" />
            <Skeleton className="h-48 w-full rounded-lg" />
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
        </ScaffoldContainer>
      </PageLayout>
    );
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
      <PageLayout
        title="Loyalty"
        subtitle="Not found"
        size="default"
        scaffoldSectionClassName="h-full w-full pt-2 pb-0"
      >
        <ScaffoldContainer>
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground text-sm">
              Loyalty data not found.
            </p>
          </div>
        </ScaffoldContainer>
      </PageLayout>
    );
  }

  const { loyalty } = data;
  const {
    loyaltyType,
    pointsBalance,
    cashbackBalance,
    tierInfo,
    cashbackInfo,
    amountSpentInfo,
    visitMadeInfo,
  } = loyalty;

  const isCashbackType = loyaltyType === "CASHBACK" || loyaltyType === "TIER";

  return (
    <PageLayout
      title={loyalty.business.name}
      subtitle="Your loyalty rewards"
      size="default"
      scaffoldSectionClassName="h-full w-full pt-2 pb-0"
      primaryActions={
        <CustomerLogoutButton businessSlug={loyalty.business.slug} />
      }
    >
      <ScaffoldContainer>
        <div className="space-y-5 pb-8">
          {/* ─── Balance Header ────────────────────────────────────────── */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="bg-primary/10 flex size-14 items-center justify-center rounded-full">
                  {isCashbackType ? (
                    <Wallet className="text-primary size-7" />
                  ) : (
                    <Coins className="text-primary size-7" />
                  )}
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">
                    {isCashbackType ? "Cashback Balance" : "Points Balance"}
                  </p>
                  <p className="text-3xl font-bold">
                    {isCashbackType ? (
                      <>
                        ₹
                        {cashbackBalance.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </>
                    ) : (
                      <>
                        {pointsBalance.toLocaleString()}{" "}
                        <span className="text-muted-foreground text-base font-normal">
                          pts
                        </span>
                      </>
                    )}
                  </p>
                </div>
              </div>

              {/* CASHBACK / TIER type badge */}
              {loyaltyType === "CASHBACK" && cashbackInfo && (
                <div className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-50 p-2.5 text-sm dark:bg-emerald-900/20">
                  <Sparkles className="size-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-emerald-700 dark:text-emerald-300">
                    You earn {cashbackInfo.cashbackPercentage}% cashback on
                    every purchase
                  </span>
                </div>
              )}
              {loyaltyType === "TIER" && tierInfo?.currentTier && (
                <div className="mt-4 flex items-center gap-2 rounded-lg bg-amber-50 p-2.5 text-sm dark:bg-amber-900/20">
                  <Sparkles className="size-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-amber-700 dark:text-amber-300">
                    Earning {tierInfo.currentTier.cashbackPercentage}% cashback
                    on every bill
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ─── Tier Progress (TIER type) ─────────────────────────────── */}
          {loyaltyType === "TIER" && tierInfo && (
            <TierProgressSection tierInfo={tierInfo} />
          )}

          {/* ─── Reward Stages (AMOUNT_SPENT type) ─────────────────────── */}
          {loyaltyType === "AMOUNT_SPENT" && amountSpentInfo && (
            <RewardStagesSection
              stages={amountSpentInfo.rewardStages}
              pointsBalance={pointsBalance}
              nextStage={amountSpentInfo.nextStage}
              icon={<Coins className="size-5 text-blue-500" />}
              title="Reward Milestones"
              subtitle={`Earn ${amountSpentInfo.pointsPerRupee} point${amountSpentInfo.pointsPerRupee !== 1 ? "s" : ""} per ₹1 spent`}
            />
          )}

          {/* ─── Visit Progress (VISIT_MADE type) ──────────────────────── */}
          {loyaltyType === "VISIT_MADE" && visitMadeInfo && (
            <>
              {/* Visit counter */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="flex size-14 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30">
                      <Footprints className="size-7 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-muted-foreground text-sm">
                        Total Visits
                      </p>
                      <p className="text-3xl font-bold">
                        {visitMadeInfo.visitCount}
                      </p>
                    </div>
                  </div>
                  <p className="text-muted-foreground mt-2 text-xs">
                    Earn {visitMadeInfo.pointsPerVisit} point
                    {visitMadeInfo.pointsPerVisit !== 1 ? "s" : ""} per visit
                  </p>
                </CardContent>
              </Card>

              <RewardStagesSection
                stages={visitMadeInfo.rewardStages}
                pointsBalance={pointsBalance}
                nextStage={visitMadeInfo.nextStage}
                icon={<Footprints className="size-5 text-indigo-500" />}
                title="Visit Rewards"
                subtitle="Earn rewards as you visit more"
              />
            </>
          )}

          {/* ─── Expiring Points ───────────────────────────────────────── */}
          {loyalty.buckets.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock className="size-5 text-amber-500" />
                  Expiring Soon
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {loyalty.buckets.map((bucket) => (
                    <div
                      key={bucket.id}
                      className="flex items-center justify-between rounded-md bg-amber-50 px-3 py-2 text-sm dark:bg-amber-900/20"
                    >
                      <span>
                        {isCashbackType ? "₹" : ""}
                        {bucket.remainingAmount} {isCashbackType ? "" : "pts"}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        Expires <DateDisplay date={bucket.expiresAt} />
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ─── Transaction History (cashback history for CASHBACK/TIER, points for AMOUNT_SPENT/VISIT_MADE) ──────────────────────────────────────────── */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Receipt className="size-5" />
                Transaction History
              </CardTitle>
              {isCashbackType && (
                <CardDescription>
                  All your bills; cashback shown when earned on that bill.
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {isCashbackType && (loyalty.cashbackHistory?.length ?? 0) > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Bill #</TableHead>
                        <TableHead className="text-right">
                          Amount spent
                        </TableHead>
                        <TableHead className="text-right">
                          Cashback received
                        </TableHead>
                        {loyaltyType === "TIER" && <TableHead>Tier</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loyalty.cashbackHistory.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell className="text-sm whitespace-nowrap">
                            <DateDisplay date={row.date} />
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {row.billNumber}
                          </TableCell>
                          <TableCell className="text-right font-medium tabular-nums">
                            ₹
                            {row.amountSpent.toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </TableCell>
                          <TableCell className="text-right font-medium tabular-nums">
                            {row.cashbackReceived > 0 ? (
                              <span className="text-emerald-600 dark:text-emerald-400">
                                +₹
                                {row.cashbackReceived.toLocaleString("en-IN", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          {loyaltyType === "TIER" && (
                            <TableCell>
                              {row.tierName ? (
                                <span className="text-amber-700 dark:text-amber-300">
                                  {row.tierName}
                                  {row.cashbackPercentage != null && (
                                    <span className="text-muted-foreground ml-1 text-xs">
                                      ({row.cashbackPercentage}%)
                                    </span>
                                  )}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : !isCashbackType && loyalty.transactions.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Description</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loyalty.transactions.map((tx) => (
                        <TableRow key={tx.id}>
                          <TableCell className="text-sm whitespace-nowrap">
                            <DateDisplay date={tx.createdAt} />
                          </TableCell>
                          <TableCell>
                            <TransactionTypeBadge type={tx.type} />
                          </TableCell>
                          <TableCell className="text-right">
                            <span
                              className={`font-medium ${
                                tx.amount > 0
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-red-600 dark:text-red-400"
                              }`}
                            >
                              {tx.amount > 0 ? "+" : ""}
                              {`${tx.amount} pts`}
                            </span>
                          </TableCell>
                          <TableCell className="text-muted-foreground max-w-[200px] truncate text-sm">
                            {tx.description || tx.source}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <Empty className="py-8">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <Receipt className="size-6" />
                    </EmptyMedia>
                    <EmptyTitle>No transactions yet</EmptyTitle>
                    <EmptyDescription>
                      Your history will appear here after your first
                      transaction.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </CardContent>
          </Card>
        </div>
      </ScaffoldContainer>
    </PageLayout>
  );
}
