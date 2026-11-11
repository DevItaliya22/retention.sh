"use client";

import {
  useUpdateGameRewardsMutation,
  type GameCampaignDetail,
  type GameRewardInput,
} from "@/hooks/games/useGameCampaigns";
import { GAME_REWARD_KIND_LABELS } from "@/lib/constants/games";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
} from "@reelo/ui/components";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

interface Props {
  campaignId: string;
  rewards: GameCampaignDetail["rewards"];
}

type RewardKind = GameRewardInput["kind"];

function numericInputValue(value: number | null | undefined): number | "" {
  if (value == null || value === 0) return "";
  return value;
}

function toDraft(r: GameCampaignDetail["rewards"][number]): GameRewardInput {
  return {
    id: r.id,
    kind: r.kind,
    displayName: r.displayName,
    weight: r.weight,
    probabilityPercent: r.probabilityPercent,
    maxWinners: r.maxWinners,
    stock: r.stock,
    priority: r.priority,
    isFallbackNoReward: r.isFallbackNoReward,
    freeItemSkuId: r.freeItemSkuId,
    pointsAmount: r.pointsAmount,
    cashbackAmount: r.cashbackAmount,
    percentageValue: r.percentageValue,
    voucherCode: r.voucherCode,
  };
}

function blankReward(): GameRewardInput {
  return {
    kind: "LOYALTY_POINTS",
    displayName: "Points reward",
    weight: 100,
    probabilityPercent: null,
    maxWinners: null,
    stock: null,
    priority: 0,
    isFallbackNoReward: false,
    freeItemSkuId: null,
    pointsAmount: 10,
    cashbackAmount: null,
    percentageValue: null,
    voucherCode: null,
  };
}

