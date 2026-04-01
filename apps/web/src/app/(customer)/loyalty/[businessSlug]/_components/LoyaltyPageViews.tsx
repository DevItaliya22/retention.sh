"use client";

import { CustomerLogoutButton } from "@/components/customer-portal/CustomerLogoutButton";
import { PageLayout, ScaffoldContainer } from "@/components/layouts";
import {
  Button,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@reelo/ui/components";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Coins,
  Footprints,
  Gift,
  History,
  Receipt,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";
import { Dispatch, SetStateAction } from "react";
import type { LoyaltyData, RewardStage, TierInfo, TxItem } from "../page";

type RewardStagesSectionProps = {
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
};

type LoyaltyContentViewProps = {
  loyalty: LoyaltyData;
  loyaltyType: string | null;
  pointsBalance: number;
  cashbackBalance: number;
  tierInfo: TierInfo | null;
  amountSpentInfo: LoyaltyData["amountSpentInfo"];
  visitMadeInfo: LoyaltyData["visitMadeInfo"];
  customerDisplayName: string;
  currentTierName: string;
  currentCashbackPct: number;
  totalTierRange: number;
  tierProgressPct: number;
  ledgerItems: LoyaltyData["transactions"];
  safeLedgerPage: number;
  ledgerTotalPages: number;
  setLedgerPage: Dispatch<SetStateAction<number>>;
  paginatedTxs: {
    items: LoyaltyData["transactions"];
    total: number;
    totalPages: number;
    page: number;
  };
  setTxPage: Dispatch<SetStateAction<number>>;
  prefersReducedMotion: boolean;
  getTransactionLabel: (tx: TxItem) => string;
  getFreeItemName: (tx: TxItem) => string | null;
  TransactionTypeBadge: ({ type }: { type: string }) => React.ReactNode;
  TierProgressSection: ({
    tierInfo,
  }: {
    tierInfo: TierInfo;
  }) => React.ReactNode;
  RewardStagesSection: (props: RewardStagesSectionProps) => React.ReactNode;
};

export function LoyaltyContentView({
  loyalty,
  loyaltyType,
  pointsBalance,
  cashbackBalance,
  tierInfo,
  amountSpentInfo,
  visitMadeInfo,
  customerDisplayName,
  currentTierName,
  currentCashbackPct,
  totalTierRange,
  tierProgressPct,
  ledgerItems,
  safeLedgerPage,
  ledgerTotalPages,
  setLedgerPage,
  paginatedTxs,
  setTxPage,
  prefersReducedMotion,
  getTransactionLabel,
  getFreeItemName,
  TransactionTypeBadge,
  TierProgressSection,
  RewardStagesSection,
}: LoyaltyContentViewProps) {
  const isCashbackType = loyaltyType === "CASHBACK" || loyaltyType === "TIER";
  const isTierEditorial = loyaltyType === "TIER" && tierInfo;
  const isAmountSpentEditorial =
    loyaltyType === "AMOUNT_SPENT" && amountSpentInfo;

  if (isTierEditorial && tierInfo) {
    return (
      <PageLayout
        title={
          loyalty.business.name
            ? loyalty.business.name.charAt(0).toUpperCase() +
              loyalty.business.name.slice(1)
            : ""
        }
        subtitle={null}
        size="full"
        scaffoldSectionClassName="h-full w-full pt-2 pb-0"
        primaryActions={
          <CustomerLogoutButton businessSlug={loyalty.business.slug} />
        }
      >
        <ScaffoldContainer className="bg-background px-4 py-4 sm:px-6">
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
            animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="text-foreground mx-auto max-w-5xl space-y-10 pb-8"
          >
            <section className="grid grid-cols-1 gap-6 border-b border-black/10 pb-8 lg:grid-cols-[1.4fr_1fr] lg:items-end">
              <div className="space-y-3">
                <p className="text-muted-foreground text-[11px] tracking-[0.22em] uppercase">
                  PRIVATE CLIENT
                </p>
                <h1 className="font-serif text-4xl leading-tight font-light italic sm:text-5xl">
                  <span className="font-normal not-italic">
                    {customerDisplayName}
                  </span>
                </h1>
                <p className="text-muted-foreground text-sm">
                  Current tier:{" "}
                  <span className="text-amber-600">{currentTierName}</span> (
                  {currentCashbackPct}% cashback)
                </p>
              </div>

              <div className="bg-card rounded-2xl border p-6 shadow-sm">
                <p className="text-muted-foreground text-[11px] tracking-[0.22em] uppercase">
                  CASHBACK BALANCE
                </p>
                <p className="mt-3 text-4xl font-light tabular-nums sm:text-5xl">
                  ₹
                  {cashbackBalance.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
                <p className="text-muted-foreground mt-2 text-sm">
                  Earning {currentCashbackPct}% on every transaction.
                </p>
              </div>
            </section>

            <section className="grid grid-cols-1 gap-16 lg:grid-cols-12 lg:gap-24">
              <div className="space-y-8 lg:col-span-8">
                <article className="bg-card rounded-md border p-6">
                  <div className="space-y-8">
                    <div className="flex items-center justify-between">
                      <p className="text-muted-foreground text-[11px] tracking-[0.22em] uppercase">
                        TIER PROGRESSION
                      </p>
                      <p className="text-muted-foreground text-xs italic">
                        {tierInfo.nextTier
                          ? `Next: ${tierInfo.nextTier.name} (${tierInfo.nextTier.cashbackPercentage}% Cashback)`
                          : "Highest tier unlocked"}
                      </p>
                    </div>

                    <div className="relative pt-8 pb-4">
                      <div className="absolute inset-x-0 top-0 flex justify-between px-1">
                        {(tierInfo.allTiers.length > 0
                          ? tierInfo.allTiers.slice(0, 3)
                          : [
                              {
                                id: "s",
                                name: "Silver",
                                cashbackPercentage: 5,
                              },
                              { id: "g", name: "Gold", cashbackPercentage: 7 },
                              {
                                id: "p",
                                name: "Platinum",
                                cashbackPercentage: 10,
                              },
                            ]
                        ).map((tier, index) => {
                          const active = tier.name === currentTierName;
                          return (
                            <div
                              key={`${tier.name}-${index}`}
                              className={`space-y-2 ${index === 0 ? "" : index === 1 ? "text-center" : "text-right"}`}
                            >
                              <p
                                className={`text-xs tracking-[0.16em] uppercase ${
                                  active
                                    ? "text-amber-600"
                                    : "text-muted-foreground opacity-60"
                                }`}
                              >
                                {tier.name}
                              </p>
                              <p
                                className={`text-sm font-medium ${
                                  active ? "text-amber-600" : "text-foreground"
                                }`}
                              >
                                {tier.cashbackPercentage}%
                              </p>
                            </div>
                          );
                        })}
                      </div>

                      <div className="bg-border relative mt-12 h-px w-full">
                        <motion.div
                          initial={prefersReducedMotion ? false : { width: 0 }}
                          animate={{ width: `${tierProgressPct}%` }}
                          transition={{ duration: 1.2, ease: "circOut" }}
                          className="absolute inset-y-0 left-0 bg-gradient-to-r from-transparent via-amber-500/30 to-amber-500"
                        >
                          <div className="absolute top-1/2 right-0 size-2 -translate-y-1/2 rounded-full bg-amber-500 shadow-[0_0_15px] shadow-amber-500/40" />
                        </motion.div>
                      </div>

                      <div className="mt-6 flex justify-between">
                        <p className="text-muted-foreground text-xs">₹0</p>
                        {tierInfo.nextTier &&
                        tierInfo.spendToNextTier != null ? (
                          <div className="space-y-1 text-center">
                            <p className="text-base font-normal">
                              ₹
                              {tierInfo.spendToNextTier.toLocaleString("en-IN")}{" "}
                              more to reach {tierInfo.nextTier.name}
                            </p>
                            <p className="text-muted-foreground text-sm">
                              Unlock {tierInfo.nextTier.cashbackPercentage}%
                              cashback
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-1 text-center">
                            <p className="text-base font-normal">
                              You&apos;ve reached the highest tier
                            </p>
                            <p className="text-muted-foreground text-sm">
                              Enjoy your best cashback rate
                            </p>
                          </div>
                        )}
                        <p className="text-muted-foreground text-xs">
                          ₹{totalTierRange.toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>
                  </div>
                </article>
              </div>

              <aside className="space-y-6 lg:col-span-4">
                <article className="bg-card space-y-4 rounded-md border p-6">
                  <div className="flex items-center justify-between">
                    <p className="text-muted-foreground text-[11px] tracking-[0.22em] uppercase">
                      LEDGER
                    </p>
                    <History className="text-muted-foreground size-4" />
                  </div>
                  <div className="space-y-3">
                    {ledgerItems.length === 0 ? (
                      <p className="text-muted-foreground text-sm">
                        Transactions will appear after your first bill.
                      </p>
                    ) : (
                      ledgerItems.map((tx, index) => (
                        <div
                          key={`${tx.createdAt}-${tx.type}-${tx.amount}-${index}`}
                          className="flex items-start justify-between gap-3 border-b border-black/10 pb-2 last:border-b-0"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-muted-foreground text-[11px] tracking-[0.16em] uppercase">
                              <DateDisplay date={tx.createdAt} />
                            </p>
                            <p className="mt-1 truncate text-sm">
                              {getTransactionLabel(tx)}
                            </p>
                          </div>
                          <p
                            className={`shrink-0 text-sm whitespace-nowrap tabular-nums ${
                              tx.amount >= 0
                                ? "text-foreground"
                                : "text-muted-foreground"
                            }`}
                          >
                            {tx.valueKind === "CASHBACK"
                              ? `${tx.amount >= 0 ? "+" : "−"}₹${Math.abs(tx.amount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                              : `${tx.amount >= 0 ? "+" : "−"}${Math.abs(tx.amount).toLocaleString()} pts`}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                  {loyalty.transactions.length > 0 && (
                    <div className="flex items-center justify-between border-t border-black/10 pt-3">
                      <p className="text-muted-foreground text-xs">
                        Page {safeLedgerPage} of {ledgerTotalPages} (
                        {loyalty.transactions.length} transactions)
                      </p>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="size-7"
                          disabled={safeLedgerPage <= 1}
                          onClick={() =>
                            setLedgerPage((prev) => Math.max(1, prev - 1))
                          }
                        >
                          <ChevronLeft className="size-3.5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="size-7"
                          disabled={safeLedgerPage >= ledgerTotalPages}
                          onClick={() =>
                            setLedgerPage((prev) =>
                              Math.min(ledgerTotalPages, prev + 1),
                            )
                          }
                        >
                          <ChevronRight className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}
                </article>

                <article className="bg-card space-y-3 rounded-md border p-6">
                  <div className="flex items-center justify-between">
                    <p className="text-muted-foreground text-[11px] tracking-[0.22em] uppercase">
                      LIFETIME VALUE
                    </p>
                    <ShieldCheck className="text-muted-foreground size-4" />
                  </div>
                  <p className="text-3xl font-light tabular-nums">
                    ₹{tierInfo.lifetimeSpend.toLocaleString("en-IN")}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    Total portfolio spend across your relationship.
                  </p>
                </article>
              </aside>
            </section>
          </motion.div>
        </ScaffoldContainer>
      </PageLayout>
    );
  }

  if (isAmountSpentEditorial && amountSpentInfo) {
    return (
      <PageLayout
        title={
          loyalty.business.name
            ? loyalty.business.name.charAt(0).toUpperCase() +
              loyalty.business.name.slice(1)
            : ""
        }
        subtitle={null}
        size="full"
        scaffoldSectionClassName="h-full w-full pt-2 pb-0"
        primaryActions={
          <CustomerLogoutButton businessSlug={loyalty.business.slug} />
        }
      >
        <ScaffoldContainer className="bg-background px-4 py-4 sm:px-6">
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
            animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="text-foreground mx-auto max-w-5xl space-y-10 pb-8"
          >
            <section className="grid grid-cols-1 gap-6 border-b border-black/10 pb-8 lg:grid-cols-[1.4fr_1fr] lg:items-end">
              <div className="space-y-3">
                <p className="text-muted-foreground text-[11px] tracking-[0.22em] uppercase">
                  PRIVATE CLIENT
                </p>
                <h1 className="font-serif text-4xl leading-tight font-light italic sm:text-5xl">
                  <span className="font-normal not-italic">
                    {customerDisplayName}
                  </span>
                </h1>
              </div>

              <div className="bg-card rounded-2xl border p-6 shadow-sm">
                <p className="text-muted-foreground text-[11px] tracking-[0.22em] uppercase">
                  POINTS BALANCE
                </p>
                <p className="mt-3 text-4xl font-light tabular-nums sm:text-5xl">
                  {pointsBalance.toLocaleString("en-IN")}
                  <span className="text-muted-foreground ml-2 text-lg">
                    pts
                  </span>
                </p>
                <p className="text-muted-foreground mt-2 text-sm">
                  Earning {amountSpentInfo.pointsPerRupee} point
                  {amountSpentInfo.pointsPerRupee !== 1 ? "s" : ""} per ₹1
                  spent.
                </p>
              </div>
            </section>

            <section className="grid grid-cols-1 gap-16 lg:grid-cols-12 lg:gap-24">
              <div className="space-y-8 lg:col-span-8">
                <RewardStagesSection
                  stages={amountSpentInfo.rewardStages}
                  pointsBalance={pointsBalance}
                  nextStage={amountSpentInfo.nextStage}
                  icon={<Coins className="size-5 text-blue-500" />}
                  title="Reward Milestones"
                  subtitle={`Earn ${amountSpentInfo.pointsPerRupee} point${amountSpentInfo.pointsPerRupee !== 1 ? "s" : ""} per ₹1 spent`}
                />
              </div>

              <aside className="space-y-6 lg:col-span-4">
                <article className="bg-card space-y-4 rounded-md border p-6">
                  <div className="flex items-center justify-between">
                    <p className="text-muted-foreground text-[11px] tracking-[0.22em] uppercase">
                      LEDGER
                    </p>
                    <History className="text-muted-foreground size-4" />
                  </div>
                  <div className="space-y-3">
                    {ledgerItems.length === 0 ? (
                      <p className="text-muted-foreground text-sm">
                        Transactions will appear after your first bill.
                      </p>
                    ) : (
                      ledgerItems.map((tx, index) => (
                        <div
                          key={`${tx.createdAt}-${tx.type}-${tx.amount}-${index}`}
                          className="flex items-start justify-between gap-3 border-b border-black/10 pb-2 last:border-b-0"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-muted-foreground text-[11px] tracking-[0.16em] uppercase">
                              <DateDisplay date={tx.createdAt} />
                            </p>
                            <p className="mt-1 truncate text-sm">
                              {getTransactionLabel(tx)}
                            </p>
                          </div>
                          <p
                            className={`shrink-0 text-sm whitespace-nowrap tabular-nums ${
                              tx.amount >= 0
                                ? "text-foreground"
                                : "text-muted-foreground"
                            }`}
                          >
                            {tx.valueKind === "CASHBACK"
                              ? `${tx.amount >= 0 ? "+" : "−"}₹${Math.abs(tx.amount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                              : `${tx.amount >= 0 ? "+" : "−"}${Math.abs(tx.amount).toLocaleString()} pts`}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                  {loyalty.transactions.length > 0 && (
                    <div className="flex items-center justify-between border-t border-black/10 pt-3">
                      <p className="text-muted-foreground text-xs">
                        Page {safeLedgerPage} of {ledgerTotalPages} (
                        {loyalty.transactions.length} transactions)
                      </p>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="size-7"
                          disabled={safeLedgerPage <= 1}
                          onClick={() =>
                            setLedgerPage((prev) => Math.max(1, prev - 1))
                          }
                        >
                          <ChevronLeft className="size-3.5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="size-7"
                          disabled={safeLedgerPage >= ledgerTotalPages}
                          onClick={() =>
                            setLedgerPage((prev) =>
                              Math.min(ledgerTotalPages, prev + 1),
                            )
                          }
                        >
                          <ChevronRight className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}
                </article>

                <article className="bg-card space-y-3 rounded-md border p-6">
                  <div className="flex items-center justify-between">
                    <p className="text-muted-foreground text-[11px] tracking-[0.22em] uppercase">
                      EARNING RATE
                    </p>
                    <ShieldCheck className="text-muted-foreground size-4" />
                  </div>
                  <p className="text-3xl font-light tabular-nums">
                    {amountSpentInfo.pointsPerRupee}
                    <span className="text-muted-foreground ml-2 text-base">
                      pt / ₹1
                    </span>
                  </p>
                  <p className="text-muted-foreground text-sm">
                    Points accrue from every purchase toward milestone unlocks.
                  </p>
                </article>
              </aside>
            </section>
          </motion.div>
        </ScaffoldContainer>
      </PageLayout>
    );
  }

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
          <Card>
            <CardContent className="pt-6">
              {isCashbackType ? (
                <div className="flex items-center gap-4">
                  <div className="bg-primary/10 flex size-14 items-center justify-center rounded-full">
                    <Wallet className="text-primary size-7" />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">
                      Cashback Balance
                    </p>
                    <p className="text-3xl font-bold">
                      ₹
                      {cashbackBalance.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-start gap-6">
                  <div className="flex items-center gap-4">
                    <div className="bg-primary/10 flex size-14 items-center justify-center rounded-full">
                      <Coins className="text-primary size-7" />
                    </div>
                    <div>
                      <p className="text-muted-foreground text-sm">
                        Points Balance
                      </p>
                      <p className="text-3xl font-bold">
                        {pointsBalance.toLocaleString()}{" "}
                        <span className="text-muted-foreground text-base font-normal">
                          pts
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 border-l pl-6">
                    <div className="flex size-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                      <Wallet className="size-7 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-muted-foreground text-sm">
                        Cashback Balance
                      </p>
                      <p className="text-2xl font-bold tabular-nums">
                        ₹
                        {cashbackBalance.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                  </div>
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

          {loyaltyType === "TIER" && tierInfo && (
            <TierProgressSection tierInfo={tierInfo} />
          )}

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

          {loyaltyType === "VISIT_MADE" && visitMadeInfo && (
            <>
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

          {(loyalty.freeItems?.length ?? 0) > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Gift className="size-5 text-purple-500" />
                  Free items to claim
                </CardTitle>
                <CardDescription>
                  Claim these at the store on your next visit.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {loyalty.freeItems.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between rounded-md bg-purple-50 px-3 py-2 text-sm dark:bg-purple-900/20"
                    >
                      <span className="font-medium">{item.skuName}</span>
                      {item.source !== "OTHER" && (
                        <span className="text-muted-foreground text-xs">
                          {item.source === "REFERRAL"
                            ? "Referral"
                            : item.source}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Receipt className="size-5" />
                Transaction History
              </CardTitle>
              <CardDescription>
                All earned, redeemed, and expired transactions - loyalty,
                campaigns, referrals, and more.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {paginatedTxs.total > 0 ? (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead className="text-right">Expires</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedTxs.items.map((tx, index) => {
                          const isCb = tx.valueKind === "CASHBACK";
                          const isFreeItem = tx.valueKind === "FREE_ITEM";
                          const freeItem = isFreeItem
                            ? getFreeItemName(tx)
                            : null;
                          const amountStr = isCb
                            ? `₹${Math.abs(tx.amount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            : isFreeItem
                              ? freeItem || "Free item"
                              : `${Math.abs(tx.amount)} pts`;
                          return (
                            <TableRow
                              key={`${tx.createdAt}-${tx.type}-${tx.amount}-${index}`}
                            >
                              <TableCell className="text-sm whitespace-nowrap">
                                <DateDisplay date={tx.createdAt} />
                              </TableCell>
                              <TableCell className="max-w-[220px] text-sm">
                                <span className="font-medium">
                                  {getTransactionLabel(tx)}
                                </span>
                              </TableCell>
                              <TableCell>
                                <TransactionTypeBadge type={tx.type} />
                              </TableCell>
                              <TableCell className="text-right">
                                {isFreeItem ? (
                                  <span className="font-medium text-purple-600 dark:text-purple-400">
                                    {tx.type === "REDEEMED"
                                      ? "Claimed"
                                      : "1 item"}
                                  </span>
                                ) : (
                                  <span
                                    className={`font-medium ${
                                      tx.amount > 0
                                        ? "text-emerald-600 dark:text-emerald-400"
                                        : "text-red-600 dark:text-red-400"
                                    }`}
                                  >
                                    {tx.amount > 0 ? "+" : "−"}
                                    {amountStr}
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="text-muted-foreground text-right text-xs whitespace-nowrap">
                                {tx.type === "EXPIRED" ? (
                                  <span className="text-red-600 dark:text-red-400">
                                    Expired
                                  </span>
                                ) : tx.expiresAt ? (
                                  <DateDisplay date={tx.expiresAt} />
                                ) : (
                                  "—"
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  {paginatedTxs.totalPages > 1 && (
                    <div className="flex items-center justify-between pt-2">
                      <p className="text-muted-foreground text-xs">
                        Page {paginatedTxs.page} of {paginatedTxs.totalPages} (
                        {paginatedTxs.total} transactions)
                      </p>
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="size-8"
                          disabled={paginatedTxs.page <= 1}
                          onClick={() => setTxPage((p) => Math.max(1, p - 1))}
                        >
                          <ChevronLeft className="size-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="size-8"
                          disabled={
                            paginatedTxs.page >= paginatedTxs.totalPages
                          }
                          onClick={() => setTxPage((p) => p + 1)}
                        >
                          <ChevronRight className="size-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
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
