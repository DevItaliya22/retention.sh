"use client";

import { fetcher } from "@/lib/fetcher";
import {
  Button,
  DateDisplay,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Skeleton,
} from "@reelo/ui/components";
import { useQuery } from "@tanstack/react-query";
import { History } from "lucide-react";
import { useState } from "react";

interface GameAuditLog {
  id: string;
  action: string;
  createdAt: string;
  actorUserId: string | null;
}

const ACTION_LABELS: Record<string, string> = {
  GAME_CAMPAIGN_CREATE: "Created this game",
  GAME_CAMPAIGN_UPDATE: "Updated settings",
  GAME_CAMPAIGN_PUBLISH: "Published (went live)",
  GAME_CAMPAIGN_PAUSE: "Paused",
  GAME_CAMPAIGN_ARCHIVE: "Archived",
  GAME_CAMPAIGN_CLONE: "Cloned",
  GAME_REWARDS_UPDATE: "Updated prizes",
  GAME_DISTRIBUTION_UPDATE: "Updated how winners are picked",
  GAME_ELIGIBILITY_UPDATE: "Updated who can play",
  GAME_FULFILLMENT_UPDATE: "Updated delivery",
  GAME_ANALYTICS_RECOMPUTE: "Recomputed analytics",
};

export function GameAuditLogDrawer({ campaignId }: { campaignId: string }) {
  const [open, setOpen] = useState(false);
  const query = useQuery<{ logs: GameAuditLog[] }>({
    queryKey: ["games", "audit", campaignId],
    queryFn: () =>
      fetcher(
        `/api/games/audit-logs?campaignId=${encodeURIComponent(campaignId)}`,
      ),
    enabled: open,
    staleTime: 10_000,
  });

  const logs = query.data?.logs ?? [];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm" variant="ghost" icon={<History className="size-4" />}>
          View history
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Activity history</SheetTitle>
          <SheetDescription>Every change made to this game.</SheetDescription>
        </SheetHeader>
        <div className="mt-4 space-y-2">
          {query.isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : logs.length === 0 ? (
            <p className="text-muted-foreground text-sm">No activity yet.</p>
          ) : (
            <ul className="divide-border divide-y rounded-md border">
              {logs.map((log) => (
                <li
                  key={log.id}
                  className="flex items-center justify-between gap-2 p-3"
                >
                  <p className="text-sm">
                    {ACTION_LABELS[log.action] ?? log.action}
                  </p>
                  <DateDisplay
                    date={log.createdAt}
                    className="text-muted-foreground text-xs"
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
