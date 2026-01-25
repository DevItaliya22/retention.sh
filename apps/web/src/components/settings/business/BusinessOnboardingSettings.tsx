"use client";

import { WelcomeForm } from "@/components/forms/onboarding/WelcomeForm";
import { PageLayout, ScaffoldContainer } from "@/components/layouts";

export function BusinessOnboardingSettings() {
  return (
    <PageLayout
      // title="Complete your business setup"
      // subtitle="You don't have a business configured yet. Finish onboarding to start using your account."
      size="default"
      scaffoldSectionClassName="h-full w-full pt-2 pb-0"
    >
      <ScaffoldContainer>
        <div className="flex w-full justify-center">
          <div className="w-full max-w-4xl">
            <WelcomeForm onCompleted={() => {}} embedded />
          </div>
        </div>
      </ScaffoldContainer>
    </PageLayout>
  );
}
