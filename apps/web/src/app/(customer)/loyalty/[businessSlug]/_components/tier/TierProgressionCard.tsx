"use client";

import { motion } from "framer-motion";
import type { TierInfo } from "../common/types";

interface TierProgressionCardProps {
  tierInfo: TierInfo;
  currencySymbol?: string;
  accentColor?: string;
}

export function TierProgressionCard({
  tierInfo,
  currencySymbol = "₹",
  accentColor,
}: TierProgressionCardProps) {
  const { currentTier, allTiers, lifetimeSpend, nextTier, spendToNextTier } =
    tierInfo;
  const currentTierName = currentTier?.name ?? "";

  const topTier = allTiers[allTiers.length - 1];
  const totalRange =
    topTier?.minLifetimeSpend && topTier.minLifetimeSpend > 0
      ? topTier.minLifetimeSpend
      : 50000;
  const progressPct = Math.min(100, (lifetimeSpend / totalRange) * 100);

  const displayTiers = allTiers.slice(0, 4);

  return (
    <div
      className={
        accentColor ? "rounded-xl border p-5" : "rounded-xl border bg-white p-5"
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
          Tier Progression
        </p>
        <p className="text-muted-foreground text-xs italic">
          {nextTier
            ? `Next: ${nextTier.name} (${nextTier.cashbackPercentage}% Cashback)`
            : "Highest tier unlocked"}
        </p>
      </div>

      <div className="relative pt-6 pb-4">
        <div className="mb-8 flex justify-between px-1">
          {displayTiers.map((tier, index) => {
            const active = tier.name === currentTierName;
            const alignment =
              index === 0
                ? "text-left"
                : index === displayTiers.length - 1
                  ? "text-right"
                  : "text-center";
            return (
              <div key={tier.name} className={`space-y-1 ${alignment}`}>
                <p
                  className={`text-xs tracking-[0.14em] uppercase ${
                    active
                      ? `font-medium ${accentColor ? "" : "text-amber-600"}`
                      : "text-muted-foreground/60"
                  }`}
                  style={
                    active && accentColor ? { color: accentColor } : undefined
                  }
                >
                  {tier.name}
                </p>
                <p
                  className={`text-sm font-semibold ${
                    active
                      ? accentColor
                        ? ""
                        : "text-amber-600"
                      : "text-foreground"
                  }`}
                  style={
                    active && accentColor ? { color: accentColor } : undefined
                  }
                >
                  {tier.cashbackPercentage}%
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
                : "absolute inset-y-0 left-0 bg-gradient-to-r from-transparent via-amber-500/30 to-amber-500"
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
                  : "absolute top-1/2 right-0 size-2.5 -translate-y-1/2 rounded-full bg-amber-500 shadow-[0_0_12px] shadow-amber-500/40"
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
          <p className="text-muted-foreground text-xs">{currencySymbol}0</p>
          {nextTier && spendToNextTier != null && spendToNextTier > 0 ? (
            <div className="space-y-0.5 text-center">
              <p className="text-sm font-normal">
                {currencySymbol}
                {spendToNextTier.toLocaleString("en-IN")} more to reach{" "}
                {nextTier.name}
              </p>
              <p className="text-muted-foreground text-xs">
                Unlock {nextTier.cashbackPercentage}% cashback
              </p>
            </div>
          ) : (
            <div className="space-y-0.5 text-center">
              <p className="text-sm font-normal">
                You&apos;ve reached the highest tier
              </p>
              <p className="text-muted-foreground text-xs">
                Enjoy your best cashback rate
              </p>
            </div>
          )}
          <p className="text-muted-foreground text-xs">
            {currencySymbol}
            {totalRange.toLocaleString("en-IN")}
          </p>
        </div>
      </div>
    </div>
  );
}
