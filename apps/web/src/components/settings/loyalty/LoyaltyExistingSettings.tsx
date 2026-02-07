"use client";

import { LoyaltySettingsSkeleton } from "@/components/settings/loyalty/LoyaltySettingsSkeleton";
import { fetcher } from "@/lib/fetcher";
import {
  loyaltySettingsSchema,
  type LoyaltySettingsInput,
} from "@/lib/schemas/loyalty";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Checkbox,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  InfoIcon,
  Input,
  Label,
  Textarea,
} from "@reelo/ui/components";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import type { Resolver } from "react-hook-form";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface LoyaltySettingsResponse {
  loyalty: {
    earningPercentage: number;
    earnPointsOnPaidAmountOnly?: boolean;
    cashbackInFinalAmount: boolean;
    cashbackBranding: string | null;
    minPurchaseForEarning: number;
    minPurchaseForRedemption: number;
    upperLimitBillAmount: number | null;
    upperLimitClaimableAmount: number | null;
    pointReminderDays: number | null;
    pointExpiryDays: number | null;
    whatsappEnabled: boolean;
    emailEnabled: boolean;
    smsEnabled: boolean;
    termsAndConditions?: { content: string }[];
    branding?: {
      logo: string | null;
      themeColor: string | null;
      textColor: string | null;
      bannerImage: string | null;
      header: string | null;
      subtitle: string | null;
    } | null;
  } | null;
  error?: string;
}

const defaultValues: LoyaltySettingsInput = {
  earningPercentage: 0,
  earnPointsOnPaidAmountOnly: true,
  cashbackInFinalAmount: false,
  cashbackBranding: null,
  minPurchaseForEarning: 0,
  minPurchaseForRedemption: 0,
  upperLimitBillAmount: null,
  upperLimitClaimableAmount: null,
  pointReminderDays: null,
  pointExpiryDays: null,
  whatsappEnabled: false,
  emailEnabled: false,
  smsEnabled: false,
  termsAndConditions: [""],
  branding: {
    logo: null,
    themeColor: null,
    textColor: null,
    bannerImage: null,
    header: null,
    subtitle: null,
  },
};

function LabelWithTooltip({
  children,
  tooltip,
}: {
  children: React.ReactNode;
  tooltip: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Label className="text-sm">{children}</Label>
      <InfoIcon content={tooltip} size={14} />
    </div>
  );
}

