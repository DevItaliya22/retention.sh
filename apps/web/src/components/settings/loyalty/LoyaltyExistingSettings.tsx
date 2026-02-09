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
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Form,
  FormProvider,
  useForm,
} from "@reelo/ui/components";
import { useEffect } from "react";
import { toast } from "sonner";
import { AmountSpentSettingsCard } from "./amount-spent";
import { CashbackSettingsCard } from "./cashback";
import { TierSettingsCard } from "./tier";
import { VisitMadeSettingsCard } from "./visit";

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
                onError: (e) => toast.error(e.message),
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
            tiers: loyalty.tierConfig.tiers,
          }}
          onSave={async (data, options) => {
            try {
              await updateMutation.mutateAsync({
                section: "tierConfig",
                tierConfig: {
                  pointsPerRupee: data.pointsPerRupee,
                  onFinalAmount: data.onFinalAmount,
                },
              });
              await updateMutation.mutateAsync({
                section: "tiers",
                tiers: data.tiers,
              });
              toast.success("Tier configuration saved");
              options?.onSuccess?.();
            } catch (e) {
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
  const termsInitial = terms.length > 0 ? terms : [""];

  const form = useForm({
    defaultValues: {
      pointReminderDays: loyalty.pointReminderDays ?? null,
      pointExpiryDays: loyalty.pointExpiryDays ?? null,
      whatsappEnabled: loyalty.whatsappEnabled ?? false,
      emailEnabled: loyalty.emailEnabled ?? false,
      smsEnabled: loyalty.smsEnabled ?? false,
      termsAndConditions: termsInitial,
    },
  });

  const handleSave = form.handleSubmit((values) => {
    const rawTerms = values.termsAndConditions ?? [];
    const filtered = rawTerms
      .map((s) => (typeof s === "string" ? s : "").trim())
      .filter(Boolean);
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
        },
        onError: (e) => toast.error(e.message),
      },
    );
  });

  return (
    <Card className="gap-0 p-0!">
      <CardHeader className="flex flex-col gap-0 border-b py-2!">
        <CardTitle className="text-base font-medium">
          Expiry, Channels & Terms
        </CardTitle>
        <CardDescription className="text-xs">
          Point reminders, expiry, notification channels, and terms
        </CardDescription>
      </CardHeader>
      <FormProvider {...form}>
        <Form {...form}>
          <form onSubmit={(e) => e.preventDefault()}>
            <CardContent className="space-y-6 px-6 py-4">
              <ExpiryReminderFields layout="settings" />
              <ChannelSelector layout="settings" />
              <TermsConditionsEditor layout="settings" />
            </CardContent>
            <CardFooter className="flex justify-end border-t px-6 py-4">
              <Button
                type="button"
                onClick={handleSave}
                loading={updateMutation.isPending}
                disabled={!form.formState.isDirty}
              >
                Save changes
              </Button>
            </CardFooter>
          </form>
        </Form>
      </FormProvider>
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

  const handleSave = form.handleSubmit((values) => {
    updateMutation.mutate(
      { section: "branding", branding: values.branding ?? null },
      {
        onSuccess: () => {
          toast.success("Branding saved");
          form.reset(values, { keepDefaultValues: false });
        },
        onError: (e) => toast.error(e.message),
      },
    );
  });

  return (
    <Card className="gap-0 p-0!">
      <CardHeader className="flex flex-col gap-0 border-b py-2!">
        <CardTitle className="text-base font-medium">Branding</CardTitle>
        <CardDescription className="text-xs">
          Customize your loyalty program appearance
        </CardDescription>
      </CardHeader>
      <FormProvider {...form}>
        <Form {...form}>
          <form onSubmit={(e) => e.preventDefault()}>
            <CardContent className="px-6 py-4">
              <BrandingFormFields prefix="branding" layout="settings" />
            </CardContent>
            <CardFooter className="flex justify-end border-t px-6 py-4">
              <Button
                type="button"
                onClick={handleSave}
                loading={updateMutation.isPending}
                disabled={!form.formState.isDirty}
              >
                Save changes
              </Button>
            </CardFooter>
          </form>
        </Form>
      </FormProvider>
    </Card>
  );
}
