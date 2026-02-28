"use client";

import { BrandingFieldGroup } from "@/components/common/settings/BrandingFieldGroup";
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
  const [loyaltyPending, startLoyaltyTransition] = useTransition();
  const [referralPending, startReferralTransition] = useTransition();
  const [feedbackPending, startFeedbackTransition] = useTransition();

  const handleLoyaltyEnabledChange = (enabled: boolean) => {
    startLoyaltyTransition(async () => {
      try {
        await updateBusiness({ serviceEnabled: { loyalty: enabled } });
        toast.success("Settings updated successfully");
      } catch (error: unknown) {
        toast.error((error as Error)?.message || "Failed to update");
      }
    });
  };

  const handleReferralEnabledChange = (enabled: boolean) => {
    startReferralTransition(async () => {
      try {
        await updateBusiness({ serviceEnabled: { referral: enabled } });
        toast.success("Settings updated successfully");
      } catch (error: unknown) {
        toast.error((error as Error)?.message || "Failed to update");
      }
    });
  };

  const handleFeedbackEnabledChange = (enabled: boolean) => {
    startFeedbackTransition(async () => {
      try {
        await updateBusiness({ serviceEnabled: { feedback: enabled } });
        toast.success("Settings updated successfully");
      } catch (error: unknown) {
        toast.error((error as Error)?.message || "Failed to update");
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

          <BrandingFieldGroup
            title="Branding"
            description="Customize your business appearance and messaging"
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

          {/* Services - single card, same UI as SettingsFieldGroup (NestedCard) */}
          <Card className="flex min-h-0 flex-col gap-0 rounded-xl border-0 bg-[#EDE7D9] p-2 pb-3 shadow-none">
            <CardHeader className="mb-3 shrink-0 gap-0 border-0 px-0 pt-0.5 pb-0 pl-3">
              <CardTitle className="text-foreground text-base leading-none font-semibold">
                Services
              </CardTitle>
              <CardDescription className="text-muted-foreground mt-0.5 text-sm">
                Enable or disable loyalty, referral, and feedback for your
                business
              </CardDescription>
            </CardHeader>
            <Card className="flex min-h-0 flex-1 flex-col gap-0 overflow-hidden rounded-lg border-0 bg-[#FAF8F1] shadow-none">
              <CardContent className="flex flex-col divide-y px-4 py-4">
                <div className="flex flex-col gap-1 py-4 first:pt-0">
                  <div className="flex flex-row items-center justify-between">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium">Loyalty</span>
                      <span className="text-muted-foreground text-xs">
                        Points and rewards
                      </span>
                    </div>
                    <Switch
                      checked={
                        isServiceEnabled(
                          business.isServiceEnabled,
                          "loyalty",
                        ) ?? false
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
                        isServiceEnabled(
                          business.isServiceEnabled,
                          "referral",
                        ) ?? false
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
                        isServiceEnabled(
                          business.isServiceEnabled,
                          "feedback",
                        ) ?? false
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
          </Card>
        </div>
      </ScaffoldContainer>
    </PageLayout>
  );
}
