import { WelcomeForm } from "@/components/forms/onboarding/WelcomeForm";
import { SettingsPageContent } from "@/components/forms/settings/setting-client";

import { getBusinessSettings } from "@/lib/actions/business-settings";

export default async function SettingsPage() {
  const data = await getBusinessSettings();

  if (!data) {
    return <WelcomeForm />;
  }

  return <SettingsPageContent initialData={data} />;
}
