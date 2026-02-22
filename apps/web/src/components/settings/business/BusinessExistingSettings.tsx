"use client";

import { SettingsFieldGroup } from "@/components/common/settings/SettingsFieldGroup";
import { PageLayout, ScaffoldContainer } from "@/components/layouts";
import type { CurrentBusiness } from "@/hooks/business/useCurrentBusiness";
import { useUpdateBusiness } from "@/hooks/business/useCurrentBusiness";
import { isServiceEnabled } from "@/lib/utils/service-enabled";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Switch,
} from "@reelo/ui/components";
import Link from "next/link";
import { useTransition } from "react";
import { toast } from "sonner";

interface BusinessExistingSettingsProps {
  business: CurrentBusiness;
}

export function BusinessExistingSettings({
  business,
}: BusinessExistingSettingsProps) {
  const { mutateAsync: updateBusiness } = useUpdateBusiness();
  const [referralPending, startReferralTransition] = useTransition();
  const [loyaltyPending, startLoyaltyTransition] = useTransition();
  const [feedbackPending, startFeedbackTransition] = useTransition();

  const handleLoyaltyEnabledChange = (enabled: boolean) => {
    startLoyaltyTransition(async () => {
      try {
        await updateBusiness({ serviceEnabled: { loyalty: enabled } });
        toast.success("Settings updated successfully");
      } catch (error: any) {
        toast.error(error?.message || "Failed to update");
      }
    });
  };

  const handleReferralEnabledChange = (enabled: boolean) => {
    startReferralTransition(async () => {
      try {
        await updateBusiness({ serviceEnabled: { referral: enabled } });
        toast.success("Settings updated successfully");
      } catch (error: any) {
        toast.error(error?.message || "Failed to update");
      }
    });
  };

  const handleFeedbackEnabledChange = (enabled: boolean) => {
    startFeedbackTransition(async () => {
      try {
        await updateBusiness({ serviceEnabled: { feedback: enabled } });
        toast.success("Settings updated successfully");
      } catch (error: any) {
        toast.error(error?.message || "Failed to update");
      }
    });
  };

  const handleUpdateBasicInfo = async (values: Record<string, string>) => {
    try {
      const nextBillNumber =
        values.nextBillNumber !== undefined && values.nextBillNumber !== ""
          ? Number(values.nextBillNumber)
          : undefined;
      await updateBusiness({
        name: values.name,
        website: values.website || null,
        ...(nextBillNumber !== undefined &&
          Number.isInteger(nextBillNumber) &&
          nextBillNumber >= 1 && { nextBillNumber }),
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
      const registrationBonusPoints =
        values.registrationBonusPoints !== undefined &&
        values.registrationBonusPoints !== ""
          ? Number(values.registrationBonusPoints)
          : undefined;
      await updateBusiness({
        name: business.name,
        defaultPointsName: values.defaultPointsName,
        defaultCurrencySymbol: values.defaultCurrencySymbol,
        defaultCurrencyCode: values.defaultCurrencyCode,
        ...(registrationBonusPoints !== undefined
          ? { registrationBonusPoints }
          : {}),
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
      scaffoldSectionClassName="h-full w-full pt-2 pb-16"
    >
      <ScaffoldContainer>
        <div className="space-y-6">
          <SettingsFieldGroup
            title="Basic Information"
            description="Manage your business name, identifier, website, and next bill number"
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
              {
                name: "website",
                label: "Website",
                placeholder: "https://www.example.com",
                helpText: "Your business website URL (optional).",
                optional: true,
              },
              {
                name: "nextBillNumber",
                label: "Next Bill Number",
                placeholder: "1",
                helpText:
                  "Auto-fills the bill number in the cashier form. Increments automatically when a bill is created.",
                type: "number",
                min: 1,
              },
            ]}
            defaultValues={{
              name: business.name,
              slug: `reelo.in/${business.slug}`,
              website: business.website ?? "",
              nextBillNumber: String(business.nextBillNumber ?? 1),
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
              {
                name: "registrationBonusPoints",
                label: "Registration bonus points",
                placeholder: "0",
                helpText:
                  "Bonus points given when a customer registers from the loyalty login page. Set to 0 to disable.",
              },
            ]}
            defaultValues={{
              defaultPointsName: business.defaultPointsName,
              defaultCurrencySymbol: business.defaultCurrencySymbol,
              defaultCurrencyCode: business.defaultCurrencyCode,
              registrationBonusPoints: String(
                business.registrationBonusPoints ?? 0,
              ),
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

          <Card className="gap-0 p-0!">
            <CardHeader className="flex flex-col gap-0 border-b py-2!">
              <CardTitle className="text-base font-medium">Services</CardTitle>
              <CardDescription className="text-xs">
                Enable or disable loyalty, referral, and feedback for your
                business
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col divide-y px-6 py-0">
              <div className="flex flex-col gap-1 py-4">
                <div className="flex flex-row items-center justify-between">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium">Loyalty</span>
                    <span className="text-muted-foreground text-xs">
                      Points and rewards
                    </span>
                  </div>
                  <Switch
                    checked={
                      isServiceEnabled(business.isServiceEnabled, "loyalty") ??
                      false
                    }
                    onCheckedChange={handleLoyaltyEnabledChange}
                    disabled={loyaltyPending}
                  />
                </div>
                {!isServiceEnabled(business.isServiceEnabled, "loyalty") &&
                  !business.loyalty && (
                    <p className="text-muted-foreground text-xs">
                      Not set up yet.{" "}
                      <Link
                        href="/settings/loyalty"
                        className="text-primary underline underline-offset-2 hover:no-underline"
                      >
                        Set up loyalty
                      </Link>
                    </p>
                  )}
              </div>

              <div className="flex flex-col gap-1 py-4">
                <div className="flex flex-row items-center justify-between">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium">Referral</span>
                    <span className="text-muted-foreground text-xs">
                      Referral program (requires loyalty)
                    </span>
                  </div>
                  <Switch
                    checked={
                      isServiceEnabled(business.isServiceEnabled, "referral") ??
                      false
                    }
                    onCheckedChange={handleReferralEnabledChange}
                    disabled={referralPending}
                  />
                </div>
                {!isServiceEnabled(business.isServiceEnabled, "referral") &&
                  !business.referralProgram && (
                    <p className="text-muted-foreground text-xs">
                      Not set up yet.{" "}
                      <Link
                        href="/settings/referral"
                        className="text-primary underline underline-offset-2 hover:no-underline"
                      >
                        Set up referral
                      </Link>
                    </p>
                  )}
              </div>

              <div className="flex flex-col gap-1 py-4">
                <div className="flex flex-row items-center justify-between">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium">Feedback</span>
                    <span className="text-muted-foreground text-xs">
                      Feedback links on bills
                    </span>
                  </div>
                  <Switch
                    checked={
                      isServiceEnabled(business.isServiceEnabled, "feedback") ??
                      false
                    }
                    onCheckedChange={handleFeedbackEnabledChange}
                    disabled={feedbackPending}
                  />
                </div>
                {!isServiceEnabled(business.isServiceEnabled, "feedback") &&
                  !business.feedbackConfig && (
                    <p className="text-muted-foreground text-xs">
                      Not set up yet.{" "}
                      <Link
                        href="/settings/feedback"
                        className="text-primary underline underline-offset-2 hover:no-underline"
                      >
                        Set up feedback
                      </Link>
                    </p>
                  )}
              </div>
            </CardContent>
          </Card>
        </div>
      </ScaffoldContainer>
    </PageLayout>
  );
}
