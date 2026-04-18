"use client";

import type { GameCampaignDetail } from "@/hooks/games/useGameCampaigns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@reelo/ui/components";

interface Props {
  rule: GameCampaignDetail["eligibilityRules"][number] | undefined;
  distribution: GameCampaignDetail["distributionPolicy"];
}

export function GameGuardrailsSection({ rule, distribution }: Props) {
  const perCustomerLimit =
    rule?.intervalEnabled && rule?.maxAttemptsPerUserPerInterval
      ? `${rule.maxAttemptsPerUserPerInterval} play(s) every ${rule.intervalValue ?? ""} ${
          rule.intervalUnit?.toLowerCase() ?? "day"
        }s`
      : "No cooldown";
  const totalCap = rule?.globalAttemptCap
    ? `${rule.globalAttemptCap.toLocaleString()} total plays`
    : "No total play limit";
  const maxWinners = distribution?.maxWinnersTotal
    ? `${distribution.maxWinnersTotal.toLocaleString()} winners max`
    : "No winner cap";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Safety checks</CardTitle>
        <CardDescription>
          A quick summary of what will stop someone from playing too much.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
        <div className="rounded-md border p-3">
          <p className="text-muted-foreground text-xs font-medium uppercase">
            Per customer
          </p>
          <p className="mt-1">{perCustomerLimit}</p>
        </div>
        <div className="rounded-md border p-3">
          <p className="text-muted-foreground text-xs font-medium uppercase">
            Total plays
          </p>
          <p className="mt-1">{totalCap}</p>
        </div>
        <div className="rounded-md border p-3">
          <p className="text-muted-foreground text-xs font-medium uppercase">
            Winners
          </p>
          <p className="mt-1">{maxWinners}</p>
        </div>
      </CardContent>
    </Card>
  );
}
