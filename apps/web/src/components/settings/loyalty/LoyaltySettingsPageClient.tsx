"use client";

import { PageLayout, ScaffoldContainer } from "@/components/layouts";
import { LoyaltySettingsSkeleton } from "@/components/settings/loyalty/LoyaltySettingsSkeleton";
import { fetcher } from "@/lib/fetcher";
import {
  loyaltySettingsSchema,
  type LoyaltySettingsInput,
} from "@/lib/schemas/loyalty";
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
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import type { Resolver } from "react-hook-form";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface LoyaltySettingsResponse {
  loyalty: {
    earningPercentage: number;
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

export function LoyaltySettingsPageClient() {
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
        cashbackInFinalAmount: true,
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
          : {
              logo: null,
              themeColor: null,
              textColor: null,
              bannerImage: null,
              header: null,
              subtitle: null,
            },
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
    const values = form.getValues();
    mutation.mutate({
      ...values,
      branding: values.branding ?? null,
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
        .map((s) => s.trim())
        .filter(Boolean),
    });
  };

  if (isLoading) {
    return (
      <PageLayout
        title="Loyalty Settings"
        subtitle="Configure earning, redemption, expiry, and communication"
        size="default"
        scaffoldSectionClassName="h-full w-full pt-2 pb-0"
      >
        <ScaffoldContainer>
          <LoyaltySettingsSkeleton />
        </ScaffoldContainer>
      </PageLayout>
    );
  }

  if (isError || data?.error) {
    return (
      <PageLayout
        title="Loyalty Settings"
        subtitle="Configure earning, redemption, expiry, and communication"
        size="default"
        scaffoldSectionClassName="h-full w-full pt-2 pb-0"
      >
        <ScaffoldContainer>
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-destructive text-sm">
              {data?.error || "Failed to load loyalty settings"}
            </p>
            <p className="text-muted-foreground text-xs mt-1">
              Please try again later
            </p>
          </div>
        </ScaffoldContainer>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Loyalty Settings"
      subtitle="Configure earning, redemption, expiry, and communication"
      size="default"
      scaffoldSectionClassName="h-full w-full pt-2 pb-16"
    >
      <ScaffoldContainer>
        <Form {...form}>
          <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
            {/* Earning & Redemption */}
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
                    <LabelWithTooltip tooltip="Percentage of the bill amount that customers earn as loyalty points. E.g., 5% means ₹5 points on a ₹100 bill.">
                      Earning percentage *
                    </LabelWithTooltip>
                  </div>
                  <div className="col-span-8 flex flex-col gap-1">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step="0.01"
                      {...form.register("earningPercentage", {
                        setValueAs: (v) => {
                          const n = Number(v);
                          return v === "" || Number.isNaN(n) ? 0 : n;
                        },
                      })}
                    />
                    {form.formState.errors.earningPercentage && (
                      <p className="text-destructive text-xs">
                        {form.formState.errors.earningPercentage.message}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2 md:grid md:grid-cols-12">
                  <div className="col-span-4 flex flex-col gap-2">
                    <LabelWithTooltip tooltip="A friendly name for your points or cashback (e.g. cookies, chillies). Shown to customers when they earn or redeem.">
                      Cashback branding
                    </LabelWithTooltip>
                  </div>
                  <div className="col-span-8 flex flex-col gap-1">
                    <Input
                      {...form.register("cashbackBranding", {
                        setValueAs: (v) => (v === "" ? null : v),
                      })}
                      placeholder="e.g. cookies, chillies"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2 md:grid md:grid-cols-12">
                  <div className="col-span-4 flex flex-col gap-2">
                    <LabelWithTooltip tooltip="Minimum bill amount (in your currency) required for customers to earn any points. Bills below this amount earn nothing.">
                      Min purchase for earning
                    </LabelWithTooltip>
                  </div>
                  <div className="col-span-8 flex flex-col gap-1">
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      {...form.register("minPurchaseForEarning", {
                        setValueAs: (v) =>
                          v === "" || Number.isNaN(Number(v)) ? 0 : Number(v),
                      })}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2 md:grid md:grid-cols-12">
                  <div className="col-span-4 flex flex-col gap-2">
                    <LabelWithTooltip tooltip="Minimum bill amount required for customers to redeem or use their loyalty points. Prevents redemptions on very small purchases.">
                      Min purchase for redemption
                    </LabelWithTooltip>
                  </div>
                  <div className="col-span-8 flex flex-col gap-1">
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      {...form.register("minPurchaseForRedemption", {
                        setValueAs: (v) =>
                          v === "" || Number.isNaN(Number(v)) ? 0 : Number(v),
                      })}
                    />
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

            {/* Limits & Expiry */}
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
                    <LabelWithTooltip tooltip="Maximum bill amount considered for earning points. Amounts above this cap don't earn extra points. Leave empty for no limit.">
                      Upper limit bill amount
                    </LabelWithTooltip>
                  </div>
                  <div className="col-span-8 flex flex-col gap-1">
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      {...form.register("upperLimitBillAmount", {
                        setValueAs: (v) =>
                          v === "" || Number.isNaN(Number(v))
                            ? null
                            : Number(v),
                      })}
                      placeholder="No limit"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2 md:grid md:grid-cols-12">
                  <div className="col-span-4 flex flex-col gap-2">
                    <LabelWithTooltip tooltip="Maximum amount customers can claim or redeem from their points in a single transaction. Leave empty for no limit.">
                      Upper limit claimable amount
                    </LabelWithTooltip>
                  </div>
                  <div className="col-span-8 flex flex-col gap-1">
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      {...form.register("upperLimitClaimableAmount", {
                        setValueAs: (v) =>
                          v === "" || Number.isNaN(Number(v))
                            ? null
                            : Number(v),
                      })}
                      placeholder="No limit"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2 md:grid md:grid-cols-12">
                  <div className="col-span-4 flex flex-col gap-2">
                    <LabelWithTooltip tooltip="Send a reminder to customers after this many days if they have unused points. Leave empty to disable reminders.">
                      Point reminder days
                    </LabelWithTooltip>
                  </div>
                  <div className="col-span-8 flex flex-col gap-1">
                    <Input
                      type="number"
                      min={0}
                      {...form.register("pointReminderDays", {
                        setValueAs: (v) =>
                          v === "" || Number.isNaN(Number(v))
                            ? null
                            : Number(v),
                      })}
                      placeholder="Disabled"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2 md:grid md:grid-cols-12">
                  <div className="col-span-4 flex flex-col gap-2">
                    <LabelWithTooltip tooltip="Points expire and become unusable after this many days. Leave empty for points that never expire.">
                      Point expiry days
                    </LabelWithTooltip>
                  </div>
                  <div className="col-span-8 flex flex-col gap-1">
                    <Input
                      type="number"
                      min={1}
                      {...form.register("pointExpiryDays", {
                        setValueAs: (v) =>
                          v === "" || Number.isNaN(Number(v))
                            ? null
                            : Number(v),
                      })}
                      placeholder="Never expire"
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

            {/* Communication & Terms */}
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
                    <LabelWithTooltip tooltip="Choose how to send point reminders and updates to customers. Enable WhatsApp, Email, or SMS to notify customers about their points.">
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
                        onCheckedChange={(v) =>
                          form.setValue("emailEnabled", !!v)
                        }
                      />
                      <span className="text-sm">Email</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={form.watch("smsEnabled")}
                        onCheckedChange={(v) =>
                          form.setValue("smsEnabled", !!v)
                        }
                      />
                      <span className="text-sm">SMS</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2 md:grid md:grid-cols-12">
                  <div className="col-span-4 flex flex-col gap-2">
                    <LabelWithTooltip tooltip="Rules and conditions for your loyalty program. Add multiple terms—each is shown to customers when they join or view their points.">
                      Terms & conditions
                    </LabelWithTooltip>
                  </div>
                  <div className="col-span-8 flex flex-col gap-3">
                    {(form.watch("termsAndConditions") ?? [""]).map(
                      (_, index) => (
                        <div key={index} className="flex gap-2 items-start">
                          <FormField
                            control={form.control}
                            name={`termsAndConditions.${index}`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormControl>
                                  <Textarea
                                    placeholder={`Term ${index + 1}`}
                                    className="min-h-[60px]"
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
                              const items = form.getValues(
                                "termsAndConditions",
                              ) ?? [""];
                              const next = items.filter((_, i) => i !== index);
                              form.setValue(
                                "termsAndConditions",
                                next.length > 0 ? next : [""],
                                { shouldDirty: true },
                              );
                            }}
                            className="shrink-0 mt-2"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ),
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const items = form.getValues("termsAndConditions") ?? [
                          "",
                        ];
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

            {/* Branding */}
            <Card className="gap-0 p-0!">
              <CardHeader className="flex flex-col gap-0 border-b py-2!">
                <CardTitle className="text-base font-medium">
                  Branding
                </CardTitle>
                <CardDescription className="text-xs">
                  Customize your loyalty program appearance on customer-facing
                  pages
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 px-6 py-4">
                <div className="flex flex-col gap-2 md:grid md:grid-cols-12">
                  <div className="col-span-4 flex flex-col gap-2">
                    <LabelWithTooltip tooltip="URL of your logo image. Shown on loyalty and points pages.">
                      Logo URL
                    </LabelWithTooltip>
                  </div>
                  <div className="col-span-8 flex flex-col gap-1">
                    <Input
                      {...form.register("branding.logo", {
                        setValueAs: (v) => (v === "" ? null : v),
                      })}
                      placeholder="https://..."
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2 md:grid md:grid-cols-12">
                  <div className="col-span-4 flex flex-col gap-2">
                    <LabelWithTooltip tooltip="Primary theme color in hex format (e.g. #7c3aed).">
                      Theme Color
                    </LabelWithTooltip>
                  </div>
                  <div className="col-span-8 flex flex-col gap-1">
                    <Input
                      {...form.register("branding.themeColor", {
                        setValueAs: (v) => (v === "" ? null : v),
                      })}
                      placeholder="#7c3aed"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2 md:grid md:grid-cols-12">
                  <div className="col-span-4 flex flex-col gap-2">
                    <LabelWithTooltip tooltip="Text color in hex format for contrast with theme.">
                      Text Color
                    </LabelWithTooltip>
                  </div>
                  <div className="col-span-8 flex flex-col gap-1">
                    <Input
                      {...form.register("branding.textColor", {
                        setValueAs: (v) => (v === "" ? null : v),
                      })}
                      placeholder="#ffffff"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2 md:grid md:grid-cols-12">
                  <div className="col-span-4 flex flex-col gap-2">
                    <LabelWithTooltip tooltip="Banner image URL for loyalty pages header.">
                      Banner Image URL
                    </LabelWithTooltip>
                  </div>
                  <div className="col-span-8 flex flex-col gap-1">
                    <Input
                      {...form.register("branding.bannerImage", {
                        setValueAs: (v) => (v === "" ? null : v),
                      })}
                      placeholder="https://..."
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2 md:grid md:grid-cols-12">
                  <div className="col-span-4 flex flex-col gap-2">
                    <LabelWithTooltip tooltip="Main heading text on loyalty pages.">
                      Header
                    </LabelWithTooltip>
                  </div>
                  <div className="col-span-8 flex flex-col gap-1">
                    <Input
                      {...form.register("branding.header", {
                        setValueAs: (v) => (v === "" ? null : v),
                      })}
                      placeholder="Welcome to our loyalty program"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2 md:grid md:grid-cols-12">
                  <div className="col-span-4 flex flex-col gap-2">
                    <LabelWithTooltip tooltip="Subheading or tagline under the header.">
                      Subtitle
                    </LabelWithTooltip>
                  </div>
                  <div className="col-span-8 flex flex-col gap-1">
                    <Input
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
      </ScaffoldContainer>
    </PageLayout>
  );
}
