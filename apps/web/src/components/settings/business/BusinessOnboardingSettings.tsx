"use client";

import { WelcomeForm } from "@/components/forms/onboarding/WelcomeForm";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@reelo/ui/components";

export function BusinessOnboardingSettings() {
  return (
    <Card className="border-none shadow-none">
      <CardHeader>
        <CardTitle>Complete your business setup</CardTitle>
        <CardDescription>
          You don&apos;t have a business configured yet. Finish onboarding to
          start using your account.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0 pt-4">
        <WelcomeForm onCompleted={() => {}} />
      </CardContent>
    </Card>
  );
}

