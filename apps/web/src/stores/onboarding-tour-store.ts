import {
  ONBOARDING_TOUR_ACTIVE,
  ONBOARDING_TOUR_CARD_POS_SESSION_KEY,
  ONBOARDING_TOUR_COMPLETED,
  ONBOARDING_TOUR_STORAGE_KEY,
} from "@/lib/constants/onboarding-tour";
import { create } from "zustand";

export type OnboardingTourStep = {
  path: string;
  title: string;
  description: string;
};

export const ONBOARDING_TOUR_STEPS: OnboardingTourStep[] = [
  {
    path: "/settings/loyalty",
    title: "Loyalty program",
    description:
      "Choose how customers earn and redeem value—cashback, tiers, or points—and tune messaging and expiry.",
  },
  {
    path: "/settings/referral",
    title: "Referral program",
    description:
      "Reward people who bring friends. Configure benefits for new and existing customers and how you notify them.",
  },
  {
    path: "/settings/feedback",
    title: "Feedback",
    description:
      "Collect ratings and comments after visits. Adjust questions, channels, and follow-ups to match your brand.",
  },
  {
    path: "/settings/partners",
    title: "Partners",
    description:
      "Connect with other businesses: enable partner offers and manage requests and shared campaigns.",
  },
  {
    path: "/dashboard",
    title: "Dashboard",
    description:
      "Your home for performance and customer activity. Explore charts and insights as data grows.",
  },
];

function readTourStorage(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(ONBOARDING_TOUR_STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeTourCompleted(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      ONBOARDING_TOUR_STORAGE_KEY,
      ONBOARDING_TOUR_COMPLETED,
    );
  } catch {
    // ignore
  }
}

export function shouldAutoStartOnboardingTour(): boolean {
  return readTourStorage() === ONBOARDING_TOUR_ACTIVE;
}

export function stepIndexForPathname(pathname: string): number | null {
  const normalized = pathname.replace(/\/$/, "") || "/";
  const idx = ONBOARDING_TOUR_STEPS.findIndex(
    (s) => s.path === normalized || normalized.startsWith(`${s.path}/`),
  );
  return idx >= 0 ? idx : null;
}

type OnboardingTourState = {
  isActive: boolean;
  stepIndex: number;
  hydrateFromPath: (pathname: string) => void;
  start: () => void;
  setStepIndex: (index: number) => void;
  goNext: (push: (href: string) => void) => void;
  goPrev: (push: (href: string) => void) => void;
  end: () => void;
};

export const useOnboardingTourStore = create<OnboardingTourState>(
  (set, get) => ({
    isActive: false,
    stepIndex: 0,

    hydrateFromPath: (pathname) => {
      if (!get().isActive) return;
      const idx = stepIndexForPathname(pathname);
      if (idx !== null) set({ stepIndex: idx });
    },

    start: () => {
      if (typeof window === "undefined") return;
      if (readTourStorage() !== ONBOARDING_TOUR_ACTIVE) return;
      set({ isActive: true });
    },

    setStepIndex: (index) => {
      const max = ONBOARDING_TOUR_STEPS.length - 1;
      set({ stepIndex: Math.max(0, Math.min(max, index)) });
    },

    goNext: (push) => {
      const { stepIndex, isActive } = get();
      if (!isActive) return;
      const last = ONBOARDING_TOUR_STEPS.length - 1;
      if (stepIndex >= last) {
        writeTourCompleted();
        set({ isActive: false, stepIndex: 0 });
        return;
      }
      push(ONBOARDING_TOUR_STEPS[stepIndex + 1]!.path);
    },

    goPrev: (push) => {
      const { stepIndex, isActive } = get();
      if (!isActive || stepIndex <= 0) return;
      push(ONBOARDING_TOUR_STEPS[stepIndex - 1]!.path);
    },

    end: () => {
      writeTourCompleted();
      set({ isActive: false, stepIndex: 0 });
    },
  }),
);

/** From Settings (or anywhere): mark tour active, open store, go to first step. */
export function beginOnboardingTourManual(push: (href: string) => void): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      ONBOARDING_TOUR_STORAGE_KEY,
      ONBOARDING_TOUR_ACTIVE,
    );
    window.sessionStorage.removeItem(ONBOARDING_TOUR_CARD_POS_SESSION_KEY);
  } catch {
    // ignore
  }
  useOnboardingTourStore.setState({ isActive: true, stepIndex: 0 });
  push(ONBOARDING_TOUR_STEPS[0]!.path);
}
