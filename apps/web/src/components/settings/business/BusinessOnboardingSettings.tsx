"use client";

import { WelcomeForm } from "@/components/forms/onboarding/WelcomeForm";

// this is embedded form so we don't need to wrap it in a page layout
export function BusinessOnboardingSettings() {
  return <WelcomeForm onCompleted={() => {}} embedded />;
}
