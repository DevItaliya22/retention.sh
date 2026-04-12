"use client";

import { SetupChecklistSummary } from "@/components/onboarding/SetupChecklistSummary";
import { useCurrentBusiness } from "@/hooks/business/useCurrentBusiness";
import { animateSnapToCorner } from "@/lib/utils/floating-panel-snap";
import {
  clampTourCardPos,
  clearSetupChecklistCardPos,
  loadSetupChecklistCardPos,
  saveSetupChecklistCardPos,
  snapTourCardToNearestCorner,
  type TourCardPos,
} from "@/lib/utils/onboarding-tour-card-layout";
import type { SetupChecklistPayload } from "@/lib/utils/setup-checklist";
import { useOnboardingTourStore } from "@/stores/onboarding-tour-store";
import { Button } from "@reelo/ui/components";
import { motion, useDragControls, useMotionValue } from "framer-motion";
import { GripVertical, X } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";

const WIDGET_WIDTH = "min(calc(100vw - 2rem), 320px)";

type SetupChecklistWidgetProps = {
  dismissed: boolean;
  onDismiss: () => void;
};

type DraggableProps = {
  checklist: SetupChecklistPayload;
  onDismiss: () => void;
};

function SetupChecklistWidgetDraggable({
  checklist,
  onDismiss,
}: DraggableProps) {
  const ref = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const [layoutReady, setLayoutReady] = useState(false);
  const [base, setBase] = useState<TourCardPos>({ left: 0, top: 0 });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const w = r.width;
    const h = r.height;
    if (w < 1 || h < 1) return;

    const p = 16;
    const saved = loadSetupChecklistCardPos();
    if (saved) {
      setBase(clampTourCardPos(saved, w, h));
    } else {
      setBase({
        left: window.innerWidth - p - w,
        top: window.innerHeight - p - h,
      });
    }
    setLayoutReady(true);
  }, []);

  useEffect(() => {
    if (!layoutReady) return;
    const onResize = () => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setBase((prev) => clampTourCardPos(prev, r.width, r.height));
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [layoutReady]);

  const handleDragEnd = () => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const snapped = snapTourCardToNearestCorner(rect);
    animateSnapToCorner(rect, snapped, setBase, x, y, flushSync, () => {
      saveSetupChecklistCardPos(snapped);
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
        zIndex: 50,
        width: WIDGET_WIDTH,
        maxWidth: "calc(100vw - 2rem)",
        x,
        y,
        ...(layoutReady
          ? { left: base.left, top: base.top, right: "auto", bottom: "auto" }
          : { right: 16, bottom: 16, left: "auto", top: "auto" }),
      }}
      className="border-border bg-card/95 supports-[backdrop-filter]:bg-card/80 rounded-xl border shadow-lg backdrop-blur-sm"
      role="complementary"
      aria-label="Setup checklist"
    >
      <div className="border-border/60 bg-muted/40 flex touch-none items-start gap-1 rounded-t-[inherit] border-b px-2 py-2 sm:px-3">
        <div
          className="min-w-0 flex-1 cursor-grab rounded-md px-1 py-0.5 active:cursor-grabbing"
          onPointerDown={(e) => dragControls.start(e)}
        >
          <div className="flex items-start gap-2">
            <GripVertical
              className="text-muted-foreground mt-0.5 size-4 shrink-0"
              aria-hidden
            />
            <div>
              <p className="text-foreground text-sm font-semibold tracking-tight">
                Set up for success
              </p>
              <p className="text-muted-foreground text-xs">
                Finish these to get the most from Reelo
              </p>
            </div>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-muted-foreground size-8 shrink-0"
          onClick={onDismiss}
          onPointerDown={(e) => e.stopPropagation()}
          aria-label="Close setup checklist for this session"
        >
          <X className="size-4" />
        </Button>
      </div>
      <div className="p-4 pt-3">
        <SetupChecklistSummary checklist={checklist} />
      </div>
    </motion.div>
  );
}

export function SetupChecklistWidget({
  dismissed,
  onDismiss,
}: SetupChecklistWidgetProps) {
  const tourActive = useOnboardingTourStore((s) => s.isActive);
  const { data, isLoading } = useCurrentBusiness();
  const business = data?.business;
  const checklist = data?.setupChecklist;

  useEffect(() => {
    if (dismissed) {
      clearSetupChecklistCardPos();
    }
  }, [dismissed]);

  if (tourActive || dismissed || isLoading || !business || !checklist) {
    return null;
  }
  if (checklist.completedCount >= checklist.total) return null;

  return (
    <SetupChecklistWidgetDraggable
      checklist={checklist}
      onDismiss={onDismiss}
    />
  );
}
