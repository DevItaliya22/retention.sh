import { Banknote, Check, Gift, Lock, Percent } from "lucide-react";
import type { RewardStage } from "./types";

interface RewardOffersGridProps {
  stages: RewardStage[];
  currentPoints: number;
  accentColor?: string;
}

function getRewardIcon(type: string) {
  switch (type) {
    case "PERCENTAGE_DISCOUNT":
      return Percent;
    case "CASH_DISCOUNT":
      return Banknote;
    case "FREE_ITEM":
    default:
      return Gift;
  }
}

function getRewardDescription(stage: RewardStage): string {
  switch (stage.rewardType) {
    case "PERCENTAGE_DISCOUNT":
      return `${stage.percentageValue}% discount`;
    case "CASH_DISCOUNT":
      return `₹${stage.cashAmount} cashback`;
    case "FREE_ITEM":
      return stage.freeItemName || "Free item";
    default:
      return stage.rewardName;
  }
}

export function RewardOffersGrid({
  stages,
  currentPoints,
  accentColor,
}: RewardOffersGridProps) {
  if (stages.length === 0) return null;
  const ac = accentColor;

  return (
    <div className="space-y-3">
      <h3 className="px-1 text-sm font-semibold">Available Rewards</h3>
      <div className="grid grid-cols-2 gap-3">
        {stages.map((stage) => {
          const Icon = getRewardIcon(stage.rewardType);
          const available = stage.canRedeem;
          return (
            <div
              key={stage.id}
              className={
                ac
                  ? "relative rounded-xl border p-3.5 transition-colors"
                  : `relative rounded-xl border p-3.5 transition-colors ${
                      available
                        ? "border-primary/30 bg-primary/5"
                        : "border-border bg-white opacity-75"
                    }`
              }
              style={
                ac
                  ? available
                    ? { borderColor: `${ac}40`, backgroundColor: `${ac}10` }
                    : {
                        borderColor: `${ac}15`,
                        backgroundColor: `${ac}06`,
                        opacity: 0.75,
                      }
                  : undefined
              }
            >
              <div className="mb-2 flex items-start justify-between">
                <div
                  className={
                    ac
                      ? "flex size-8 items-center justify-center rounded-lg"
                      : `flex size-8 items-center justify-center rounded-lg ${
                          available
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground bg-white"
                        }`
                  }
                  style={
                    ac
                      ? available
                        ? { backgroundColor: `${ac}18`, color: ac }
                        : { backgroundColor: `${ac}0A`, color: `${ac}80` }
                      : undefined
                  }
                >
                  <Icon className="size-4" />
                </div>
                {available ? (
                  <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                    <Check className="size-3" /> Available
                  </span>
                ) : (
                  <span className="text-muted-foreground flex items-center gap-1 text-[10px] font-medium">
                    <Lock className="size-3" />{" "}
                    {stage.pointsRequired - currentPoints} more
                  </span>
                )}
              </div>
              <p className="text-sm leading-tight font-medium">
                {stage.rewardName}
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                {getRewardDescription(stage)}
              </p>
              <div className="mt-2 text-xs tabular-nums">
                <span className="font-semibold">{stage.pointsRequired}</span>{" "}
                <span className="text-muted-foreground">pts required</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
