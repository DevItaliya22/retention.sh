"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
} from "@reelo/ui/components";

export function GamesOverviewKpiCards(props: {
  isLoading: boolean;
  campaigns: number;
  attemptsInPeriod: number;
  winsInPeriod: number;
  participationRate: number;
}) {
  if (props.isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
    );
  }
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Campaigns</CardTitle>
          <CardDescription>Configured games</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold">{props.campaigns}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Attempts (period)</CardTitle>
          <CardDescription>All game attempts</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold">{props.attemptsInPeriod}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Win rate</CardTitle>
          <CardDescription>Wins / attempts</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold">{props.participationRate}%</p>
        </CardContent>
      </Card>
    </div>
  );
}
