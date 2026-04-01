"use client";

import { motion } from "framer-motion";
import type { RewardStage } from "../common/types";

interface VisitProgressionCardProps {
  stages: RewardStage[];
  currentPoints: number;
  nextStage: {
    rewardName: string;
    pointsRequired: number;
    pointsNeeded: number;
  } | null;
  accentColor?: string;
}

export function VisitProgressionCard({
  stages,
  currentPoints,
  nextStage,
  accentColor,
}: VisitProgressionCardProps) {
  if (stages.length === 0) return null;

  const displayStages = stages.slice(0, 4);
  const maxPoints =
    displayStages[displayStages.length - 1]?.pointsRequired ?? 100;
  const progressPct =
    maxPoints > 0 ? Math.min(100, (currentPoints / maxPoints) * 100) : 0;

  return (
    <div
      className={
        accentColor ? "rounded-xl border p-5" : "bg-card rounded-xl border p-5"
      }
      style={
        accentColor
          ? {
              backgroundColor: `${accentColor}0A`,
              borderColor: `${accentColor}22`,
            }
          : undefined
      }
    >
      <div className="mb-6 flex items-center justify-between">
        <p className="text-muted-foreground text-[10px] font-medium tracking-[0.2em] uppercase">
          Reward Progression
        </p>
        <p className="text-muted-foreground text-xs italic">
          {nextStage ? `Next: ${nextStage.rewardName}` : "All rewards unlocked"}
        </p>
      </div>

      <div className="relative pt-6 pb-4">
        <div className="mb-8 flex justify-between px-1">
          {displayStages.map((stage, index) => {
            const reached = currentPoints >= stage.pointsRequired;
            const alignment =
              index === 0
                ? "text-left"
                : index === displayStages.length - 1
                  ? "text-right"
                  : "text-center";
            return (
              <div
                key={stage.id}
                className={`max-w-[80px] space-y-1 ${alignment}`}
              >
                <p
                  className={`truncate text-[10px] leading-tight ${
                    reached
                      ? `font-medium ${accentColor ? "" : "text-primary"}`
                      : "text-muted-foreground/60"
                  }`}
                  style={
                    reached && accentColor ? { color: accentColor } : undefined
                  }
                >
                  {stage.rewardName}
                </p>
                <p
                  className={`text-xs font-semibold tabular-nums ${
                    reached
                      ? accentColor
                        ? ""
                        : "text-primary"
                      : "text-foreground"
                  }`}
                  style={
                    reached && accentColor ? { color: accentColor } : undefined
                  }
                >
                  {stage.pointsRequired} pts
                </p>
              </div>
            );
          })}
        </div>

        <div className="bg-border relative h-px w-full">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 1.2, ease: "circOut" }}
            className={
              accentColor
                ? "absolute inset-y-0 left-0"
                : "via-primary/30 to-primary absolute inset-y-0 left-0 bg-gradient-to-r from-transparent"
            }
            style={
              accentColor
                ? {
                    backgroundImage: `linear-gradient(to right, transparent, ${accentColor}50, ${accentColor})`,
                  }
                : undefined
            }
          >
            <div
              className={
                accentColor
                  ? "absolute top-1/2 right-0 size-2.5 -translate-y-1/2 rounded-full shadow-[0_0_12px]"
                  : "bg-primary shadow-primary/40 absolute top-1/2 right-0 size-2.5 -translate-y-1/2 rounded-full shadow-[0_0_12px]"
              }
              style={
                accentColor
                  ? {
                      backgroundColor: accentColor,
                      boxShadow: `0 0 12px ${accentColor}66`,
                    }
                  : undefined
              }
            />
          </motion.div>
        </div>

        <div className="mt-5 flex items-start justify-between">
          <p className="text-muted-foreground text-xs">0 pts</p>
          {nextStage ? (
            <div className="space-y-0.5 text-center">
              <p className="text-sm font-normal">
                {nextStage.pointsNeeded} more pts to {nextStage.rewardName}
              </p>
            </div>
          ) : (
            <div className="space-y-0.5 text-center">
              <p className="text-sm font-normal">All rewards unlocked</p>
            </div>
          )}
          <p className="text-muted-foreground text-xs">{maxPoints} pts</p>
        </div>
      </div>
    </div>
  );
}
