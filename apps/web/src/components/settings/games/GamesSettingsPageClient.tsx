"use client";

import { DashboardPageShell } from "@/components/layouts";
import { GameAuditLogDrawer } from "@/components/settings/games/GameAuditLogDrawer";
import { GameDistributionPolicySection } from "@/components/settings/games/GameDistributionPolicySection";
import { GameEligibilityBuilder } from "@/components/settings/games/GameEligibilityBuilder";
import { GameFulfillmentSection } from "@/components/settings/games/GameFulfillmentSection";
import { GameGuardrailsSection } from "@/components/settings/games/GameGuardrailsSection";
import { GameRewardPoolSection } from "@/components/settings/games/GameRewardPoolSection";
import {
  useArchiveGameCampaignMutation,
  useCreateGameCampaignMutation,
  useGameCampaignDetailQuery,
  useGameCampaignsQuery,
  usePauseGameCampaignMutation,
  usePublishGameCampaignMutation,
  type GameCampaignDetail,
  type GameCampaignListItem,
} from "@/hooks/games/useGameCampaigns";
import {
  GAME_STATUS_LABELS,
  GAME_STATUS_TONES,
  GAME_TYPE_LABELS,
} from "@/lib/constants/games";
import { getDataTableConfig } from "@/lib/utils/data-table-params";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DataTable,
  DataTableColumnHeader,
  DataTableToolbar,
  DateDisplay,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
} from "@reelo/ui/components";
import { useDataTable } from "@reelo/ui/hooks";
import type { ColumnDef } from "@tanstack/react-table";
import {
  ChevronRight,
  Gamepad2,
  Pause,
  Play,
  Plus,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type GameType = "SPIN_WHEEL" | "LOTTERY" | "SCRATCH_CARD";

function StatusPill({ status }: { status: string }) {
  return (
    <Badge variant={GAME_STATUS_TONES[status] ?? "secondary"}>
      {GAME_STATUS_LABELS[status] ?? status}
    </Badge>
  );
}

function NewGameDialog({ onCreated }: { onCreated: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<GameType>("SPIN_WHEEL");
  const create = useCreateGameCampaignMutation();

  const submit = async () => {
    const trimmed = name.trim();
    if (trimmed.length === 0) {
      toast.error("Give your game a name");
      return;
    }
    try {
      const res = await create.mutateAsync({ type, name: trimmed });
      toast.success("Game created");
      setOpen(false);
      setName("");
      setType("SPIN_WHEEL");
      onCreated(res.campaign.id);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create game");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button icon={<Plus className="size-4" />} size="sm">
          New game
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create a new game</DialogTitle>
          <DialogDescription>
            Start by giving it a name and choosing the game style. You can
            configure prizes and rules after.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 px-6 pb-2">
          <div className="space-y-1">
            <Label htmlFor="game-name">Name</Label>
            <Input
              id="game-name"
              placeholder="e.g. Diwali spin & win"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="space-y-1">
            <Label>Style</Label>
            <Select value={type} onValueChange={(v) => setType(v as GameType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SPIN_WHEEL">
                  {GAME_TYPE_LABELS.SPIN_WHEEL}
                </SelectItem>
                <SelectItem value="LOTTERY">
                  {GAME_TYPE_LABELS.LOTTERY}
                </SelectItem>
                <SelectItem value="SCRATCH_CARD">
                  {GAME_TYPE_LABELS.SCRATCH_CARD}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button loading={create.isPending} onClick={submit}>
            Create game
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function createSkeletonItem(id: string): GameCampaignListItem {
  return {
    id,
    name: "",
    slug: "",
    type: "SPIN_WHEEL",
    status: "DRAFT",
    fulfillmentMode: "INSTANT",
    updatedAt: new Date().toISOString(),
    _count: { attempts: 0, rewards: 0 },
  };
}

function GamesList({
  onOpen,
  onCreate,
}: {
  onOpen: (id: string) => void;
  onCreate: (id: string) => void;
}) {
  const { data, isLoading, isError, error } = useGameCampaignsQuery();
  const items = useMemo(() => data?.campaigns ?? [], [data?.campaigns]);
  const perPage = 10;
  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / perPage));

  const running = items.filter((c) => c.status === "ACTIVE").length;
  const totalPlays = items.reduce(
    (sum, c) => sum + (c._count?.attempts ?? 0),
    0,
  );

  const displayItems = useMemo(() => {
    if (isLoading && items.length === 0) {
      return Array.from({ length: 5 }, (_, i) =>
        createSkeletonItem(`skeleton-${i}`),
      );
    }
    return items;
  }, [isLoading, items]);

  const columns = useMemo<ColumnDef<GameCampaignListItem>[]>(
    () => [
      {
        id: "name",
        accessorKey: "name",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Game" />
        ),
        cell: ({ row }) => {
          const g = row.original;
          if (isLoading && g.id.startsWith("skeleton-")) {
            return <Skeleton className="h-4 w-40" />;
          }
          return <div className="font-medium">{g.name}</div>;
        },
        enableColumnFilter: true,
        enableSorting: true,
        meta: {
          label: "Name",
          variant: "text" as const,
          placeholder: "Search games...",
          maxLength: 200,
        },
      },
      {
        id: "type",
        accessorKey: "type",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Style" />
        ),
        cell: ({ row }) => {
          const g = row.original;
          if (isLoading && g.id.startsWith("skeleton-")) {
            return <Skeleton className="h-4 w-24" />;
          }
          return (
            <span className="text-muted-foreground text-sm">
              {GAME_TYPE_LABELS[g.type] ?? g.type}
            </span>
          );
        },
        enableColumnFilter: true,
        enableSorting: true,
        meta: {
          label: "Style",
          variant: "select" as const,
          options: Object.entries(GAME_TYPE_LABELS).map(([value, label]) => ({
            label,
            value,
          })),
        },
      },
      {
        id: "status",
        accessorKey: "status",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Status" />
        ),
        cell: ({ row }) => {
          const g = row.original;
          if (isLoading && g.id.startsWith("skeleton-")) {
            return <Skeleton className="h-5 w-20" />;
          }
          return <StatusPill status={g.status} />;
        },
        enableColumnFilter: true,
        enableSorting: true,
        meta: {
          label: "Status",
          variant: "select" as const,
          options: Object.entries(GAME_STATUS_LABELS).map(([value, label]) => ({
            label,
            value,
          })),
        },
      },
      {
        id: "rewards",
        header: () => (
          <div className="flex w-full justify-center text-xs">Prizes</div>
        ),
        cell: ({ row }) => {
          const g = row.original;
          if (isLoading && g.id.startsWith("skeleton-")) {
            return (
              <div className="flex justify-center">
                <Skeleton className="h-4 w-6" />
              </div>
            );
          }
          return (
            <div className="text-center tabular-nums">
              {g._count?.rewards ?? 0}
            </div>
          );
        },
        enableSorting: false,
      },
      {
        id: "plays",
        header: () => (
          <div className="flex w-full justify-center text-xs">Plays</div>
        ),
        cell: ({ row }) => {
          const g = row.original;
          if (isLoading && g.id.startsWith("skeleton-")) {
            return (
              <div className="flex justify-center">
                <Skeleton className="h-4 w-10" />
              </div>
            );
          }
          return (
            <div className="text-center tabular-nums">
              {(g._count?.attempts ?? 0).toLocaleString("en-IN")}
            </div>
          );
        },
        enableSorting: false,
      },
      {
        id: "updatedAt",
        accessorKey: "updatedAt",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Updated" />
        ),
        cell: ({ row }) => {
          const g = row.original;
          if (isLoading && g.id.startsWith("skeleton-")) {
            return <Skeleton className="h-4 w-20" />;
          }
          return (
            <DateDisplay
              date={g.updatedAt}
              className="text-muted-foreground text-sm"
            />
          );
        },
        enableSorting: true,
      },
      {
        id: "actions",
        size: 120,
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => {
          const g = row.original;
          if (isLoading && g.id.startsWith("skeleton-")) {
            return (
              <div className="flex justify-end">
                <Skeleton className="h-8 w-20" />
              </div>
            );
          }
          return (
            <div className="flex justify-end">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onOpen(g.id)}
                right={<ChevronRight className="size-4" />}
              >
                Open
              </Button>
            </div>
          );
        },
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [isLoading, onOpen],
  );

  const { table } = useDataTable({
    data: displayItems,
    columns,
    pageCount,
    shallow: false,
    initialState: {
      pagination: { pageIndex: 0, pageSize: perPage },
      sorting: [{ id: "updatedAt", desc: true }],
      columnPinning: { right: ["actions"] },
    },
    prefix: getDataTableConfig("games").prefix,
  });

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-destructive text-sm font-medium">
          Could not load games
        </p>
        <p className="text-muted-foreground mt-1 text-sm">
          {error?.message || "Please try again later"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border-border/60 from-background via-background to-muted/25 overflow-hidden bg-gradient-to-r shadow-sm">
        <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-2">
            <p className="text-muted-foreground text-xs tracking-[0.18em] uppercase">
              Campaign workspace
            </p>
            <p className="text-xl font-semibold tracking-tight">
              Launch better-looking games, then tune rewards, eligibility, and
              fulfillment from one place.
            </p>
            <p className="text-muted-foreground text-sm leading-relaxed">
              The list below shows every campaign you have built, while each
              game detail screen lets you clean up prize logic and publishing
              flow without hopping between pages.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[460px]">
            <div className="border-border/60 bg-background/85 rounded-2xl border px-4 py-3">
              <p className="text-muted-foreground text-xs tracking-[0.14em] uppercase">
                Games
              </p>
              <div className="mt-2 flex h-9 items-center">
                {isLoading ? (
                  <Skeleton className="h-8 w-8" />
                ) : (
                  <p className="text-2xl font-bold tabular-nums">
                    {total.toLocaleString("en-IN")}
                  </p>
                )}
              </div>
              <p className="text-muted-foreground mt-1 text-xs">
                all campaigns
              </p>
            </div>
            <div className="border-border/60 bg-background/85 rounded-2xl border px-4 py-3">
              <p className="text-muted-foreground text-xs tracking-[0.14em] uppercase">
                Running
              </p>
              <div className="mt-2 flex h-9 items-center">
                {isLoading ? (
                  <Skeleton className="h-8 w-8" />
                ) : (
                  <p className="text-2xl font-bold tabular-nums">
                    {running.toLocaleString("en-IN")}
                  </p>
                )}
              </div>
              <p className="text-muted-foreground mt-1 text-xs">
                currently live
              </p>
            </div>
            <div className="border-border/60 bg-background/85 rounded-2xl border px-4 py-3">
              <p className="text-muted-foreground text-xs tracking-[0.14em] uppercase">
                Total plays
              </p>
              <div className="mt-2 flex h-9 items-center">
                {isLoading ? (
                  <Skeleton className="h-8 w-8" />
                ) : (
                  <p className="text-2xl font-bold tabular-nums">
                    {totalPlays.toLocaleString("en-IN")}
                  </p>
                )}
              </div>
              <p className="text-muted-foreground mt-1 text-xs">
                across all games
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="border-border/60 bg-card rounded-2xl border px-5 py-4 shadow-sm">
          <p className="text-muted-foreground mb-1 text-xs font-medium">
            Games
          </p>
          <div className="flex h-9 items-center">
            {isLoading ? (
              <Skeleton className="h-8 w-8" />
            ) : (
              <p className="text-foreground text-2xl font-bold tabular-nums">
                {total.toLocaleString("en-IN")}
              </p>
            )}
          </div>
          <p className="text-muted-foreground mt-0.5 text-xs">all time</p>
        </div>
        <div className="border-border/60 bg-card rounded-2xl border px-5 py-4 shadow-sm">
          <p className="text-muted-foreground mb-1 text-xs font-medium">
            Running now
          </p>
          <div className="flex h-9 items-center">
            {isLoading ? (
              <Skeleton className="h-8 w-8" />
            ) : (
              <p className="text-foreground text-2xl font-bold tabular-nums">
                {running.toLocaleString("en-IN")}
              </p>
            )}
          </div>
          <p className="text-muted-foreground mt-0.5 text-xs">live games</p>
        </div>
        <div className="border-border/60 bg-card rounded-2xl border px-5 py-4 shadow-sm">
          <p className="text-muted-foreground mb-1 text-xs font-medium">
            Total plays
          </p>
          <div className="flex h-9 items-center">
            {isLoading ? (
              <Skeleton className="h-8 w-8" />
            ) : (
              <p className="text-foreground text-2xl font-bold tabular-nums">
                {totalPlays.toLocaleString("en-IN")}
              </p>
            )}
          </div>
          <p className="text-muted-foreground mt-0.5 text-xs">
            across all games
          </p>
        </div>
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardContent className="p-4">
          <DataTable
            table={table}
            renderEmpty={() => (
              <Empty className="py-12">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Gamepad2 className="size-6" />
                  </EmptyMedia>
                  <EmptyTitle>No games yet</EmptyTitle>
                  <EmptyDescription>
                    Create your first game to give customers a chance to win.
                  </EmptyDescription>
                </EmptyHeader>
                <NewGameDialog onCreated={onCreate} />
              </Empty>
            )}
          >
            <DataTableToolbar table={table} maxTextFilters={1} />
          </DataTable>
        </CardContent>
      </Card>
    </div>
  );
}

function GameDetailCard({
  gameId,
  onClose,
}: {
  gameId: string;
  onClose: () => void;
}) {
  const detail = useGameCampaignDetailQuery(gameId);
  const publish = usePublishGameCampaignMutation();
  const pause = usePauseGameCampaignMutation();
  const archive = useArchiveGameCampaignMutation();

  if (detail.isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-3">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-40 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const campaign = (detail.data?.campaign ?? null) as GameCampaignDetail | null;

  if (!campaign) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground text-sm">
            Game not found.{" "}
            <button className="underline underline-offset-2" onClick={onClose}>
              Go back
            </button>
          </p>
        </CardContent>
      </Card>
    );
  }

  const canPublish =
    campaign.status === "DRAFT" || campaign.status === "PAUSED";
  const canPause = campaign.status === "ACTIVE";
  const canArchive = campaign.status !== "ARCHIVED";

  return (
    <div className="space-y-6">
      <Card className="border-border/60 from-background via-background to-muted/20 overflow-hidden bg-gradient-to-r shadow-sm">
        <CardHeader className="gap-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-xl">{campaign.name}</CardTitle>
                <StatusPill status={campaign.status} />
                <Badge variant="outline">
                  {GAME_TYPE_LABELS[campaign.type] ?? campaign.type}
                </Badge>
              </div>
              <CardDescription className="mt-1 max-w-2xl text-sm">
                {campaign.rewards.length} prize
                {campaign.rewards.length === 1 ? "" : "s"} configured. Tune the
                rules below to control who can play, what they can win, and how
                fulfillment happens.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <GameAuditLogDrawer campaignId={campaign.id} />
              {canPublish && (
                <Button
                  size="sm"
                  icon={<Play className="size-4" />}
                  loading={publish.isPending}
                  onClick={async () => {
                    try {
                      await publish.mutateAsync(campaign.id);
                      toast.success("Game is live");
                    } catch (e) {
                      toast.error(
                        e instanceof Error ? e.message : "Could not publish",
                      );
                    }
                  }}
                >
                  Go live
                </Button>
              )}
              {canPause && (
                <Button
                  size="sm"
                  variant="secondary"
                  icon={<Pause className="size-4" />}
                  loading={pause.isPending}
                  onClick={async () => {
                    try {
                      await pause.mutateAsync(campaign.id);
                      toast.success("Game paused");
                    } catch (e) {
                      toast.error(
                        e instanceof Error ? e.message : "Could not pause",
                      );
                    }
                  }}
                >
                  Pause
                </Button>
              )}
              {canArchive && (
                <Button
                  size="sm"
                  variant="outline"
                  loading={archive.isPending}
                  onClick={async () => {
                    try {
                      await archive.mutateAsync(campaign.id);
                      toast.success("Game archived");
                      onClose();
                    } catch (e) {
                      toast.error(
                        e instanceof Error ? e.message : "Could not archive",
                      );
                    }
                  }}
                >
                  Archive
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <GameEligibilityBuilder
        campaignId={campaign.id}
        rules={campaign.eligibilityRules}
      />
      <GameRewardPoolSection
        campaignId={campaign.id}
        rewards={campaign.rewards}
      />
      <GameDistributionPolicySection
        campaignId={campaign.id}
        policy={campaign.distributionPolicy}
      />
      <GameFulfillmentSection
        campaignId={campaign.id}
        fulfillmentMode={campaign.fulfillmentMode}
        drawAt={campaign.drawAt}
      />
      <GameGuardrailsSection
        rule={campaign.eligibilityRules[0]}
        distribution={campaign.distributionPolicy}
      />
    </div>
  );
}

export function GamesSettingsPageClient() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <DashboardPageShell
      title="Games of chance"
      subtitle="Let customers play to win — spin the wheel, scratch & win, or enter a lottery."
      contentVariant="contained"
      pageHeaderSecondaryActions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/settings/games/analytics">
              <Sparkles className="size-4" />
              View analytics
            </Link>
          </Button>
          <NewGameDialog onCreated={setSelectedId} />
        </div>
      }
    >
      <div className="space-y-6">
        {!selectedId ? (
          <div className="border-border/60 from-primary/8 via-background rounded-3xl border bg-gradient-to-r to-amber-500/10 p-6 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl space-y-2">
                <p className="text-muted-foreground text-xs tracking-[0.18em] uppercase">
                  Games of chance
                </p>
                <h2 className="text-2xl font-semibold tracking-tight">
                  Build polished play-to-win campaigns, not just a raw config
                  form.
                </h2>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Use this workspace to launch spin wheels, lotteries, and
                  scratch cards, then jump into analytics to compare campaign
                  performance one by one.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/settings/games/analytics">
                    <Sparkles className="size-4" />
                    Open analytics
                  </Link>
                </Button>
                <NewGameDialog onCreated={setSelectedId} />
              </div>
            </div>
          </div>
        ) : null}

        {selectedId ? (
          <GameDetailCard
            gameId={selectedId}
            onClose={() => setSelectedId(null)}
          />
        ) : (
          <GamesList onOpen={setSelectedId} onCreate={setSelectedId} />
        )}
      </div>
    </DashboardPageShell>
  );
}
