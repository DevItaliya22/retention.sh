import {
  ONBOARDING_TOUR_CARD_POS_SESSION_KEY,
  SETUP_CHECKLIST_CARD_POS_SESSION_KEY,
} from "@/lib/constants/onboarding-tour";

const PAD = 16;

export type TourCardPos = { left: number; top: number };

function loadPosForKey(storageKey: string): TourCardPos | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(storageKey);
    if (!raw) return null;
    const p = JSON.parse(raw) as unknown;
    if (
      p &&
      typeof p === "object" &&
      typeof (p as TourCardPos).left === "number" &&
      typeof (p as TourCardPos).top === "number"
    ) {
      return { left: (p as TourCardPos).left, top: (p as TourCardPos).top };
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function loadTourCardPos(): TourCardPos | null {
  return loadPosForKey(ONBOARDING_TOUR_CARD_POS_SESSION_KEY);
}

export function loadSetupChecklistCardPos(): TourCardPos | null {
  return loadPosForKey(SETUP_CHECKLIST_CARD_POS_SESSION_KEY);
}

function savePosForKey(storageKey: string, pos: TourCardPos): void {
  try {
    sessionStorage.setItem(storageKey, JSON.stringify(pos));
  } catch {
    /* ignore */
  }
}

export function saveTourCardPos(pos: TourCardPos): void {
  savePosForKey(ONBOARDING_TOUR_CARD_POS_SESSION_KEY, pos);
}

export function saveSetupChecklistCardPos(pos: TourCardPos): void {
  savePosForKey(SETUP_CHECKLIST_CARD_POS_SESSION_KEY, pos);
}

function clearPosForKey(storageKey: string): void {
  try {
    sessionStorage.removeItem(storageKey);
  } catch {
    /* ignore */
  }
}

export function clearTourCardPos(): void {
  clearPosForKey(ONBOARDING_TOUR_CARD_POS_SESSION_KEY);
}

export function clearSetupChecklistCardPos(): void {
  clearPosForKey(SETUP_CHECKLIST_CARD_POS_SESSION_KEY);
}

/** Snap card so its top-left lands in the nearest screen corner (with padding). */
export function snapTourCardToNearestCorner(rect: DOMRect): TourCardPos {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const w = rect.width;
  const h = rect.height;
  const cx = rect.left + w / 2;
  const cy = rect.top + h / 2;
  const candidates: TourCardPos[] = [
    { left: PAD, top: PAD },
    { left: vw - PAD - w, top: PAD },
    { left: PAD, top: vh - PAD - h },
    { left: vw - PAD - w, top: vh - PAD - h },
  ];
  let best = candidates[0]!;
  let bestD = Infinity;
  for (const c of candidates) {
    const tcx = c.left + w / 2;
    const tcy = c.top + h / 2;
    const d = (cx - tcx) ** 2 + (cy - tcy) ** 2;
    if (d < bestD) {
      bestD = d;
      best = c;
    }
  }
  return best;
}

export function clampTourCardPos(
  pos: TourCardPos,
  cardWidth: number,
  cardHeight: number,
): TourCardPos {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  return {
    left: Math.min(Math.max(PAD, pos.left), vw - PAD - cardWidth),
    top: Math.min(Math.max(PAD, pos.top), vh - PAD - cardHeight),
  };
}
