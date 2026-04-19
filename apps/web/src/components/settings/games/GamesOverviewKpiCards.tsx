"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
} from "@reelo/ui/components";
import { Activity, Gamepad2, Trophy, Users2 } from "lucide-react";

interface GamesOverviewKpiCardsProps {
  isLoading: boolean;
  campaigns: number;
  liveCampaigns: number;
  attemptsInPeriod: number;
  winsInPeriod: number;
  participationRate: number;
}

export function GamesOverviewKpiCards({
  isLoading,
  campaigns,
  liveCampaigns,
  attemptsInPeriod,
  winsInPeriod,
  participationRate,
}: GamesOverviewKpiCardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-36 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  const items = [
    {
      title: "Live games",
      description: `${campaigns} configured in total`,
      value: liveCampaigns.toLocaleString("en-IN"),
      icon: Activity,
      tone: "from-emerald-500/12 via-emerald-500/6 to-transparent",
    },
    {
      title: "Plays in period",
      description: "Every eligible play across all games",
      value: attemptsInPeriod.toLocaleString("en-IN"),
      icon: Users2,
      tone: "from-sky-500/12 via-sky-500/6 to-transparent",
    },
    {
      title: "Winners in period",
      description: "Successful reward allocations",
      value: winsInPeriod.toLocaleString("en-IN"),
      icon: Trophy,
      tone: "from-amber-500/14 via-amber-500/7 to-transparent",
    },
    {
      title: "Overall win rate",
      description: "Wins as a share of plays in this period",
      value: `${participationRate}%`,
      icon: Gamepad2,
      tone: "from-fuchsia-500/12 via-fuchsia-500/6 to-transparent",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <Card
            key={item.title}
            className={`border-border/60 overflow-hidden bg-gradient-to-br ${item.tone} shadow-sm`}
          >
            <CardHeader className="flex flex-row items-start justify-between gap-3 pb-3">
              <div className="space-y-1">
                <CardDescription className="text-muted-foreground text-xs tracking-[0.18em] uppercase">
                  {item.title}
                </CardDescription>
                <CardTitle className="text-3xl font-semibold tracking-tight">
                  {item.value}
                </CardTitle>
              </div>
              <div className="bg-background/80 text-foreground flex size-10 shrink-0 items-center justify-center rounded-2xl border border-white/40 shadow-sm">
                <Icon className="size-4" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-muted-foreground text-sm leading-relaxed">
                {item.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
