"use client";

import { animateSnapToCorner } from "@/lib/utils/floating-panel-snap";
import {
  clampTourCardPos,
  clearTourCardPos,
  loadTourCardPos,
  saveTourCardPos,
  snapTourCardToNearestCorner,
  type TourCardPos,
} from "@/lib/utils/onboarding-tour-card-layout";
import {
  ONBOARDING_TOUR_STEPS,
  shouldAutoStartOnboardingTour,
  useOnboardingTourStore,
} from "@/stores/onboarding-tour-store";
import { Button } from "@reelo/ui/components";
import { motion, useDragControls, useMotionValue } from "framer-motion";
import { GripVertical } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";

const CARD_WIDTH = "min(calc(100vw - 2rem), 400px)";

export function OnboardingTourHost() {
  const pathname = usePathname();
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const isActive = useOnboardingTourStore((s) => s.isActive);
  const stepIndex = useOnboardingTourStore((s) => s.stepIndex);
  const start = useOnboardingTourStore((s) => s.start);
  const hydrateFromPath = useOnboardingTourStore((s) => s.hydrateFromPath);
  const goNext = useOnboardingTourStore((s) => s.goNext);
  const goPrev = useOnboardingTourStore((s) => s.goPrev);
  const end = useOnboardingTourStore((s) => s.end);

  const [layoutReady, setLayoutReady] = useState(false);
  const [base, setBase] = useState<TourCardPos>({ left: 0, top: 0 });

  useEffect(() => {
    if (shouldAutoStartOnboardingTour()) {
      start();
    }
  }, [start]);

  useEffect(() => {
    if (isActive) {
      hydrateFromPath(pathname);
    }
  }, [pathname, isActive, hydrateFromPath]);

  useLayoutEffect(() => {
    if (!isActive) {
      setLayoutReady(false);
      clearTourCardPos();
      x.set(0);
      y.set(0);
      return;
    }

    const el = ref.current;
    if (!el) return;

    const r = el.getBoundingClientRect();
    const w = r.width;
    const h = r.height;
    if (w < 1 || h < 1) return;

    const p = 24;
    const saved = loadTourCardPos();
    if (saved) {
      setBase(clampTourCardPos(saved, w, h));
    } else {
      setBase({
        left: window.innerWidth - p - w,
        top: window.innerHeight - p - h,
      });
    }
    setLayoutReady(true);
  }, [isActive]);

  useEffect(() => {
    if (!isActive || !layoutReady) return;

    const onResize = () => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setBase((prev) => clampTourCardPos(prev, r.width, r.height));
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [isActive, layoutReady]);

  if (!isActive) return null;

  const step = ONBOARDING_TOUR_STEPS[stepIndex];
  if (!step) return null;

  const isLast = stepIndex >= ONBOARDING_TOUR_STEPS.length - 1;
  const isFirst = stepIndex <= 0;
  const stepLabel = `${stepIndex + 1} / ${ONBOARDING_TOUR_STEPS.length}`;

  const handleDragEnd = () => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const snapped = snapTourCardToNearestCorner(rect);
    animateSnapToCorner(rect, snapped, setBase, x, y, flushSync, () => {
      saveTourCardPos(snapped);
    });
  };

  return (
    <motion.div
      ref={ref}
      drag
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      onDragEnd={handleDragEnd}
      style={{
        position: "fixed",
        zIndex: 101,
        width: CARD_WIDTH,
        maxWidth: "calc(100vw - 2rem)",
        x,
        y,
        ...(layoutReady
          ? { left: base.left, top: base.top, right: "auto", bottom: "auto" }
          : { right: 24, bottom: 24, left: "auto", top: "auto" }),
      }}
      className="border-border bg-card pointer-events-auto rounded-xl border shadow-xl"
      role="dialog"
      aria-label="Platform tour"
      aria-live="polite"
    >
      <div
        className="border-border/60 bg-muted/50 flex cursor-grab touch-none items-center gap-2 rounded-t-[inherit] border-b px-3 py-2 active:cursor-grabbing"
        onPointerDown={(e) => dragControls.start(e)}
      >
        <GripVertical
          className="text-muted-foreground size-4 shrink-0"
          aria-hidden
        />
        <span className="text-muted-foreground text-xs font-medium">
          Platform tour
        </span>
        <span className="text-muted-foreground/80 ml-auto text-[11px] tabular-nums">
          {stepLabel}
        </span>
      </div>

      <div className="p-4 pt-3">
        <h2 className="text-foreground text-base font-semibold tracking-tight">
          {step.title}
        </h2>
        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
          {step.description}
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isFirst}
            onClick={() => goPrev((href) => router.push(href))}
          >
            Previous
          </Button>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => end()}
            >
              Skip tour
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => goNext((href) => router.push(href))}
            >
              {isLast ? "Finish" : "Next"}
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
