"use client";

import {
  BrandingFormFields,
  ChannelSelector,
  ExpiryReminderFields,
  TermsConditionsEditor,
} from "@/components/common/form-sections";
import {
  isValidLoyaltySkeletonType,
  LOYALTY_SKELETON_STORAGE_KEY,
  LoyaltySettingsSkeleton,
} from "@/components/settings/loyalty/LoyaltySettingsSkeleton";
import type { LoyaltyResponse } from "@/hooks/loyalty/useLoyaltySettings";
import {
  useLoyaltySettingsQuery,
  useUpdateLoyaltyMutation,
} from "@/hooks/loyalty/useLoyaltySettings";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Form,
  FormProvider,
  SaveButton,
  useForm,
} from "@reelo/ui/components";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AmountSpentSettingsCard } from "./amount-spent";
import { CashbackSettingsCard } from "./cashback";
import { TierSettingsCard } from "./tier";
import { VisitMadeSettingsCard } from "./visit";

function getLoyaltyTypeHeading(type: LoyaltyResponse["loyaltyType"]): string {
  switch (type) {
    case "TIER":
      return "Tier-Based Loyalty";
    case "AMOUNT_SPENT":
      return "Amount-Spent-Based Loyalty";
    case "VISIT_MADE":
      return "Visit-Made-Based Loyalty";
    case "CASHBACK":
    default:
      return "Basic Loyalty";
  }
}

