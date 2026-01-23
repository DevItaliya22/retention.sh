import { WelcomeForm } from "@/components/forms/onboarding/WelcomeForm";
import { generateRouteMetadata } from "@/lib/utils/route-metadata";
import type { Metadata } from "next";

export const metadata: Metadata = generateRouteMetadata("/welcome");

export default function WelcomePage() {
  return <WelcomeForm />;
}
