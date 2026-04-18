"use client";

import {
  useUpdateGameEligibilityMutation,
  type GameCampaignDetail,
  type GameEligibilityRuleInput,
} from "@/hooks/games/useGameCampaigns";
import {
  GAME_ELIGIBILITY_EVENT_LABELS,
  GAME_INTERVAL_UNIT_LABELS,
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
  Switch,
} from "@reelo/ui/components";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Props {
  campaignId: string;
  rules: GameCampaignDetail["eligibilityRules"];
}

type IntervalUnit = NonNullable<GameEligibilityRuleInput["intervalUnit"]>;

function toDraft(
  r: GameCampaignDetail["eligibilityRules"][number],
): GameEligibilityRuleInput {
  return {
    eventType: r.eventType,
    intervalEnabled: r.intervalEnabled,
    intervalValue: r.intervalValue,
    intervalUnit: r.intervalUnit,
    maxAttemptsPerUserPerInterval: r.maxAttemptsPerUserPerInterval,
    globalAttemptCap: r.globalAttemptCap,
    firstNEligibleUsers: r.firstNEligibleUsers,
    segmentId: r.segmentId,
  };
}

function defaultRule(): GameEligibilityRuleInput {
  return {
    eventType: "BILL_CREATED",
    intervalEnabled: false,
    intervalValue: null,
    intervalUnit: null,
    maxAttemptsPerUserPerInterval: 1,
    globalAttemptCap: null,
    firstNEligibleUsers: null,
    segmentId: null,
  };
}

export function GameEligibilityBuilder({ campaignId, rules }: Props) {
  const save = useUpdateGameEligibilityMutation();
  const [rule, setRule] = useState<GameEligibilityRuleInput>(
    rules.length ? toDraft(rules[0]!) : defaultRule(),
  );

  useEffect(() => {
    setRule(rules.length ? toDraft(rules[0]!) : defaultRule());
  }, [rules]);

  const onSave = async () => {
    try {
      await save.mutateAsync({ id: campaignId, rules: [rule] });
      toast.success("Who can play saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Who can play</CardTitle>
        <CardDescription>
          Decide what customers need to do to earn a chance to play, and how
          often.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Trigger</Label>
          <Select
            value={rule.eventType}
            onValueChange={(v) =>
              setRule((r) => ({
                ...r,
                eventType: v as GameEligibilityRuleInput["eventType"],
              }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(GAME_ELIGIBILITY_EVENT_LABELS).map(
                ([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3 rounded-lg border p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <Label className="text-sm">Cooldown between plays</Label>
              <p className="text-muted-foreground text-xs">
                Limit how often a single customer can play.
              </p>
            </div>
            <Switch
              checked={!!rule.intervalEnabled}
              onCheckedChange={(v) =>
                setRule((r) => ({ ...r, intervalEnabled: v }))
              }
            />
          </div>
          {rule.intervalEnabled && (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="space-y-1">
                <Label>Allow up to</Label>
                <Input
                  type="number"
                  min={1}
                  value={rule.maxAttemptsPerUserPerInterval ?? ""}
                  onChange={(e) =>
                    setRule((r) => ({
                      ...r,
                      maxAttemptsPerUserPerInterval:
                        e.target.value === "" ? null : Number(e.target.value),
                    }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Every</Label>
                <Input
                  type="number"
                  min={1}
                  value={rule.intervalValue ?? ""}
                  onChange={(e) =>
                    setRule((r) => ({
                      ...r,
                      intervalValue:
                        e.target.value === "" ? null : Number(e.target.value),
                    }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Unit</Label>
                <Select
                  value={rule.intervalUnit ?? "DAY"}
                  onValueChange={(v) =>
                    setRule((r) => ({
                      ...r,
                      intervalUnit: v as IntervalUnit,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(GAME_INTERVAL_UNIT_LABELS).map(
                      ([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <Label>Max total plays (all customers)</Label>
            <Input
              type="number"
              min={1}
              placeholder="No limit"
              value={rule.globalAttemptCap ?? ""}
              onChange={(e) =>
                setRule((r) => ({
                  ...r,
                  globalAttemptCap:
                    e.target.value === "" ? null : Number(e.target.value),
                }))
              }
            />
          </div>
          <div className="space-y-1">
            <Label>Only first N unique customers</Label>
            <Input
              type="number"
              min={1}
              placeholder="No limit"
              value={rule.firstNEligibleUsers ?? ""}
              onChange={(e) =>
                setRule((r) => ({
                  ...r,
                  firstNEligibleUsers:
                    e.target.value === "" ? null : Number(e.target.value),
                }))
              }
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button size="sm" loading={save.isPending} onClick={onSave}>
            Save
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
