"use client";

import { PeriodSelector } from "@/components/dashboard/shared/PeriodSelector";
import { DashboardPageShell } from "@/components/layouts";
import { GamesFunnelChart } from "@/components/settings/games/GamesFunnelChart";
import { GamesOverviewKpiCards } from "@/components/settings/games/GamesOverviewKpiCards";
import {
  useGamesFairnessQuery,
  useGamesFunnelQuery,
  useGamesOverviewQuery,
  type GamesOverviewCampaignAnalytics,
} from "@/hooks/games/useGamesAnalytics";
import { GAME_STATUS_LABELS, GAME_TYPE_LABELS } from "@/lib/constants/games";
import type { AnalyticsPeriod } from "@/lib/schemas/analytics";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
} from "@reelo/ui/components";
import { cn } from "@reelo/ui/lib/utils";
import { ArrowRight, Clock3, Gamepad2, Trophy, Waves, Zap } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

function formatCompact(value: number) {
  return value.toLocaleString("en-IN");
}

function CampaignAnalyticsList({
  campaigns,
  selectedId,
  onSelect,
  isLoading,
}: {
  campaigns: GamesOverviewCampaignAnalytics[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-28 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <Card className="border-border/70 border-dashed">
        <CardContent className="flex flex-col items-start gap-3 py-10">
          <div className="bg-muted flex size-12 items-center justify-center rounded-2xl">
            <Gamepad2 className="text-muted-foreground size-5" />
          </div>
          <div className="space-y-1">
            <p className="text-base font-semibold">No games to analyse yet</p>
            <p className="text-muted-foreground text-sm">
              Launch a game first, then this screen will break performance down
              campaign by campaign.
            </p>
          </div>
          <Button asChild size="sm">
            <Link href="/settings/games">Open games settings</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {campaigns.map((campaign) => {
        const isSelected = campaign.id === selectedId;

        return (
          <button
            key={campaign.id}
            type="button"
            onClick={() => onSelect(campaign.id)}
            className={cn(
              "w-full rounded-2xl border p-4 text-left transition-all",
              isSelected
                ? "border-primary/60 bg-primary/5 shadow-sm"
                : "border-border/60 bg-background hover:border-border hover:bg-muted/30",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold">{campaign.name}</p>
                  <Badge variant={isSelected ? "default" : "secondary"}>
                    {GAME_STATUS_LABELS[campaign.status] ?? campaign.status}
                  </Badge>
                </div>
                <p className="text-muted-foreground text-xs">
                  {GAME_TYPE_LABELS[campaign.type] ?? campaign.type}
                </p>
              </div>
              <ArrowRight
                className={cn(
                  "size-4 shrink-0 transition-transform",
                  isSelected && "translate-x-0.5",
                )}
              />
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3">
              <div>
                <p className="text-muted-foreground text-[11px] tracking-[0.14em] uppercase">
                  Plays
                </p>
                <p className="mt-1 text-lg font-semibold">
                  {formatCompact(campaign.attemptsInPeriod)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-[11px] tracking-[0.14em] uppercase">
                  Wins
                </p>
                <p className="mt-1 text-lg font-semibold">
                  {formatCompact(campaign.winsInPeriod)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-[11px] tracking-[0.14em] uppercase">
                  Win rate
                </p>
                <p className="mt-1 text-lg font-semibold">
                  {campaign.winRate}%
                </p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function SelectedGameOverview({
  campaign,
  fairness,
  isFairnessLoading,
}: {
  campaign: GamesOverviewCampaignAnalytics;
  fairness:
    | {
        displayName: string;
        configuredPercent: number | null;
        actualPercent: number;
        wins: number;
      }[]
    | null;
  isFairnessLoading: boolean;
}) {
  const metrics = [
    {
      label: "Plays in period",
      value: formatCompact(campaign.attemptsInPeriod),
      hint: campaign.lastAttemptAt ? "Recently active" : "No recent play",
      icon: Gamepad2,
    },
    {
      label: "Winners",
      value: formatCompact(campaign.winsInPeriod),
      hint: `${campaign.winRate}% win rate`,
      icon: Trophy,
    },
    {
      label: "Draw pending",
      value: formatCompact(campaign.drawPendingInPeriod),
      hint: "Waiting on lottery resolution",
      icon: Clock3,
    },
    {
      label: "Rate limited",
      value: formatCompact(campaign.rateLimitedInPeriod),
      hint: "Blocked by guardrails",
      icon: Zap,
    },
  ];

  return (
    <div className="space-y-6">
      <Card className="border-border/60 from-background via-background to-muted/20 overflow-hidden bg-gradient-to-br shadow-sm">
        <CardHeader className="border-border/50 border-b">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-2xl">{campaign.name}</CardTitle>
                <Badge variant="outline">
                  {GAME_TYPE_LABELS[campaign.type] ?? campaign.type}
                </Badge>
                <Badge variant="secondary">
                  {GAME_STATUS_LABELS[campaign.status] ?? campaign.status}
                </Badge>
              </div>
              <CardDescription className="max-w-2xl text-sm">
                Period-level performance for this game, including completions,
                waiting outcomes, and how the reward mix is actually landing.
              </CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/settings/games">Manage game setup</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => {
            const Icon = metric.icon;

            return (
              <div
                key={metric.label}
                className="border-border/60 bg-background/80 rounded-2xl border p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-muted-foreground text-xs tracking-[0.14em] uppercase">
                      {metric.label}
                    </p>
                    <p className="mt-2 text-2xl font-semibold">
                      {metric.value}
                    </p>
                  </div>
                  <div className="bg-muted flex size-9 items-center justify-center rounded-xl">
                    <Icon className="text-muted-foreground size-4" />
                  </div>
                </div>
                <p className="text-muted-foreground mt-2 text-xs">
                  {metric.hint}
                </p>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle>Play outcome funnel</CardTitle>
            <CardDescription>
              Every attempt is grouped into a final state so you can spot where
              players are dropping off.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GamesFunnelChart
              isLoading={false}
              attempts={campaign.attemptsInPeriod}
              won={campaign.winsInPeriod}
              drawPending={campaign.drawPendingInPeriod}
              rateLimited={campaign.rateLimitedInPeriod}
            />
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle>Reward share</CardTitle>
            <CardDescription>
              Configured reward intent versus what players actually won in this
              period.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isFairnessLoading ? (
              Array.from({ length: 4 }, (_, index) => (
                <Skeleton key={index} className="h-16 w-full rounded-xl" />
              ))
            ) : fairness && fairness.length > 0 ? (
              fairness.map((reward) => (
                <div
                  key={reward.displayName}
                  className="border-border/60 bg-muted/20 rounded-2xl border p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">
                        {reward.displayName}
                      </p>
                      <p className="text-muted-foreground mt-1 text-xs">
                        {reward.wins.toLocaleString("en-IN")} wins in period
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">
                        {reward.actualPercent}%
                      </p>
                      <p className="text-muted-foreground text-xs">
                        actual share
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 space-y-2">
                    <div>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Actual</span>
                        <span>{reward.actualPercent}%</span>
                      </div>
                      <div className="bg-muted h-2 rounded-full">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{
                            width: `${Math.min(reward.actualPercent, 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          Configured
                        </span>
                        <span>
                          {reward.configuredPercent == null
                            ? "Weight-based"
                            : `${reward.configuredPercent}%`}
                        </span>
                      </div>
                      <div className="bg-muted h-2 rounded-full">
                        <div
                          className="bg-foreground/30 h-2 rounded-full"
                          style={{
                            width:
                              reward.configuredPercent == null
                                ? "18%"
                                : `${Math.min(reward.configuredPercent, 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="border-border/70 bg-muted/10 rounded-2xl border border-dashed p-5 text-sm">
                Reward distribution will appear once this game starts producing
                winners.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function GamesAnalyticsPageClient() {
  const [period, setPeriod] = useState<AnalyticsPeriod>("30d");
  const overview = useGamesOverviewQuery(period);
  const campaigns = useMemo(
    () => overview.data?.campaignAnalytics ?? [],
    [overview.data?.campaignAnalytics],
  );
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const firstCampaignId = campaigns[0]?.id ?? null;

  useEffect(() => {
    if (campaigns.length === 0) {
      setCampaignId(null);
      return;
    }
    if (
      firstCampaignId &&
      (!campaignId || !campaigns.some((campaign) => campaign.id === campaignId))
    ) {
      setCampaignId(firstCampaignId);
    }
  }, [campaignId, campaigns, firstCampaignId]);

  const selected = useMemo(
    () => campaigns.find((campaign) => campaign.id === campaignId) ?? null,
    [campaignId, campaigns],
  );

  const funnel = useGamesFunnelQuery(campaignId, period);
  const fairness = useGamesFairnessQuery(campaignId, period);

  const fairnessRows = useMemo(() => {
    if (!fairness.data) return null;

    return fairness.data.configured.map((reward) => {
      const actual = fairness.data?.actualShares.find(
        (share) => share.rewardId === reward.rewardId,
      );

      return {
        displayName: reward.displayName,
        configuredPercent: reward.probabilityPercent,
        actualPercent: actual?.sharePercent ?? 0,
        wins: actual?.count ?? 0,
      };
    });
  }, [fairness.data]);

  return (
    <DashboardPageShell
      title="Games analytics"
      subtitle="Overall performance plus campaign-by-campaign breakdowns, so we can see what is working and what is not."
      contentVariant="contained"
      pageHeaderSecondaryActions={
        <PeriodSelector value={period} onChange={setPeriod} />
      }
    >
      <div className="space-y-6">
        <GamesOverviewKpiCards
          isLoading={overview.isLoading}
          campaigns={overview.data?.campaigns ?? 0}
          liveCampaigns={overview.data?.liveCampaigns ?? 0}
          attemptsInPeriod={overview.data?.attemptsInPeriod ?? 0}
          winsInPeriod={overview.data?.winsInPeriod ?? 0}
          participationRate={overview.data?.participationRate ?? 0}
        />

        <div className="grid gap-6 xl:grid-cols-[minmax(300px,0.9fr)_minmax(0,1.4fr)]">
          <Card className="border-border/60 shadow-sm">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle>Games in this period</CardTitle>
                  <CardDescription>
                    Compare performance per game instead of only looking at a
                    single overall total.
                  </CardDescription>
                </div>
                <div className="bg-muted text-muted-foreground flex size-10 items-center justify-center rounded-2xl">
                  <Waves className="size-4" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CampaignAnalyticsList
                campaigns={campaigns}
                selectedId={campaignId}
                onSelect={setCampaignId}
                isLoading={overview.isLoading}
              />
            </CardContent>
          </Card>

          {selected ? (
            <SelectedGameOverview
              campaign={{
                ...selected,
                attemptsInPeriod:
                  funnel.data?.funnel.attempts ?? selected.attemptsInPeriod,
                winsInPeriod: funnel.data?.funnel.won ?? selected.winsInPeriod,
                drawPendingInPeriod:
                  funnel.data?.funnel.drawPending ??
                  selected.drawPendingInPeriod,
                rateLimitedInPeriod:
                  funnel.data?.funnel.rateLimited ??
                  selected.rateLimitedInPeriod,
              }}
              fairness={fairnessRows}
              isFairnessLoading={fairness.isLoading}
            />
          ) : (
            <Card className="border-border/70 border-dashed">
              <CardContent className="flex min-h-[420px] items-center justify-center p-8 text-center">
                <div className="space-y-2">
                  <p className="text-lg font-semibold">
                    Pick a game to inspect
                  </p>
                  <p className="text-muted-foreground text-sm">
                    We’ll show plays, wins, pending outcomes, and reward mix for
                    that campaign here.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardPageShell>
  );
}
