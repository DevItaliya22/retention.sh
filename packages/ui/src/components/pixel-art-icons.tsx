"use client";
import { motion } from "motion/react";
import React, { useEffect, useMemo, useState } from "react";

const GRID_SIZE = 5;
const TOTAL_PIXELS = GRID_SIZE * GRID_SIZE;

type PatternName = "tick" | "cross" | "heart" | "smiley" | "warning" | "plus";

const PATTERNS: Record<PatternName, number[]> = {
  tick: [15, 21, 17, 13, 9],
  cross: [0, 6, 12, 18, 24, 4, 8, 16, 20],
  heart: [1, 3, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 16, 17, 18, 22],
  smiley: [6, 8, 15, 21, 22, 23, 19],
  warning: [2, 7, 12, 22],
  plus: [2, 7, 10, 11, 12, 13, 14, 17, 22],
};

const PERIMETER_PATH = [
  0, 1, 2, 3, 4, 9, 14, 19, 24, 23, 22, 21, 20, 15, 10, 5,
];

export type PixelIconState =
  | "loading"
  | "success"
  | "error"
  | "warning"
  | "add"
  | "heart"
  | "smiley";

type PixelIconStatus = "loading" | "completed";

export interface PixelIconProps {
  state: PixelIconState;
  color?: string;
  inactiveColor?: string;
  speed?: number;
  className?: string;
}

const STATE_CONFIG: Record<
  PixelIconState,
  { pattern: PatternName; status: PixelIconStatus; color: string }
> = {
  loading: { pattern: "tick", status: "loading", color: "#3B82F6" },
  success: { pattern: "tick", status: "completed", color: "#22C55E" },
  error: { pattern: "cross", status: "completed", color: "#EF4444" },
  warning: { pattern: "warning", status: "completed", color: "#F59E0B" },
  add: { pattern: "plus", status: "completed", color: "#8B5CF6" },
  heart: { pattern: "heart", status: "completed", color: "#F43F5E" },
  smiley: { pattern: "smiley", status: "completed", color: "#F59E0B" },
};

export const PixelIcon: React.FC<PixelIconProps> = ({
  state,
  color,
  inactiveColor = "rgba(0,0,0,0.08)",
  speed = 1,
  className = "",
}) => {
  const [frame, setFrame] = useState(0);

  const config = STATE_CONFIG[state];
  const status = config.status;
  const patternName = config.pattern;
  const resolvedColor = color ?? config.color;

  useEffect(() => {
    if (status !== "loading") return;

    const resolvedSpeed = speed ?? 1;
    const delay = 80 / resolvedSpeed;

    const interval = window.setInterval(() => {
      setFrame((f) => (f + 1) % PERIMETER_PATH.length);
    }, delay);

    return () => clearInterval(interval);
  }, [status, speed]);

  const activePixels = useMemo(() => {
    if (status === "loading") {
      const trail = 4;
      const active: number[] = [];
      for (let i = 0; i < trail; i++) {
        const idxInPath =
          (frame - i + PERIMETER_PATH.length) % PERIMETER_PATH.length;
        const value = PERIMETER_PATH[idxInPath] ?? 0;
        active.push(value);
      }
      return active;
    }

    return PATTERNS[patternName] ?? [];
  }, [status, frame, patternName]);

  return (
    <motion.div
      className={`grid gap-px ${className}`}
      initial={false}
      animate={{
        rotate: status === "loading" ? 45 : 0,
      }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      style={{
        width: 16,
        height: 16,
        gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
        gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`,
      }}
    >
      {Array.from({ length: TOTAL_PIXELS }).map((_, i) => {
        const isActive = activePixels.includes(i);
        const innerRotate = status === "loading" ? 0 : 45;

        return (
          <motion.div
            key={i}
            initial={false}
            animate={{
              backgroundColor: isActive ? resolvedColor : inactiveColor,
              rotate: innerRotate,
              scale: isActive ? 1 : 0.8,
            }}
            transition={{ duration: 0.2 }}
            className="h-full w-full"
          />
        );
      })}
    </motion.div>
  );
};
