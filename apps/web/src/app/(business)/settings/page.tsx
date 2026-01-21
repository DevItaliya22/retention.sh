import { getBusinessSettings } from "@/lib/actions/business-settings";
import { SettingsForm } from "@/components/forms/settings/business/SettingsForm";
import { PageLayout } from "@/components/layouts";

export default async function SettingsPage() {
  const data = await getBusinessSettings();

  return (
    <PageLayout 
        title="Settings" 
        subtitle="Manage your business configuration and team members."
    >
      <div className="container max-w-5xl py-6 mx-auto">
        <SettingsForm initialData={data} />
      </div>
    </PageLayout>
  );
}
