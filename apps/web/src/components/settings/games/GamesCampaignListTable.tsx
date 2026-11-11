"use client";

import type { GameCampaignListItem } from "@/hooks/games/useGameCampaigns";
import { Badge, Skeleton } from "@reelo/ui/components";

export function GamesCampaignListTable(props: {
  campaigns: GameCampaignListItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  isLoading?: boolean;
}) {
  if (props.isLoading) {
    return <Skeleton className="h-40 w-full" />;
  }
  if (props.campaigns.length === 0) {
    return <p className="text-muted-foreground text-sm">No campaigns yet.</p>;
  }
  return (
    <ul className="divide-border divide-y rounded-md border">
      {props.campaigns.map((c) => (
        <li key={c.id}>
          <button
            type="button"
            onClick={() => props.onSelect(c.id)}
            className={`hover:bg-muted/50 flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm ${
              props.selectedId === c.id ? "bg-muted/60" : ""
            }`}
          >
            <span className="font-medium">{c.name}</span>
            <span className="flex items-center gap-2">
              <Badge variant="secondary">{c.type}</Badge>
              <Badge>{c.status}</Badge>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
