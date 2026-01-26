"use client";

import { SettingsFieldGroup } from "@/components/common/settings/SettingsFieldGroup";
import { PageLayout, ScaffoldContainer } from "@/components/layouts";
import type { CurrentBusiness } from "@/hooks/business/useCurrentBusiness";
import { useUpdateBusiness } from "@/hooks/business/useCurrentBusiness";

interface BusinessExistingSettingsProps {
  business: CurrentBusiness;
}

export function BusinessExistingSettings({
  business,
}: BusinessExistingSettingsProps) {
  const { mutateAsync: updateBusiness } = useUpdateBusiness();

  const handleUpdateBasicInfo = async (values: Record<string, string>) => {
    try {
      await updateBusiness({
        name: values.name,
        defaultPointsName: business.defaultPointsName,
        defaultCurrencySymbol: business.defaultCurrencySymbol,
        defaultCurrencyCode: business.defaultCurrencyCode,
        defaultBranding: business.defaultBranding
          ? {
              logo: business.defaultBranding.logo ?? null,
              themeColor: business.defaultBranding.themeColor ?? null,
              textColor: business.defaultBranding.textColor ?? null,
              bannerImage: business.defaultBranding.bannerImage ?? null,
              header: business.defaultBranding.header ?? null,
              subtitle: business.defaultBranding.subtitle ?? null,
            }
          : undefined,
      });
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to update business information",
      };
    }
  };

  const handleUpdateCurrencySettings = async (
    values: Record<string, string>,
  ) => {
    try {
      await updateBusiness({
        name: business.name,
        defaultPointsName: values.defaultPointsName,
        defaultCurrencySymbol: values.defaultCurrencySymbol,
        defaultCurrencyCode: values.defaultCurrencyCode,
        defaultBranding: business.defaultBranding
          ? {
              logo: business.defaultBranding.logo ?? null,
              themeColor: business.defaultBranding.themeColor ?? null,
              textColor: business.defaultBranding.textColor ?? null,
              bannerImage: business.defaultBranding.bannerImage ?? null,
              header: business.defaultBranding.header ?? null,
              subtitle: business.defaultBranding.subtitle ?? null,
            }
          : undefined,
      });
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to update currency settings",
      };
    }
  };

  const handleUpdateBranding = async (values: Record<string, string>) => {
    try {
      await updateBusiness({
        name: business.name,
        defaultPointsName: business.defaultPointsName,
        defaultCurrencySymbol: business.defaultCurrencySymbol,
        defaultCurrencyCode: business.defaultCurrencyCode,
        defaultBranding: {
          logo: values.logo || null,
          themeColor: values.themeColor || null,
          textColor: values.textColor || null,
          bannerImage: values.bannerImage || null,
          header: values.header || null,
          subtitle: values.subtitle || null,
        },
      });
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to update branding",
      };
    }
  };

  return (
    <PageLayout
      size="default"
      scaffoldSectionClassName="h-full w-full pt-2 pb-0"
    >
      <ScaffoldContainer>
        <div className="space-y-6">
          <SettingsFieldGroup
            title="Basic Information"
            description="Manage your business name and identifier"
            fields={[
              {
                name: "name",
                label: "Business Name",
                placeholder: "e.g., Acme Store",
                helpText: "This is the primary name for your business.",
              },
              {
                name: "slug",
                label: "Business Slug",
                placeholder: "reelo.in/your-slug",
                helpText: "This field is read-only.",
                disabled: true,
              },
            ]}
            defaultValues={{
              name: business.name,
              slug: `reelo.in/${business.slug}`,
            }}
            onSubmit={handleUpdateBasicInfo}
          />

          <SettingsFieldGroup
            title="Points & Currency"
            description="Configure your loyalty points system and currency settings"
            fields={[
              {
                name: "defaultPointsName",
                label: "Points Name",
                placeholder: "e.g., Points",
                helpText:
                  "This will be displayed to customers when they earn or redeem points.",
              },
              {
                name: "defaultCurrencySymbol",
                label: "Currency Symbol",
                placeholder: "e.g., ₹",
                helpText: "Common examples: ₹, $, €, £",
              },
              {
                name: "defaultCurrencyCode",
                label: "Currency Code",
                placeholder: "e.g., INR",
                helpText: "Common examples: INR, USD, EUR, GBP",
              },
            ]}
            defaultValues={{
              defaultPointsName: business.defaultPointsName,
              defaultCurrencySymbol: business.defaultCurrencySymbol,
              defaultCurrencyCode: business.defaultCurrencyCode,
            }}
            onSubmit={handleUpdateCurrencySettings}
          />

          <SettingsFieldGroup
            title="Branding"
            description="Customize your business appearance and messaging"
            fields={[
              {
                name: "logo",
                label: "Logo URL",
                placeholder: "https://...",
                helpText: "Enter a valid image URL for your business logo.",
              },
              {
                name: "themeColor",
                label: "Theme Color",
                placeholder: "#7c3aed",
                helpText: "Enter a hex color code (e.g., #7c3aed).",
              },
              {
                name: "textColor",
                label: "Text Color",
                placeholder: "#ffffff",
                helpText: "Enter a hex color code for text (e.g., #ffffff).",
              },
              {
                name: "bannerImage",
                label: "Banner Image URL",
                placeholder: "https://...",
                helpText: "Enter a valid image URL for your business banner.",
              },
              {
                name: "header",
                label: "Header",
                placeholder: "Welcome to Acme Store",
                helpText:
                  "This text appears prominently on customer-facing pages.",
              },
              {
                name: "subtitle",
                label: "Subtitle",
                placeholder: "Earn points on every purchase",
                helpText: "This text provides additional context or messaging.",
              },
            ]}
            defaultValues={{
              logo: business.defaultBranding?.logo ?? "",
              themeColor: business.defaultBranding?.themeColor ?? "",
              textColor: business.defaultBranding?.textColor ?? "",
              bannerImage: business.defaultBranding?.bannerImage ?? "",
              header: business.defaultBranding?.header ?? "",
              subtitle: business.defaultBranding?.subtitle ?? "",
            }}
            onSubmit={handleUpdateBranding}
          />
        </div>
      </ScaffoldContainer>
    </PageLayout>
  );
}
