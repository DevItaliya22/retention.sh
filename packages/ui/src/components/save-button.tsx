"use client";

import { cn } from "@reelo/ui/lib/utils";
import { Check, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { Button } from "./button";

export type SaveButtonStatus = "idle" | "loading" | "success";

export interface SaveButtonProps {
  onSave?: () => void | Promise<void>;
  /** Custom labels per status */
  labels?: {
    idle?: string;
    loading?: string;
    success?: string;
  };
  /** Duration in ms to show success before resetting to idle */
  successDuration?: number;
  /** Duration in ms to simulate loading (used when onSave is not provided) */
  loadingDuration?: number;
  className?: string;
  disabled?: boolean;
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  size?: "default" | "sm" | "lg" | "xl" | "icon" | "xs";
}

const DEFAULT_LABELS = {
  idle: "Save",
  loading: "Saving",
  success: "Saved",
} as const;

export function SaveButton({
  onSave,
  labels = {},
  successDuration = 2000,
  loadingDuration = 2500,
  className,
  disabled = false,
  variant = "default",
  size = "default",
}: SaveButtonProps) {
  const [status, setStatus] = useState<SaveButtonStatus>("idle");

  const textLabels = useMemo(
    () => ({ ...DEFAULT_LABELS, ...labels }),
    [labels],
  );

  const text = useMemo(() => {
    switch (status) {
      case "idle":
        return textLabels.idle ?? "Save";
      case "loading":
        return textLabels.loading ?? "Saving";
      case "success":
        return textLabels.success ?? "Saved";
    }
  }, [status, textLabels]);

  const handleClick = async () => {
    if (status !== "idle") return;
    setStatus("loading");
    try {
      if (onSave) {
        await onSave();
      } else {
        await new Promise((r) => setTimeout(r, loadingDuration));
      }
      setStatus("success");
      setTimeout(() => setStatus("idle"), successDuration);
    } catch {
      setStatus("idle");
    }
  };

  const isDisabled = disabled || status !== "idle";

  return (
    <div className="relative inline-flex font-sans">
      <Button
        onClick={handleClick}
        disabled={isDisabled}
        variant={variant}
        size={size}
        className={cn(
          "relative rounded-md transition-all duration-300 disabled:opacity-100",
          status !== "idle" &&
            "border-muted bg-muted text-muted-foreground hover:bg-muted hover:text-muted-foreground cursor-not-allowed shadow-sm",
          className,
        )}
      >
        <span className="flex items-center justify-center">
          <AnimatePresence mode="popLayout" initial={false}>
            {text.split("").map((char, i) => (
              <motion.span
                key={`${char}-${i}`}
                layout
                initial={{ opacity: 0, scale: 0, filter: "blur(4px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 0, filter: "blur(4px)" }}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 30,
                  mass: 1,
                }}
                className={cn("inline-block", char === " " && "min-w-[0.25em]")}
              >
                {char === " " ? "\u00A0" : char}
              </motion.span>
            ))}
          </AnimatePresence>
        </span>
      </Button>

      {/* Status indicator */}
      <div className="pointer-events-none absolute -top-1 -right-1 z-10">
        <AnimatePresence mode="wait">
          {status !== "idle" && (
            <motion.div
              initial={{
                opacity: 0,
                scale: 0,
                x: -8,
                filter: "blur(4px)",
              }}
              animate={{
                opacity: 1,
                scale: 1,
                x: 0,
                filter: "blur(0px)",
              }}
              exit={{
                opacity: 0,
                scale: 0,
                x: -8,
                filter: "blur(4px)",
              }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 20,
              }}
              className={cn(
                "ring-background flex size-5 overflow-visible rounded-md ring-2",
                status === "success"
                  ? "bg-primary text-primary-foreground ring-muted"
                  : "bg-muted text-muted-foreground ring-muted",
              )}
            >
              <AnimatePresence mode="popLayout">
                {status === "loading" && (
                  <motion.div
                    key="loader"
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <Loader2 className="size-3.5 animate-spin" />
                  </motion.div>
                )}
                {status === "success" && (
                  <motion.div
                    key="check"
                    initial={{
                      scale: 0,
                      opacity: 0,
                      filter: "blur(4px)",
                    }}
                    animate={{
                      scale: 1,
                      opacity: 1,
                      filter: "blur(0px)",
                    }}
                    exit={{
                      scale: 0,
                      opacity: 0,
                      filter: "blur(4px)",
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 25,
                    }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <Check className="size-3.5" strokeWidth={2.5} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