export function LoyaltyExistingSettings() {
  const { data, isLoading, isError } = useLoyaltySettingsQuery();
  const updateMutation = useUpdateLoyaltyMutation();
  const [storedSkeletonType, setStoredSkeletonType] = useLocalStorage<
    string | null
  >(LOYALTY_SKELETON_STORAGE_KEY, null);
  const loyalty = data?.loyalty;

  // Renew localStorage when data loads (fixes tampering or failed prior load)
  useEffect(() => {
    if (loyalty?.loyaltyType) {
      setStoredSkeletonType(loyalty.loyaltyType);
    }
    // setStoredSkeletonType is stable; we only care about loyalty type changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loyalty?.loyaltyType]);

  if (isLoading) {
    const skeletonType = isValidLoyaltySkeletonType(storedSkeletonType)
      ? storedSkeletonType
      : undefined;
    return <LoyaltySettingsSkeleton loyaltyType={skeletonType} />;
  }

  if (isError || data?.error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-destructive text-sm">
          {data?.error || "Failed to load loyalty settings"}
        </p>
        <p className="text-muted-foreground mt-1 text-xs">
          Please try again later
        </p>
      </div>
    );
  }

  if (!loyalty) {
    return null;
  }

  return (
    <div className="space-y-6 pb-12">
      <h2 className="text-foreground text-2xl leading-tight font-bold">
        {getLoyaltyTypeHeading(loyalty.loyaltyType)}
      </h2>

      {loyalty.loyaltyType === "CASHBACK" && loyalty.cashbackConfig && (
        <CashbackSettingsCard
          config={loyalty.cashbackConfig}
          onSave={(payload, options) =>
            updateMutation.mutate(
              { section: "cashbackConfig", cashbackConfig: payload },
              {
                onSuccess: () => {
                  toast.success("Cashback settings saved");
                  options?.onSuccess?.();
                },
                onError: (e) => {
                  options?.onError?.(e);
                  toast.error(e.message);
                },
              },
            )
          }
          isSaving={updateMutation.isPending}
        />
      )}

      {loyalty.loyaltyType === "TIER" && loyalty.tierConfig && (
        <TierSettingsCard
          tierConfig={{
            pointsPerRupee: loyalty.tierConfig.pointsPerRupee,
            onFinalAmount: loyalty.tierConfig.onFinalAmount ?? false,
            allowSameBillRedemption: loyalty.tierConfig.allowSameBillRedemption,
            tiers: loyalty.tierConfig.tiers,
          }}
          onSave={async (data, options) => {
            try {
              await updateMutation.mutateAsync({
                section: "tierConfig",
                tierConfig: {
                  pointsPerRupee: data.pointsPerRupee,
                  onFinalAmount: data.onFinalAmount,
                  allowSameBillRedemption: data.allowSameBillRedemption,
                },
              });
              await updateMutation.mutateAsync({
                section: "tiers",
                tiers: data.tiers,
              });
              toast.success("Tier configuration saved");
              options?.onSuccess?.();
            } catch (e) {
              options?.onError?.(e);
              toast.error(e instanceof Error ? e.message : "Failed to save");
            }
          }}
          isSaving={updateMutation.isPending}
        />
      )}

      {loyalty.loyaltyType === "AMOUNT_SPENT" && loyalty.amountSpentConfig && (
        <AmountSpentSettingsCard
          config={loyalty.amountSpentConfig}
          onSave={async (data, options) => {
            try {
              await updateMutation.mutateAsync({
                section: "amountSpentConfig",
                amountSpentConfig: data.amountSpentConfig,
              });
              await updateMutation.mutateAsync({
                section: "rewardStages",
                rewardStages: data.rewardStages,
              });
              toast.success("Points & reward stages saved");
              options?.onSuccess?.();
            } catch (e) {
              options?.onError?.(e);
              toast.error(e instanceof Error ? e.message : "Failed to save");
            }
          }}
          isSaving={updateMutation.isPending}
        />
      )}

      {loyalty.loyaltyType === "VISIT_MADE" && loyalty.visitMadeConfig && (
        <VisitMadeSettingsCard
          config={loyalty.visitMadeConfig}
          onSave={async (data, options) => {
            try {
              await updateMutation.mutateAsync({
                section: "visitMadeConfig",
                visitMadeConfig: data.visitMadeConfig,
              });
              await updateMutation.mutateAsync({
                section: "rewardStages",
                rewardStages: data.rewardStages,
              });
              toast.success("Visit & reward stages saved");
              options?.onSuccess?.();
            } catch (e) {
              options?.onError?.(e);
              toast.error(e instanceof Error ? e.message : "Failed to save");
            }
          }}
          isSaving={updateMutation.isPending}
        />
      )}

      <CommonSettingsCard loyalty={loyalty} updateMutation={updateMutation} />
      <BrandingSettingsCard loyalty={loyalty} updateMutation={updateMutation} />
    </div>
  );
}

interface CommonSettingsCardProps {
  loyalty: LoyaltyResponse;
  updateMutation: ReturnType<typeof useUpdateLoyaltyMutation>;
}

function CommonSettingsCard({
  loyalty,
  updateMutation,
}: CommonSettingsCardProps) {
  const terms = loyalty.termsAndConditions?.map((t) => t.content) ?? [];

  const form = useForm({
    defaultValues: {
      pointReminderDays: loyalty.pointReminderDays ?? null,
      pointExpiryDays: loyalty.pointExpiryDays ?? null,
      whatsappEnabled: loyalty.whatsappEnabled ?? false,
      emailEnabled: loyalty.emailEnabled ?? false,
      smsEnabled: loyalty.smsEnabled ?? false,
      termsAndConditions: terms,
    },
  });

  const runSubmit = async () => {
    const valid = await form.trigger();
    if (!valid) throw new Error("Validation failed");
    const values = form.getValues();
    const rawTerms = values.termsAndConditions ?? [];
    const filtered = rawTerms
      .map((s) => (typeof s === "string" ? s : "").trim())
      .filter(Boolean);
    return new Promise<void>((resolve, reject) => {
      updateMutation.mutate(
        {
          section: "common",
          pointReminderDays: values.pointReminderDays ?? null,
          pointExpiryDays: values.pointExpiryDays ?? null,
          whatsappEnabled: values.whatsappEnabled ?? false,
          emailEnabled: values.emailEnabled ?? false,
          smsEnabled: values.smsEnabled ?? false,
          termsAndConditions: filtered.length > 0 ? filtered : [],
        },
        {
          onSuccess: () => {
            toast.success("Expiry & channels saved");
            form.reset(values, { keepDefaultValues: false });
            resolve();
          },
          onError: (e) => {
            toast.error(e.message);
            reject(e);
          },
        },
      );
    });
  };

  return (
    <Card className="bg-sidebar-accent/50 flex min-h-0 flex-col gap-0 rounded-lg border-0 p-2">
      <CardHeader className="mb-3 shrink-0 gap-0 border-0 px-0 pt-0.5 pb-0 pl-3">
        <CardTitle className="text-foreground text-base leading-none font-semibold">
          Expiry, Channels & Terms
        </CardTitle>
        <CardDescription className="text-muted-foreground mt-0.5 text-sm">
          Point reminders, expiry, notification channels, and terms
        </CardDescription>
      </CardHeader>
      <Card className="border-border/45 bg-background/55 flex min-h-0 flex-1 flex-col gap-0 overflow-hidden rounded-lg border shadow-none">
        <FormProvider {...form}>
          <Form {...form}>
            <form
              onSubmit={(e) => e.preventDefault()}
              className="flex min-h-0 flex-1 flex-col"
            >
              <CardContent className="flex min-h-0 flex-1 flex-col gap-y-6 overflow-auto px-4 py-4">
                <ExpiryReminderFields layout="settings" />
                <ChannelSelector layout="settings" />
                <TermsConditionsEditor layout="settings" />
              </CardContent>
              <CardFooter className="flex shrink-0 justify-end border-0 px-4 py-2">
                <SaveButton
                  onSave={runSubmit}
                  disabled={!form.formState.isDirty}
                  labels={{
                    idle: "Save changes",
                    loading: "Saving",
                    success: "Saved",
                  }}
                />
              </CardFooter>
            </form>
          </Form>
        </FormProvider>
      </Card>
    </Card>
  );
}

interface BrandingSettingsCardProps {
  loyalty: LoyaltyResponse;
  updateMutation: ReturnType<typeof useUpdateLoyaltyMutation>;
}

function BrandingSettingsCard({
  loyalty,
  updateMutation,
}: BrandingSettingsCardProps) {
  const resolvePendingUploadsRef = useRef<null | (() => Promise<void>)>(null);
  const [hasPendingImageChanges, setHasPendingImageChanges] = useState(false);
  const branding = loyalty.branding ?? {
    logo: null,
    themeColor: null,
    textColor: null,
    bannerImage: null,
    header: null,
    subtitle: null,
  };

  const form = useForm({
    defaultValues: { branding },
  });
  const handleResolvePendingUploads = useCallback(
    (resolver: () => Promise<void>) => {
      resolvePendingUploadsRef.current = resolver;
    },
    [],
  );

  const runSubmit = async () => {
    if (resolvePendingUploadsRef.current) {
      await resolvePendingUploadsRef.current();
    }
    const valid = await form.trigger();
    if (!valid) throw new Error("Validation failed");
    const values = form.getValues();
    return new Promise<void>((resolve, reject) => {
      updateMutation.mutate(
        { section: "branding", branding: values.branding ?? null },
        {
          onSuccess: () => {
            toast.success("Branding saved");
            form.reset(values, { keepDefaultValues: false });
            resolve();
          },
          onError: (e) => {
            toast.error(e.message);
            reject(e);
          },
        },
      );
    });
  };

  return (
    <Card className="bg-sidebar-accent/50 flex min-h-0 flex-col gap-0 rounded-lg border-0 p-2">
      <CardHeader className="mb-3 shrink-0 gap-0 border-0 px-0 pt-0.5 pb-0 pl-3">
        <CardTitle className="text-foreground text-base leading-none font-semibold">
          Branding
        </CardTitle>
        <CardDescription className="text-muted-foreground mt-0.5 text-sm">
          Customize your loyalty program appearance
        </CardDescription>
      </CardHeader>
      <Card className="border-border/45 bg-background/55 flex min-h-0 flex-1 flex-col gap-0 overflow-hidden rounded-lg border shadow-none">
        <FormProvider {...form}>
          <Form {...form}>
            <form
              onSubmit={(e) => e.preventDefault()}
              className="flex min-h-0 flex-1 flex-col"
            >
              <CardContent className="flex min-h-0 flex-1 flex-col overflow-auto px-4 py-4">
                <BrandingFormFields
                  prefix="branding"
                  layout="settings"
                  onResolvePendingUploads={handleResolvePendingUploads}
                  onPendingImageChanges={setHasPendingImageChanges}
                />
              </CardContent>
              <CardFooter className="flex shrink-0 justify-end border-0 px-4 py-2">
                <SaveButton
                  onSave={runSubmit}
                  disabled={!form.formState.isDirty && !hasPendingImageChanges}
                  labels={{
                    idle: "Save changes",
                    loading: "Saving",
                    success: "Saved",
                  }}
                />
              </CardFooter>
            </form>
          </Form>
        </FormProvider>
      </Card>
    </Card>
  );
}
