/** localStorage: "active" = tour should run (after onboarding or Settings → Start tutorial); "completed" = finished/skipped */
export const ONBOARDING_TOUR_STORAGE_KEY = "reelo:onboardingTour";

export const ONBOARDING_TOUR_ACTIVE = "active";
export const ONBOARDING_TOUR_COMPLETED = "completed";

/** sessionStorage: JSON `{ left, top }` for draggable tour card while tour is active */
export const ONBOARDING_TOUR_CARD_POS_SESSION_KEY =
  "reelo:onboardingTourCardPos";

/** sessionStorage: JSON `{ left, top }` for draggable setup checklist widget */
export const SETUP_CHECKLIST_CARD_POS_SESSION_KEY =
  "reelo:setupChecklistCardPos";