export function GameRewardPoolSection({ campaignId, rewards }: Props) {
  const [items, setItems] = useState<GameRewardInput[]>(() =>
    rewards.length ? rewards.map(toDraft) : [blankReward()],
  );
  useEffect(() => {
    setItems(rewards.length ? rewards.map(toDraft) : [blankReward()]);
  }, [rewards]);

  const save = useUpdateGameRewardsMutation();

  const totalWeight = useMemo(
    () => items.reduce((sum, r) => sum + (Number(r.weight) || 0), 0),
    [items],
  );

  const update = (idx: number, patch: Partial<GameRewardInput>) => {
    setItems((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)),
    );
  };

  const remove = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const add = () => {
    setItems((prev) => [...prev, blankReward()]);
  };

  const onSave = async () => {
    const cleaned = items
      .map((r) => ({
        ...r,
        displayName: r.displayName.trim() || "Prize",
        weight: Math.max(0, Number(r.weight) || 0),
      }))
      .filter((r) => r.displayName.length > 0);

    if (cleaned.length === 0) {
      toast.error("Add at least one prize");
      return;
    }
    if (!cleaned.some((r) => (r.weight ?? 0) > 0)) {
      toast.error("At least one prize must have a chance above 0");
      return;
    }
    if (
      !cleaned.some(
        (r) =>
          r.kind !== "NONE" && !r.isFallbackNoReward && (r.weight ?? 0) > 0,
      )
    ) {
      toast.error(
        "Add at least one real winning prize (not 'No prize') with chance above 0%",
      );
      return;
    }

    const sum = cleaned.reduce((acc, r) => acc + (Number(r.weight) || 0), 0);
    if (Math.abs(sum - 100) > 0.1) {
      toast.error(
        `Chances must add up to 100% (currently ${sum.toFixed(1)}%). Please adjust.`,
      );
      return;
    }

    try {
      await save.mutateAsync({ id: campaignId, rewards: cleaned });
      toast.success("Prizes saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save prizes");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Prizes</CardTitle>
        <CardDescription>
          Add what players can win. Type the chance % for each prize. All
          chances must add up to 100% — you&apos;ll be prompted on save if they
          don&apos;t.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {items.map((r, idx) => {
            return (
              <div key={idx} className="space-y-3 rounded-lg border p-3">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_200px_140px_auto]">
                  <div className="space-y-1">
                    <Label>Prize name</Label>
                    <Input
                      value={r.displayName}
                      onChange={(e) =>
                        update(idx, { displayName: e.target.value })
                      }
                      placeholder="e.g. 10% off"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Type</Label>
                    <Select
                      value={r.kind}
                      onValueChange={(v) =>
                        update(idx, { kind: v as RewardKind })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(GAME_REWARD_KIND_LABELS).map(
                          ([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Chance %</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step="0.1"
                      inputMode="decimal"
                      value={numericInputValue(r.weight)}
                      onChange={(e) =>
                        update(idx, {
                          weight:
                            e.target.value === ""
                              ? 0
                              : Number(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      icon={<Trash2 className="size-4" />}
                      onClick={() => remove(idx)}
                      disabled={items.length <= 1}
                    >
                      Remove
                    </Button>
                  </div>
                </div>

                {r.kind === "LOYALTY_POINTS" && (
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="space-y-1">
                      <Label>Points awarded</Label>
                      <Input
                        type="number"
                        min={0}
                        value={numericInputValue(r.pointsAmount)}
                        onChange={(e) =>
                          update(idx, {
                            pointsAmount:
                              e.target.value === ""
                                ? null
                                : Number(e.target.value),
                          })
                        }
                      />
                    </div>
                  </div>
                )}

                {r.kind === "CASHBACK" && (
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="space-y-1">
                      <Label>Cashback amount (₹)</Label>
                      <Input
                        type="number"
                        min={0}
                        value={numericInputValue(r.cashbackAmount)}
                        onChange={(e) =>
                          update(idx, {
                            cashbackAmount:
                              e.target.value === ""
                                ? null
                                : Number(e.target.value),
                          })
                        }
                      />
                    </div>
                  </div>
                )}

                {r.kind === "PERCENTAGE_DISCOUNT" && (
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="space-y-1">
                      <Label>Discount %</Label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={numericInputValue(r.percentageValue)}
                        onChange={(e) =>
                          update(idx, {
                            percentageValue:
                              e.target.value === ""
                                ? null
                                : Number(e.target.value),
                          })
                        }
                      />
                    </div>
                  </div>
                )}

                {r.kind === "VOUCHER_CODE" && (
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="space-y-1">
                      <Label>Voucher code</Label>
                      <Input
                        value={r.voucherCode ?? ""}
                        onChange={(e) =>
                          update(idx, { voucherCode: e.target.value })
                        }
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div className="space-y-1">
                    <Label>Max winners (optional)</Label>
                    <Input
                      type="number"
                      min={0}
                      placeholder="No limit"
                      value={numericInputValue(r.maxWinners)}
                      onChange={(e) =>
                        update(idx, {
                          maxWinners:
                            e.target.value === ""
                              ? null
                              : Number(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Stock (optional)</Label>
                    <Input
                      type="number"
                      min={0}
                      placeholder="No limit"
                      value={numericInputValue(r.stock)}
                      onChange={(e) =>
                        update(idx, {
                          stock:
                            e.target.value === ""
                              ? null
                              : Number(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between gap-3 pt-6">
                    <Label htmlFor={`fallback-${idx}`} className="text-xs">
                      Use as &quot;no prize&quot; fallback
                    </Label>
                    <Switch
                      id={`fallback-${idx}`}
                      checked={!!r.isFallbackNoReward}
                      onCheckedChange={(v) =>
                        update(idx, { isFallbackNoReward: v })
                      }
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={<Plus className="size-4" />}
            onClick={add}
          >
            Add prize
          </Button>
          <div className="flex items-center gap-3">
            <span
              className={
                Math.abs(totalWeight - 100) > 0.1
                  ? "text-destructive text-xs font-medium tabular-nums"
                  : "text-muted-foreground text-xs tabular-nums"
              }
            >
              Total: {totalWeight.toFixed(1)}% / 100%
            </span>
            <Button size="sm" loading={save.isPending} onClick={onSave}>
              Save prizes
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
