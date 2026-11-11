"use client";

import {
  useUpdateGameDistributionMutation,
  type GameCampaignDetail,
  type GameDistributionInput,
} from "@/hooks/games/useGameCampaigns";
import {
  GAME_DISTRIBUTION_MODE_HELP,
  GAME_DISTRIBUTION_MODE_LABELS,
} from "@/lib/constants/games";
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
} from "@reelo/ui/components";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Props {
  campaignId: string;
  policy: GameCampaignDetail["distributionPolicy"];
}

export function GameDistributionPolicySection({ campaignId, policy }: Props) {
  const save = useUpdateGameDistributionMutation();

  const [form, setForm] = useState<GameDistributionInput>(() => ({
    mode: policy?.mode ?? "PROBABILITY_WEIGHTED",
    populationWindowSize: policy?.populationWindowSize ?? null,
    populationWinnerCount: policy?.populationWinnerCount ?? null,
    maxWinnersTotal: policy?.maxWinnersTotal ?? null,
  }));

  useEffect(() => {
    setForm({
      mode: policy?.mode ?? "PROBABILITY_WEIGHTED",
      populationWindowSize: policy?.populationWindowSize ?? null,
      populationWinnerCount: policy?.populationWinnerCount ?? null,
      maxWinnersTotal: policy?.maxWinnersTotal ?? null,
    });
  }, [policy]);

  const onSave = async () => {
    try {
      await save.mutateAsync({ id: campaignId, policy: form });
      toast.success("How winners are picked saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>How winners are picked</CardTitle>
        <CardDescription>
          Choose how the game decides who wins when someone plays.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Method</Label>
          <Select
            value={form.mode}
            onValueChange={(v) =>
              setForm((f) => ({
                ...f,
                mode: v as GameDistributionInput["mode"],
              }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(GAME_DISTRIBUTION_MODE_LABELS).map(
                ([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>
          <p className="text-muted-foreground text-xs">
            {GAME_DISTRIBUTION_MODE_HELP[form.mode]}
          </p>
        </div>

        {form.mode === "POPULATION_RATIO" && (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <Label>Window size (plays)</Label>
              <Input
                type="number"
                min={1}
                placeholder="e.g. 100"
                value={form.populationWindowSize ?? ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    populationWindowSize:
                      e.target.value === "" ? null : Number(e.target.value),
                  }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label>Winners per window</Label>
              <Input
                type="number"
                min={0}
                placeholder="e.g. 10"
                value={form.populationWinnerCount ?? ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    populationWinnerCount:
                      e.target.value === "" ? null : Number(e.target.value),
                  }))
                }
              />
            </div>
          </div>
        )}

        {(form.mode === "FIXED_WINNER_COUNT" || form.mode === "FIRST_N") && (
          <div className="space-y-1">
            <Label>Total winners allowed</Label>
            <Input
              type="number"
              min={1}
              placeholder="e.g. 50"
              value={form.maxWinnersTotal ?? ""}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  maxWinnersTotal:
                    e.target.value === "" ? null : Number(e.target.value),
                }))
              }
            />
          </div>
        )}

        <div className="flex justify-end">
          <Button size="sm" loading={save.isPending} onClick={onSave}>
            Save
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