export function LoyaltyExistingSettings() {
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery<LoyaltySettingsResponse, Error>(
    {
      queryKey: ["loyalty-settings"],
      queryFn: () => fetcher<LoyaltySettingsResponse>("/api/loyalty"),
      staleTime: 5000,
    },
  );

  const loyalty = data?.loyalty;
  const resolvedDefaults = loyalty
    ? {
        ...defaultValues,
        earningPercentage: loyalty.earningPercentage ?? 0,
        earnPointsOnPaidAmountOnly: loyalty.earnPointsOnPaidAmountOnly ?? true,
        cashbackInFinalAmount: loyalty.cashbackInFinalAmount ?? false,
        cashbackBranding: loyalty.cashbackBranding ?? null,
        minPurchaseForEarning: loyalty.minPurchaseForEarning ?? 0,
        minPurchaseForRedemption: loyalty.minPurchaseForRedemption ?? 0,
        upperLimitBillAmount: loyalty.upperLimitBillAmount ?? null,
        upperLimitClaimableAmount: loyalty.upperLimitClaimableAmount ?? null,
        pointReminderDays: loyalty.pointReminderDays ?? null,
        pointExpiryDays: loyalty.pointExpiryDays ?? null,
        whatsappEnabled: loyalty.whatsappEnabled ?? false,
        emailEnabled: loyalty.emailEnabled ?? false,
        smsEnabled: loyalty.smsEnabled ?? false,
        termsAndConditions: (() => {
          const terms = loyalty.termsAndConditions?.map((t) => t.content) ?? [];
          return terms.length > 0 ? terms : [""];
        })(),
        branding: loyalty.branding
          ? {
              logo: loyalty.branding.logo ?? null,
              themeColor: loyalty.branding.themeColor ?? null,
              textColor: loyalty.branding.textColor ?? null,
              bannerImage: loyalty.branding.bannerImage ?? null,
              header: loyalty.branding.header ?? null,
              subtitle: loyalty.branding.subtitle ?? null,
            }
          : defaultValues.branding,
      }
    : defaultValues;

  const form = useForm<LoyaltySettingsInput>({
    resolver: zodResolver(
      loyaltySettingsSchema,
    ) as Resolver<LoyaltySettingsInput>,
    defaultValues: resolvedDefaults,
    values: data !== undefined ? resolvedDefaults : undefined,
  });

  const mutation = useMutation<
    LoyaltySettingsResponse,
    Error,
    LoyaltySettingsInput
  >({
    mutationFn: async (payload) =>
      fetcher<LoyaltySettingsResponse>("/api/loyalty", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loyalty-settings"] });
      toast.success("Loyalty settings saved");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to save loyalty settings");
    },
  });

  const SECTION_EARNING = [
    "earningPercentage",
    "earnPointsOnPaidAmountOnly",
    "cashbackBranding",
    "minPurchaseForEarning",
    "minPurchaseForRedemption",
  ] as const;
  const SECTION_LIMITS = [
    "upperLimitBillAmount",
    "upperLimitClaimableAmount",
    "pointReminderDays",
    "pointExpiryDays",
  ] as const;
  const SECTION_COMMUNICATION = [
    "whatsappEnabled",
    "emailEnabled",
    "smsEnabled",
    "termsAndConditions",
  ] as const;

  const isDirtyBranding = form.formState.dirtyFields.branding != null;
  const isDirtyEarning = SECTION_EARNING.some(
    (f) => form.formState.dirtyFields[f],
  );
  const isDirtyLimits = SECTION_LIMITS.some(
    (f) => form.formState.dirtyFields[f],
  );
  const isDirtyCommunication = SECTION_COMMUNICATION.some(
    (f) => form.formState.dirtyFields[f],
  );

  const handleSaveBranding = async () => {
    const valid = await form.trigger("branding");
    if (!valid) {
      toast.error("Please fix the errors");
      return;
    }
    mutation.mutate({
      ...form.getValues(),
      branding: form.getValues("branding") ?? null,
    });
  };

  const handleSaveEarningRedemption = form.handleSubmit((values) => {
    mutation.mutate(values);
  });

  const handleSaveLimitsExpiry = async () => {
    const valid = await form.trigger(SECTION_LIMITS);
    if (valid) mutation.mutate(form.getValues());
    else toast.error("Please fix the errors");
  };

  const handleSaveCommunicationTerms = async () => {
    const valid = await form.trigger(SECTION_COMMUNICATION);
    if (!valid) {
      toast.error("Please fix the errors");
      return;
    }
    const values = form.getValues();
    mutation.mutate({
      ...values,
      termsAndConditions: (values.termsAndConditions ?? [])
        .map((s) => (typeof s === "string" ? s : "").trim())
        .filter(Boolean),
    });
  };

  if (isLoading) {
    return <LoyaltySettingsSkeleton />;
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

  return (
    <Form {...form}>
      <form
        onSubmit={(e) => e.preventDefault()}
        className="space-y-6"
        autoComplete="off"
      >
        <Card className="gap-0 p-0!">
          <CardHeader className="flex flex-col gap-0 border-b py-2!">
            <CardTitle className="text-base font-medium">
              Earning & Redemption
            </CardTitle>
            <CardDescription className="text-xs">
              Points earning and redemption rules
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-6 py-4">
            <div className="flex flex-col gap-2 md:grid md:grid-cols-12">
              <div className="col-span-4 flex flex-col gap-2">
                <LabelWithTooltip tooltip="Percentage of the bill amount that customers earn as loyalty points (0–100). E.g., 5% means ₹5 points on a ₹100 bill.">
                  Earning percentage *
                </LabelWithTooltip>
              </div>
              <div className="col-span-8 flex flex-col gap-1">
                <FormField
                  control={form.control}
                  name="earningPercentage"
                  render={({ field }) => (
                    <>
                      <Input
                        variant="underline"
                        type="number"
                        min={0}
                        max={100}
                        step="0.01"
                        value={
                          field.value === 0 ||
                          field.value === null ||
                          field.value === undefined
                            ? ""
                            : field.value
                        }
                        onChange={(e) => {
                          const raw = e.target.value;
                          if (raw === "" || Number.isNaN(Number(raw))) {
                            field.onChange(0);
                            return;
                          }
                          field.onChange(
                            Math.min(100, Math.max(0, Number(raw))),
                          );
                        }}
                      />
                      {form.formState.errors.earningPercentage && (
                        <p className="text-destructive text-xs">
                          {form.formState.errors.earningPercentage.message}
                        </p>
                      )}
                    </>
                  )}
                />
              </div>
            </div>
            <div className="flex flex-col gap-2 md:grid md:grid-cols-12">
              <div className="col-span-4 flex flex-col gap-2">
                <LabelWithTooltip tooltip="A friendly name for your points or cashback (e.g. cookies, chillies).">
                  Cashback branding
                </LabelWithTooltip>
              </div>
              <div className="col-span-8 flex flex-col gap-1">
                <Input
                  variant="underline"
                  {...form.register("cashbackBranding", {
                    setValueAs: (v) => (v === "" ? null : v),
                  })}
                  placeholder="e.g. cookies, chillies"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2 md:grid md:grid-cols-12">
              <div className="col-span-4 flex flex-col gap-2">
                <LabelWithTooltip tooltip="Minimum bill amount required for customers to earn any points.">
                  Min purchase for earning
                </LabelWithTooltip>
              </div>
              <div className="col-span-8 flex flex-col gap-1">
                <FormField
                  control={form.control}
                  name="minPurchaseForEarning"
                  render={({ field }) => (
                    <Input
                      variant="underline"
                      type="number"
                      min={0}
                      step="0.01"
                      value={
                        field.value === 0 ||
                        field.value === null ||
                        field.value === undefined
                          ? ""
                          : field.value
                      }
                      onChange={(e) => {
                        const raw = e.target.value;
                        if (raw === "" || Number.isNaN(Number(raw))) {
                          field.onChange(0);
                          return;
                        }
                        field.onChange(Math.max(0, Number(raw)));
                      }}
                    />
                  )}
                />
              </div>
            </div>
            <div className="flex flex-col gap-2 md:grid md:grid-cols-12">
              <div className="col-span-4 flex flex-col gap-2">
                <LabelWithTooltip tooltip="Minimum bill amount required for customers to redeem points.">
                  Min purchase for redemption
                </LabelWithTooltip>
              </div>
              <div className="col-span-8 flex flex-col gap-1">
                <FormField
                  control={form.control}
                  name="minPurchaseForRedemption"
                  render={({ field }) => (
                    <Input
                      variant="underline"
                      type="number"
                      min={0}
                      step="0.01"
                      value={
                        field.value === 0 ||
                        field.value === null ||
                        field.value === undefined
                          ? ""
                          : field.value
                      }
                      onChange={(e) => {
                        const raw = e.target.value;
                        if (raw === "" || Number.isNaN(Number(raw))) {
                          field.onChange(0);
                          return;
                        }
                        field.onChange(Math.max(0, Number(raw)));
                      }}
                    />
                  )}
                />
              </div>
            </div>
            <div className="flex flex-col gap-2 md:grid md:grid-cols-12">
              <div className="col-span-4 flex flex-col gap-2">
                <LabelWithTooltip tooltip="When ON: earn points only on amount paid after redemption. When OFF: earn on full bill amount.">
                  Earn points on paid amount only
                </LabelWithTooltip>
              </div>
              <div className="col-span-8 flex items-center gap-2">
                <Checkbox
                  checked={form.watch("earnPointsOnPaidAmountOnly") ?? true}
                  onCheckedChange={(v) =>
                    form.setValue("earnPointsOnPaidAmountOnly", !!v)
                  }
                />
                <span className="text-muted-foreground text-sm">
                  On (recommended): earn on amount paid after redemption
                </span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end border-t px-6 py-4">
            <Button
              type="button"
              onClick={handleSaveEarningRedemption}
              loading={mutation.isPending}
              disabled={!isDirtyEarning}
            >
              Save changes
            </Button>
          </CardFooter>
        </Card>

        <Card className="gap-0 p-0!">
          <CardHeader className="flex flex-col gap-0 border-b py-2!">
            <CardTitle className="text-base font-medium">
              Limits & Expiry
            </CardTitle>
            <CardDescription className="text-xs">
              Caps and expiry settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-6 py-4">
            <div className="flex flex-col gap-2 md:grid md:grid-cols-12">
              <div className="col-span-4 flex flex-col gap-2">
                <LabelWithTooltip tooltip="Maximum bill amount considered for earning. Leave empty for no limit.">
                  Upper limit bill amount
                </LabelWithTooltip>
              </div>
              <div className="col-span-8 flex flex-col gap-1">
                <FormField
                  control={form.control}
                  name="upperLimitBillAmount"
                  render={({ field }) => (
                    <Input
                      variant="underline"
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="No limit"
                      value={
                        field.value === null ||
                        field.value === undefined ||
                        field.value === 0
                          ? ""
                          : field.value
                      }
                      onChange={(e) => {
                        const raw = e.target.value;
                        if (raw === "" || Number.isNaN(Number(raw))) {
                          field.onChange(null);
                          return;
                        }
                        field.onChange(Math.max(0, Number(raw)));
                      }}
                    />
                  )}
                />
              </div>
            </div>
            <div className="flex flex-col gap-2 md:grid md:grid-cols-12">
              <div className="col-span-4 flex flex-col gap-2">
                <LabelWithTooltip tooltip="Maximum amount customers can redeem in a single transaction. Leave empty for no limit.">
                  Upper limit claimable amount
                </LabelWithTooltip>
              </div>
              <div className="col-span-8 flex flex-col gap-1">
                <FormField
                  control={form.control}
                  name="upperLimitClaimableAmount"
                  render={({ field }) => (
                    <Input
                      variant="underline"
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="No limit"
                      value={
                        field.value === null ||
                        field.value === undefined ||
                        field.value === 0
                          ? ""
                          : field.value
                      }
                      onChange={(e) => {
                        const raw = e.target.value;
                        if (raw === "" || Number.isNaN(Number(raw))) {
                          field.onChange(null);
                          return;
                        }
                        field.onChange(Math.max(0, Number(raw)));
                      }}
                    />
                  )}
                />
              </div>
            </div>
            <div className="flex flex-col gap-2 md:grid md:grid-cols-12">
              <div className="col-span-4 flex flex-col gap-2">
                <LabelWithTooltip tooltip="Send reminder after this many days. Leave empty to disable.">
                  Point reminder days
                </LabelWithTooltip>
              </div>
              <div className="col-span-8 flex flex-col gap-1">
                <FormField
                  control={form.control}
                  name="pointReminderDays"
                  render={({ field }) => (
                    <Input
                      variant="underline"
                      type="number"
                      min={0}
                      placeholder="Disabled"
                      value={
                        field.value === null ||
                        field.value === undefined ||
                        field.value === 0
                          ? ""
                          : field.value
                      }
                      onChange={(e) => {
                        const raw = e.target.value;
                        if (raw === "" || Number.isNaN(Number(raw))) {
                          field.onChange(null);
                          return;
                        }
                        field.onChange(Math.max(0, Number(raw)));
                      }}
                    />
                  )}
                />
              </div>
            </div>
            <div className="flex flex-col gap-2 md:grid md:grid-cols-12">
              <div className="col-span-4 flex flex-col gap-2">
                <LabelWithTooltip tooltip="Points expire after this many days. Leave empty for never.">
                  Point expiry days
                </LabelWithTooltip>
              </div>
              <div className="col-span-8 flex flex-col gap-1">
                <FormField
                  control={form.control}
                  name="pointExpiryDays"
                  render={({ field }) => (
                    <Input
                      variant="underline"
                      type="number"
                      min={1}
                      placeholder="Never expire"
                      value={
                        field.value === null ||
                        field.value === undefined ||
                        field.value === 0
                          ? ""
                          : field.value
                      }
                      onChange={(e) => {
                        const raw = e.target.value;
                        if (raw === "" || Number.isNaN(Number(raw))) {
                          field.onChange(null);
                          return;
                        }
                        field.onChange(Math.max(1, Number(raw)));
                      }}
                    />
                  )}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end border-t px-6 py-4">
            <Button
              type="button"
              onClick={handleSaveLimitsExpiry}
              loading={mutation.isPending}
              disabled={!isDirtyLimits}
            >
              Save changes
            </Button>
          </CardFooter>
        </Card>

        <Card className="gap-0 p-0!">
          <CardHeader className="flex flex-col gap-0 border-b py-2!">
            <CardTitle className="text-base font-medium">
              Communication & Terms
            </CardTitle>
            <CardDescription className="text-xs">
              Channels and terms
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-6 py-4">
            <div className="flex flex-col gap-2 md:grid md:grid-cols-12">
              <div className="col-span-4 flex flex-col gap-2">
                <LabelWithTooltip tooltip="Notification channels for point reminders.">
                  Notification channels
                </LabelWithTooltip>
              </div>
              <div className="col-span-8 flex flex-wrap gap-6">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={form.watch("whatsappEnabled")}
                    onCheckedChange={(v) =>
                      form.setValue("whatsappEnabled", !!v)
                    }
                  />
                  <span className="text-sm">WhatsApp</span>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={form.watch("emailEnabled")}
                    onCheckedChange={(v) => form.setValue("emailEnabled", !!v)}
                  />
                  <span className="text-sm">Email</span>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={form.watch("smsEnabled")}
                    onCheckedChange={(v) => form.setValue("smsEnabled", !!v)}
                  />
                  <span className="text-sm">SMS</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2 md:grid md:grid-cols-12">
              <div className="col-span-4 flex flex-col gap-2">
                <LabelWithTooltip tooltip="Terms and conditions for your loyalty program.">
                  Terms & conditions
                </LabelWithTooltip>
              </div>
              <div className="col-span-8 flex flex-col gap-3">
                {(form.watch("termsAndConditions") ?? [""]).map((_, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <FormField
                      control={form.control}
                      name={`termsAndConditions.${index}`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Textarea
                              variant="underline"
                              placeholder={`Term ${index + 1}`}
                              {...field}
                              value={field.value ?? ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const items = form.getValues("termsAndConditions") ?? [
                          "",
                        ];
                        const next = items.filter((_, i) => i !== index);
                        form.setValue(
                          "termsAndConditions",
                          next.length > 0 ? next : [""],
                          { shouldDirty: true },
                        );
                      }}
                      className="mt-2 shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const items = form.getValues("termsAndConditions") ?? [""];
                    form.setValue("termsAndConditions", [...items, ""], {
                      shouldDirty: true,
                    });
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add term
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end border-t px-6 py-4">
            <Button
              type="button"
              onClick={handleSaveCommunicationTerms}
              loading={mutation.isPending}
              disabled={!isDirtyCommunication}
            >
              Save changes
            </Button>
          </CardFooter>
        </Card>

        <Card className="gap-0 p-0!">
          <CardHeader className="flex flex-col gap-0 border-b py-2!">
            <CardTitle className="text-base font-medium">Branding</CardTitle>
            <CardDescription className="text-xs">
              Customize your loyalty program appearance on customer-facing pages
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-6 py-4">
            <div className="flex flex-col gap-2 md:grid md:grid-cols-12">
              <div className="col-span-4 flex flex-col gap-2">
                <LabelWithTooltip tooltip="URL of your logo image.">
                  Logo URL
                </LabelWithTooltip>
              </div>
              <div className="col-span-8 flex flex-col gap-1">
                <Input
                  variant="underline"
                  {...form.register("branding.logo", {
                    setValueAs: (v) => (v === "" ? null : v),
                  })}
                  placeholder="https://..."
                />
              </div>
            </div>
            <div className="flex flex-col gap-2 md:grid md:grid-cols-12">
              <div className="col-span-4 flex flex-col gap-2">
                <LabelWithTooltip tooltip="Primary theme color (e.g. #7c3aed).">
                  Theme Color
                </LabelWithTooltip>
              </div>
              <div className="col-span-8 flex flex-col gap-1">
                <Input
                  variant="underline"
                  {...form.register("branding.themeColor", {
                    setValueAs: (v) => (v === "" ? null : v),
                  })}
                  placeholder="#7c3aed"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2 md:grid md:grid-cols-12">
              <div className="col-span-4 flex flex-col gap-2">
                <LabelWithTooltip tooltip="Text color for contrast.">
                  Text Color
                </LabelWithTooltip>
              </div>
              <div className="col-span-8 flex flex-col gap-1">
                <Input
                  variant="underline"
                  {...form.register("branding.textColor", {
                    setValueAs: (v) => (v === "" ? null : v),
                  })}
                  placeholder="#ffffff"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2 md:grid md:grid-cols-12">
              <div className="col-span-4 flex flex-col gap-2">
                <LabelWithTooltip tooltip="Banner image URL.">
                  Banner Image URL
                </LabelWithTooltip>
              </div>
              <div className="col-span-8 flex flex-col gap-1">
                <Input
                  variant="underline"
                  {...form.register("branding.bannerImage", {
                    setValueAs: (v) => (v === "" ? null : v),
                  })}
                  placeholder="https://..."
                />
              </div>
            </div>
            <div className="flex flex-col gap-2 md:grid md:grid-cols-12">
              <div className="col-span-4 flex flex-col gap-2">
                <LabelWithTooltip tooltip="Main heading on loyalty pages.">
                  Header
                </LabelWithTooltip>
              </div>
              <div className="col-span-8 flex flex-col gap-1">
                <Input
                  variant="underline"
                  {...form.register("branding.header", {
                    setValueAs: (v) => (v === "" ? null : v),
                  })}
                  placeholder="Welcome to our loyalty program"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2 md:grid md:grid-cols-12">
              <div className="col-span-4 flex flex-col gap-2">
                <LabelWithTooltip tooltip="Subheading under the header.">
                  Subtitle
                </LabelWithTooltip>
              </div>
              <div className="col-span-8 flex flex-col gap-1">
                <Input
                  variant="underline"
                  {...form.register("branding.subtitle", {
                    setValueAs: (v) => (v === "" ? null : v),
                  })}
                  placeholder="Earn points on every purchase"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end border-t px-6 py-4">
            <Button
              type="button"
              onClick={handleSaveBranding}
              loading={mutation.isPending}
              disabled={!isDirtyBranding}
            >
              Save changes
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
