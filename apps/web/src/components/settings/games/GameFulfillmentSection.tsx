"use client";

import {
  useUpdateGameFulfillmentMutation,
  type GameCampaignDetail,
} from "@/hooks/games/useGameCampaigns";
import { GAME_FULFILLMENT_MODE_LABELS } from "@/lib/constants/games";
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
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

interface Props {
  campaignId: string;
  fulfillmentMode: GameCampaignDetail["fulfillmentMode"];
  drawAt: string | null;
}

function toLocalInputValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function GameFulfillmentSection({
  campaignId,
  fulfillmentMode,
  drawAt,
}: Props) {
  const save = useUpdateGameFulfillmentMutation();
  const [mode, setMode] =
    useState<GameCampaignDetail["fulfillmentMode"]>(fulfillmentMode);
  const [drawLocal, setDrawLocal] = useState<string>(toLocalInputValue(drawAt));

  useEffect(() => {
    setMode(fulfillmentMode);
    setDrawLocal(toLocalInputValue(drawAt));
  }, [fulfillmentMode, drawAt]);

  const drawIso = useMemo(() => {
    if (mode !== "SCHEDULED_DRAW") return null;
    if (!drawLocal) return null;
    const d = new Date(drawLocal);
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString();
  }, [drawLocal, mode]);

  const onSave = async () => {
    if (mode === "SCHEDULED_DRAW" && !drawIso) {
      toast.error("Pick a draw date & time");
      return;
    }
    try {
      await save.mutateAsync({
        id: campaignId,
        fulfillmentMode: mode,
        drawAt: drawIso,
      });
      toast.success("Delivery settings saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Delivery</CardTitle>
        <CardDescription>
          When should players find out what they won?
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Mode</Label>
          <Select
            value={mode}
            onValueChange={(v) =>
              setMode(v as GameCampaignDetail["fulfillmentMode"])
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(GAME_FULFILLMENT_MODE_LABELS).map(
                ([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>
          <p className="text-muted-foreground text-xs">
            {mode === "INSTANT"
              ? "Players see the prize immediately after they play."
              : "Players enter now; the result is announced at the scheduled draw time."}
          </p>
        </div>

        {mode === "SCHEDULED_DRAW" && (
          <div className="space-y-1">
            <Label>Draw date & time</Label>
            <Input
              type="datetime-local"
              value={drawLocal}
              onChange={(e) => setDrawLocal(e.target.value)}
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
