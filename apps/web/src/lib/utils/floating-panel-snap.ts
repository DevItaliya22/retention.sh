import { animate, type MotionValue } from "framer-motion";

/** Seconds — subtle snap after drag release */
export const FLOATING_PANEL_SNAP_DURATION_SEC = 0.26;

type FlushSync = (fn: () => void) => void;

/**
 * Commit `snapped` as the new CSS top/left base, then tween motion x/y from the
 * current visual offset so the panel glides to the corner instead of jumping.
 */
export function animateSnapToCorner(
  rect: DOMRect,
  snapped: { left: number; top: number },
  setBase: (p: { left: number; top: number }) => void,
  x: MotionValue<number>,
  y: MotionValue<number>,
  flushSync: FlushSync,
  onComplete?: () => void,
): void {
  const ox = rect.left - snapped.left;
  const oy = rect.top - snapped.top;
  flushSync(() => {
    setBase(snapped);
  });
  x.set(ox);
  y.set(oy);
  const ease = [0.22, 1, 0.36, 1] as const;
  const opts = {
    duration: FLOATING_PANEL_SNAP_DURATION_SEC,
    ease,
  };
  void Promise.all([
    animate(x, 0, opts).finished,
    animate(y, 0, opts).finished,
  ]).then(() => {
    x.set(0);
    y.set(0);
    onComplete?.();
  });
}
