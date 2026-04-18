"use client";

import { DashboardPageShell } from "@/components/layouts";
import { GamesFunnelChart } from "@/components/settings/games/GamesFunnelChart";
import { GamesOverviewKpiCards } from "@/components/settings/games/GamesOverviewKpiCards";
import {
  useGameCampaignsQuery,
  type GameCampaignListItem,
} from "@/hooks/games/useGameCampaigns";
import {
  useGamesFunnelQuery,
  useGamesOverviewQuery,
} from "@/hooks/games/useGamesAnalytics";
import { GAME_STATUS_LABELS, GAME_TYPE_LABELS } from "@/lib/constants/games";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@reelo/ui/components";
import { useMemo, useState } from "react";

export function GamesAnalyticsPageClient() {
  const overview = useGamesOverviewQuery("30d");
  const { data: list } = useGameCampaignsQuery();
  const campaigns = list?.campaigns ?? [];
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const funnel = useGamesFunnelQuery(campaignId, "30d");

  const selected = useMemo(
    () => campaigns.find((c: GameCampaignListItem) => c.id === campaignId),
    [campaigns, campaignId],
  );

  return (
    <DashboardPageShell
      title="Games analytics"
      subtitle="See how your games are performing — plays, wins, and where people drop off."
      contentVariant="contained"
    >
      <GamesOverviewKpiCards
        isLoading={overview.isLoading}
        campaigns={overview.data?.campaigns ?? 0}
        attemptsInPeriod={overview.data?.attemptsInPeriod ?? 0}
        winsInPeriod={overview.data?.winsInPeriod ?? 0}
        participationRate={overview.data?.participationRate ?? 0}
      />

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Single game breakdown</CardTitle>
          <CardDescription>
            Pick a game to see how many people played and how many won.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-w-md space-y-2">
            <Label>Game</Label>
            <Select
              value={campaignId ?? "none"}
              onValueChange={(v) => setCampaignId(v === "none" ? null : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a game" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Select a game…</SelectItem>
                {campaigns.map((c: GameCampaignListItem) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} · {GAME_STATUS_LABELS[c.status] ?? c.status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selected && (
              <p className="text-muted-foreground text-xs">
                {GAME_TYPE_LABELS[selected.type] ?? selected.type} ·{" "}
                {selected._count.attempts.toLocaleString("en-IN")} plays so far
              </p>
            )}
          </div>
          <GamesFunnelChart
            isLoading={funnel.isLoading}
            attempts={funnel.data?.funnel.attempts ?? 0}
            won={funnel.data?.funnel.won ?? 0}
            drawPending={funnel.data?.funnel.drawPending ?? 0}
            rateLimited={funnel.data?.funnel.rateLimited ?? 0}
          />
        </CardContent>
      </Card>
    </DashboardPageShell>
  );
}
