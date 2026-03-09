"use client";

import { ChannelSelector } from "@/components/common/form-sections";
import { TermCard } from "@/components/common/form-sections/TermCard";
import { BrandingFieldGroup } from "@/components/common/settings/BrandingFieldGroup";
import { SettingsField } from "@/components/common/settings/SettingsField";
import type { ReferralProgram } from "@/hooks/referral/useReferralProgram";
import { useUpdateReferralProgram } from "@/hooks/referral/useReferralProgram";
import { useActiveSkusForSelect } from "@/hooks/sku/useSkusQuery";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormProvider,
  Input,
  SaveButton,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Textarea,
} from "@reelo/ui/components";
import { Plus, Trash2, X } from "lucide-react";
import { useEffect } from "react";
import type { Resolver } from "react-hook-form";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

const BENEFIT_TYPE_OPTIONS = [
  { value: "AMOUNT_CASHBACK", label: "Amount Cashback" },
  { value: "FREE_ITEM_ON_NEXT_PURCHASE", label: "Free Item on Next Visit" },
] as const;

interface SkuItem {
  id: string;
  name: string;
  sku: string;
}

const newCustomerBenefitSchema = z
  .object({
    newCustomerBenefitType: z.enum([
      "AMOUNT_CASHBACK",
      "FREE_ITEM_ON_NEXT_PURCHASE",
    ]),
    newCustomerBenefitValue: z.string().default(""),
    newCustomerFreeItemSkuId: z.string().default(""),
    newCustomerBenefitExpiresInDays: z.string().default(""),
  })
  .superRefine((data, ctx) => {
    if (
      data.newCustomerBenefitType === "AMOUNT_CASHBACK" &&
      (!data.newCustomerBenefitValue ||
        Number(data.newCustomerBenefitValue) < 0)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Cashback amount is required",
        path: ["newCustomerBenefitValue"],
      });
    }
    if (
      data.newCustomerBenefitType === "FREE_ITEM_ON_NEXT_PURCHASE" &&
      !data.newCustomerFreeItemSkuId?.trim()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please select a free item",
        path: ["newCustomerFreeItemSkuId"],
      });
    }
  });

const existingCustomerBenefitSchema = z
  .object({
    existingCustomerBenefitType: z.enum([
      "AMOUNT_CASHBACK",
      "FREE_ITEM_ON_NEXT_PURCHASE",
    ]),
    existingCustomerBenefitValue: z.string().default(""),
    existingCustomerFreeItemSkuId: z.string().default(""),
    existingCustomerBenefitExpiresInDays: z.string().default(""),
    lockReferralPointsUntilFirstPurchase: z.boolean().optional().default(true),
  })
  .superRefine((data, ctx) => {
    if (
      data.existingCustomerBenefitType === "AMOUNT_CASHBACK" &&
      (!data.existingCustomerBenefitValue ||
        Number(data.existingCustomerBenefitValue) < 0)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Cashback amount is required",
        path: ["existingCustomerBenefitValue"],
      });
    }
    if (
      data.existingCustomerBenefitType === "FREE_ITEM_ON_NEXT_PURCHASE" &&
      !data.existingCustomerFreeItemSkuId?.trim()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please select a free item",
        path: ["existingCustomerFreeItemSkuId"],
      });
    }
  });

type NewCustomerBenefitForm = z.infer<typeof newCustomerBenefitSchema>;
type ExistingCustomerBenefitForm = z.infer<
  typeof existingCustomerBenefitSchema
>;

function NewCustomerBenefitsCard({
  referralProgram,
  skus,
  onSubmit,
}: {
  referralProgram: ReferralProgram;
  skus: SkuItem[];
  onSubmit: (
    values: NewCustomerBenefitForm,
  ) => Promise<{ success: boolean; error?: string }>;
}) {
  const form = useForm<NewCustomerBenefitForm>({
    resolver: zodResolver(
      newCustomerBenefitSchema,
    ) as Resolver<NewCustomerBenefitForm>,
    defaultValues: {
      newCustomerBenefitType:
        (referralProgram.newCustomerBenefitType as
          | "AMOUNT_CASHBACK"
          | "FREE_ITEM_ON_NEXT_PURCHASE") || "AMOUNT_CASHBACK",
      newCustomerBenefitValue: String(referralProgram.newCustomerBenefitValue),
      newCustomerFreeItemSkuId:
        referralProgram.newCustomerFreeItemSkuId ??
        referralProgram.newCustomerFreeItemSku?.id ??
        "",
      newCustomerBenefitExpiresInDays:
        referralProgram.newCustomerBenefitExpiresInDays
          ? String(referralProgram.newCustomerBenefitExpiresInDays)
          : "",
    },
  });

  const benefitType = form.watch("newCustomerBenefitType");

  useEffect(() => {
    form.reset({
      newCustomerBenefitType:
        (referralProgram.newCustomerBenefitType as
          | "AMOUNT_CASHBACK"
          | "FREE_ITEM_ON_NEXT_PURCHASE") || "AMOUNT_CASHBACK",
      newCustomerBenefitValue: String(referralProgram.newCustomerBenefitValue),
      newCustomerFreeItemSkuId:
        referralProgram.newCustomerFreeItemSkuId ??
        referralProgram.newCustomerFreeItemSku?.id ??
        "",
      newCustomerBenefitExpiresInDays:
        referralProgram.newCustomerBenefitExpiresInDays
          ? String(referralProgram.newCustomerBenefitExpiresInDays)
          : "",
    });
  }, [referralProgram, form]);

  const runSubmit = async () => {
    const valid = await form.trigger();
    if (!valid) throw new Error("Validation failed");
    const values = form.getValues();
    const result = await onSubmit(values);
    if (result.success) {
      toast.success("Settings updated successfully");
      form.reset(values, { keepDefaultValues: false });
    } else {
      toast.error(result.error || "Failed to update");
      throw new Error(result.error);
    }
  };

  return (
    <Card className="bg-sidebar-accent/50 flex min-h-0 flex-col gap-0 rounded-lg border-0 p-2">
      <CardHeader className="mb-3 shrink-0 gap-0 border-0 px-0 pt-0.5 pb-0 pl-3">
        <CardTitle className="text-foreground text-base leading-none font-semibold">
          New Customer Benefits
        </CardTitle>
        <CardDescription className="text-muted-foreground mt-0.5 text-sm">
          Rewards for customers who join through a referral link
        </CardDescription>
      </CardHeader>
      <Card className="border-border/45 bg-background/55 flex min-h-0 flex-1 flex-col gap-0 overflow-hidden rounded-lg border shadow-none">
        <Form {...form}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void runSubmit();
            }}
            className="flex min-h-0 flex-1 flex-col"
          >
            <CardContent className="flex min-h-0 flex-1 flex-col gap-y-4 overflow-auto px-4 py-4">
              <FormField
                control={form.control}
                name="newCustomerBenefitType"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2 md:grid md:grid-cols-12">
                    <div className="col-span-4">
                      <FormLabel className="text-sm">Benefit Type</FormLabel>
                    </div>
                    <div className="col-span-8">
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full rounded-none border-0 border-b bg-transparent px-0 py-3 shadow-none focus-visible:ring-0">
                            <SelectValue placeholder="Select benefit type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {BENEFIT_TYPE_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
              {benefitType === "AMOUNT_CASHBACK" && (
                <FormField
                  control={form.control}
                  name="newCustomerBenefitValue"
                  render={({ field }) => (
                    <FormItem className="flex flex-col gap-2 md:grid md:grid-cols-12">
                      <div className="col-span-4">
                        <FormLabel className="text-sm">
                          Cashback Amount (₹)
                        </FormLabel>
                      </div>
                      <div className="col-span-8">
                        <FormControl>
                          <Input
                            variant="underline"
                            type="number"
                            min={0}
                            placeholder="100"
                            {...field}
                            value={field.value}
                            onChange={(e) =>
                              field.onChange(
                                String(
                                  Math.max(0, parseInt(e.target.value) || 0),
                                ),
                              )
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
              )}
              {benefitType === "FREE_ITEM_ON_NEXT_PURCHASE" && (
                <FormField
                  control={form.control}
                  name="newCustomerFreeItemSkuId"
                  render={({ field }) => (
                    <FormItem className="flex flex-col gap-2 md:grid md:grid-cols-12">
                      <div className="col-span-4">
                        <FormLabel className="text-sm">Free Item</FormLabel>
                      </div>
                      <div className="col-span-8">
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={skus.length === 0}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full rounded-none border-0 border-b bg-transparent px-0 py-3 shadow-none focus-visible:ring-0">
                              <SelectValue placeholder="Select item" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {skus.map((s) => (
                              <SelectItem key={s.id} value={s.id}>
                                {s.name} {s.sku ? `(${s.sku})` : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
              )}
              <FormField
                control={form.control}
                name="newCustomerBenefitExpiresInDays"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2 md:grid md:grid-cols-12">
                    <div className="col-span-4">
                      <FormLabel className="text-sm">
                        Expires In (Days)
                      </FormLabel>
                    </div>
                    <div className="col-span-8">
                      <FormControl>
                        <Input
                          variant="underline"
                          type="number"
                          min={1}
                          placeholder="Optional"
                          {...field}
                          value={field.value}
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
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
      </Card>
    </Card>
  );
}

function ExistingCustomerBenefitsCard({
  referralProgram,
  skus,
  onSubmit,
}: {
  referralProgram: ReferralProgram;
  skus: SkuItem[];
  onSubmit: (
    values: ExistingCustomerBenefitForm,
  ) => Promise<{ success: boolean; error?: string }>;
}) {
  const form = useForm<ExistingCustomerBenefitForm>({
    resolver: zodResolver(
      existingCustomerBenefitSchema,
    ) as Resolver<ExistingCustomerBenefitForm>,
    defaultValues: {
      existingCustomerBenefitType:
        (referralProgram.existingCustomerBenefitType as
          | "AMOUNT_CASHBACK"
          | "FREE_ITEM_ON_NEXT_PURCHASE") || "AMOUNT_CASHBACK",
      existingCustomerBenefitValue: String(
        referralProgram.existingCustomerBenefitValue,
      ),
      existingCustomerFreeItemSkuId:
        referralProgram.existingCustomerFreeItemSkuId ??
        referralProgram.existingCustomerFreeItemSku?.id ??
        "",
      existingCustomerBenefitExpiresInDays:
        referralProgram.existingCustomerBenefitExpiresInDays
          ? String(referralProgram.existingCustomerBenefitExpiresInDays)
          : "",
      lockReferralPointsUntilFirstPurchase:
        referralProgram.lockReferralPointsUntilFirstPurchase ?? false,
    },
  });

  const benefitType = form.watch("existingCustomerBenefitType");

  useEffect(() => {
    form.reset({
      existingCustomerBenefitType:
        (referralProgram.existingCustomerBenefitType as
          | "AMOUNT_CASHBACK"
          | "FREE_ITEM_ON_NEXT_PURCHASE") || "AMOUNT_CASHBACK",
      existingCustomerBenefitValue: String(
        referralProgram.existingCustomerBenefitValue,
      ),
      existingCustomerFreeItemSkuId:
        referralProgram.existingCustomerFreeItemSkuId ??
        referralProgram.existingCustomerFreeItemSku?.id ??
        "",
      existingCustomerBenefitExpiresInDays:
        referralProgram.existingCustomerBenefitExpiresInDays
          ? String(referralProgram.existingCustomerBenefitExpiresInDays)
          : "",
      lockReferralPointsUntilFirstPurchase:
        referralProgram.lockReferralPointsUntilFirstPurchase ?? false,
    });
  }, [referralProgram, form]);

  const runSubmit = async () => {
    const valid = await form.trigger();
    if (!valid) throw new Error("Validation failed");
    const values = form.getValues();
    const result = await onSubmit(values);
    if (result.success) {
      toast.success("Settings updated successfully");
      form.reset(values, { keepDefaultValues: false });
    } else {
      toast.error(result.error || "Failed to update");
      throw new Error(result.error);
    }
  };

  return (
    <Card className="bg-sidebar-accent/50 flex min-h-0 flex-col gap-0 rounded-lg border-0 p-2">
      <CardHeader className="mb-3 shrink-0 gap-0 border-0 px-0 pt-0.5 pb-0 pl-3">
        <CardTitle className="text-foreground text-base leading-none font-semibold">
          Existing Customer Benefits
        </CardTitle>
        <CardDescription className="text-muted-foreground mt-0.5 text-sm">
          Rewards for customers who refer others
        </CardDescription>
      </CardHeader>
      <Card className="border-border/45 bg-background/55 flex min-h-0 flex-1 flex-col gap-0 overflow-hidden rounded-lg border shadow-none">
        <Form {...form}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void runSubmit();
            }}
            className="flex min-h-0 flex-1 flex-col"
          >
            <CardContent className="flex min-h-0 flex-1 flex-col gap-y-4 overflow-auto px-4 py-4">
              <FormField
                control={form.control}
                name="existingCustomerBenefitType"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2 md:grid md:grid-cols-12">
                    <div className="col-span-4">
                      <FormLabel className="text-sm">Benefit Type</FormLabel>
                    </div>
                    <div className="col-span-8">
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full rounded-none border-0 border-b bg-transparent px-0 py-3 shadow-none focus-visible:ring-0">
                            <SelectValue placeholder="Select benefit type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {BENEFIT_TYPE_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
              {benefitType === "AMOUNT_CASHBACK" && (
                <FormField
                  control={form.control}
                  name="existingCustomerBenefitValue"
                  render={({ field }) => (
                    <FormItem className="flex flex-col gap-2 md:grid md:grid-cols-12">
                      <div className="col-span-4">
                        <FormLabel className="text-sm">
                          Cashback Amount (₹)
                        </FormLabel>
                      </div>
                      <div className="col-span-8">
                        <FormControl>
                          <Input
                            variant="underline"
                            type="number"
                            min={0}
                            placeholder="50"
                            {...field}
                            value={field.value}
                            onChange={(e) =>
                              field.onChange(
                                String(
                                  Math.max(0, parseInt(e.target.value) || 0),
                                ),
                              )
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
              )}
              {benefitType === "FREE_ITEM_ON_NEXT_PURCHASE" && (
                <FormField
                  control={form.control}
                  name="existingCustomerFreeItemSkuId"
                  render={({ field }) => (
                    <FormItem className="flex flex-col gap-2 md:grid md:grid-cols-12">
                      <div className="col-span-4">
                        <FormLabel className="text-sm">Free Item</FormLabel>
                      </div>
                      <div className="col-span-8">
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={skus.length === 0}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full rounded-none border-0 border-b bg-transparent px-0 py-3 shadow-none focus-visible:ring-0">
                              <SelectValue placeholder="Select item" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {skus.map((s) => (
                              <SelectItem key={s.id} value={s.id}>
                                {s.name} {s.sku ? `(${s.sku})` : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
              )}
              <FormField
                control={form.control}
                name="lockReferralPointsUntilFirstPurchase"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between gap-4 rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Lock referrer's reward until referred customer's first
                        purchase
                      </FormLabel>
                      <p className="text-muted-foreground text-sm">
                        Referrer&apos;s cashback will be locked until the person
                        they referred makes their first bill. Locked amount
                        shows in bill redemption UI. The referred customer can
                        use their reward normally.
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value ?? false}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="existingCustomerBenefitExpiresInDays"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2 md:grid md:grid-cols-12">
                    <div className="col-span-4">
                      <FormLabel className="text-sm">
                        Expires In (Days)
                      </FormLabel>
                    </div>
                    <div className="col-span-8">
                      <FormControl>
                        <Input
                          variant="underline"
                          type="number"
                          min={1}
                          placeholder="Optional"
                          {...field}
                          value={field.value}
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
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
      </Card>
    </Card>
  );
}

const referralChannelsSchema = z.object({
  whatsappEnabled: z.boolean().optional().default(false),
  emailEnabled: z.boolean().optional().default(false),
  smsEnabled: z.boolean().optional().default(false),
});

type ReferralChannelsForm = z.infer<typeof referralChannelsSchema>;

function ReferralChannelsCard({
  referralProgram,
  onUpdate,
}: {
  referralProgram: ReferralProgram;
  onUpdate: ReturnType<typeof useUpdateReferralProgram>["mutateAsync"];
}) {
  const form = useForm<ReferralChannelsForm>({
    resolver: zodResolver(
      referralChannelsSchema,
    ) as Resolver<ReferralChannelsForm>,
    defaultValues: {
      whatsappEnabled: referralProgram.whatsappEnabled ?? false,
      emailEnabled: referralProgram.emailEnabled ?? false,
      smsEnabled: referralProgram.smsEnabled ?? false,
    },
  });

  useEffect(() => {
    form.reset({
      whatsappEnabled: referralProgram.whatsappEnabled ?? false,
      emailEnabled: referralProgram.emailEnabled ?? false,
      smsEnabled: referralProgram.smsEnabled ?? false,
    });
  }, [referralProgram, form]);

  const runSubmit = async () => {
    const valid = await form.trigger();
    if (!valid) throw new Error("Validation failed");
    const values = form.getValues();
    await onUpdate({
      whatsappEnabled: values.whatsappEnabled ?? false,
      emailEnabled: values.emailEnabled ?? false,
      smsEnabled: values.smsEnabled ?? false,
    });
    toast.success("Notification channels updated");
    form.reset(values, { keepDefaultValues: false });
  };

  return (
    <Card className="bg-sidebar-accent/50 flex min-h-0 flex-col gap-0 rounded-lg border-0 p-2">
      <CardHeader className="mb-3 shrink-0 gap-0 border-0 px-0 pt-0.5 pb-0 pl-3">
        <CardTitle className="text-foreground text-base leading-none font-semibold">
          Notification channels
        </CardTitle>
        <CardDescription className="text-muted-foreground mt-0.5 text-sm">
          How to notify referrer and referred customer when someone joins via
          referral
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
                <ChannelSelector layout="settings" />
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

interface ReferralExistingSettingsProps {
  referralProgram: ReferralProgram;
}

export function ReferralExistingSettings({
  referralProgram,
}: ReferralExistingSettingsProps) {
  const { mutateAsync: updateReferralProgram } = useUpdateReferralProgram();
  const { data: skusData } = useActiveSkusForSelect();
  const skus = skusData?.items ?? [];

  const handleUpdateBranding = async (values: Record<string, string>) => {
    try {
      await updateReferralProgram({
        branding: {
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

  const handleUpdateNewCustomerBenefits = async (
    values: NewCustomerBenefitForm,
  ) => {
    try {
      const type = values.newCustomerBenefitType as
        | "AMOUNT_CASHBACK"
        | "FREE_ITEM_ON_NEXT_PURCHASE";
      await updateReferralProgram({
        newCustomerBenefitType: type,
        newCustomerBenefitValue:
          type === "AMOUNT_CASHBACK"
            ? Number(values.newCustomerBenefitValue) || 0
            : 0,
        newCustomerFreeItemSkuId:
          type === "FREE_ITEM_ON_NEXT_PURCHASE"
            ? values.newCustomerFreeItemSkuId || null
            : null,
        newCustomerBenefitExpiresInDays: values.newCustomerBenefitExpiresInDays
          ? Number(values.newCustomerBenefitExpiresInDays)
          : null,
      });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || "Failed to update" };
    }
  };

  const handleUpdateExistingCustomerBenefits = async (
    values: ExistingCustomerBenefitForm,
  ) => {
    try {
      const type = values.existingCustomerBenefitType as
        | "AMOUNT_CASHBACK"
        | "FREE_ITEM_ON_NEXT_PURCHASE";
      await updateReferralProgram({
        existingCustomerBenefitType: type,
        existingCustomerBenefitValue:
          type === "AMOUNT_CASHBACK"
            ? Number(values.existingCustomerBenefitValue) || 0
            : 0,
        existingCustomerFreeItemSkuId:
          type === "FREE_ITEM_ON_NEXT_PURCHASE"
            ? values.existingCustomerFreeItemSkuId || null
            : null,
        existingCustomerBenefitExpiresInDays:
          values.existingCustomerBenefitExpiresInDays
            ? Number(values.existingCustomerBenefitExpiresInDays)
            : null,
        lockReferralPointsUntilFirstPurchase: Boolean(
          values.lockReferralPointsUntilFirstPurchase,
        ),
      });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || "Failed to update" };
    }
  };

  return (
    <div className="space-y-6">
      <NewCustomerBenefitsCard
        referralProgram={referralProgram}
        skus={skus}
        onSubmit={handleUpdateNewCustomerBenefits}
      />
      <ExistingCustomerBenefitsCard
        referralProgram={referralProgram}
        skus={skus}
        onSubmit={handleUpdateExistingCustomerBenefits}
      />

      <SettingsField
        title="Send Reminder"
        description="Send reminder notifications to customers about their referral rewards"
        type="toggle"
        defaultValue={referralProgram.sendReminderToCustomer}
        onSubmit={async (data) => {
          try {
            await updateReferralProgram({
              sendReminderToCustomer: data.value as boolean,
            });
            return { success: true };
          } catch (error: unknown) {
            return {
              success: false,
              error: (error as Error)?.message || "Failed to update",
            };
          }
        }}
      />

      <ReferralChannelsCard
        referralProgram={referralProgram}
        onUpdate={updateReferralProgram}
      />

      {/* Information Sections - temporarily disabled
      <InformationSectionsCard
        sections={
          (referralProgram.informationSections as Array<{
            title: string;
            content: string;
          }>) ?? []
        }
        onUpdate={updateReferralProgram}
      />
      */}

      {/* Branding */}
      <BrandingFieldGroup
        title="Branding"
        description="Customize appearance of referral pages"
        defaultValues={{
          logo: referralProgram.branding?.logo ?? "",
          themeColor: referralProgram.branding?.themeColor ?? "",
          textColor: referralProgram.branding?.textColor ?? "",
          bannerImage: referralProgram.branding?.bannerImage ?? "",
          header: referralProgram.branding?.header ?? "",
          subtitle: referralProgram.branding?.subtitle ?? "",
        }}
        onSubmit={handleUpdateBranding}
      />

      {/* Terms - New Customer (point-wise list) */}
      <TermsCard
        title="Terms & Conditions (New Customer)"
        description="Terms shown to new customers who join via referral"
        value={referralProgram.termsAndConditionsNewCustomer ?? []}
        fieldKey="termsAndConditionsNewCustomer"
        onUpdate={updateReferralProgram}
      />

      {/* Terms - Existing Customer (point-wise list) */}
      <TermsCard
        title="Terms & Conditions (Existing Customer)"
        description="Terms for existing customers who refer others"
        value={referralProgram.termsAndConditionsExistingCustomer ?? []}
        fieldKey="termsAndConditionsExistingCustomer"
        onUpdate={updateReferralProgram}
      />
    </div>
  );
}

type TermsItem = { id: string; content: string };

function InformationSectionsCard({
  sections,
  onUpdate,
}: {
  sections: Array<{ title: string; content: string }>;
  onUpdate: ReturnType<typeof useUpdateReferralProgram>["mutateAsync"];
}) {
  const form = useForm<{ sections: Array<{ title: string; content: string }> }>(
    {
      defaultValues: {
        sections: sections.length > 0 ? sections : [{ title: "", content: "" }],
      },
    },
  );
  useEffect(() => {
    form.reset({
      sections: sections.length > 0 ? sections : [{ title: "", content: "" }],
    });
  }, [sections]);

  const watchSections = form.watch("sections");

  const addSection = () => {
    form.setValue("sections", [...watchSections, { title: "", content: "" }], {
      shouldDirty: true,
    });
  };
  const removeSection = (index: number) => {
    const next = watchSections.filter((_, i) => i !== index);
    form.setValue(
      "sections",
      next.length > 0 ? next : [{ title: "", content: "" }],
      {
        shouldDirty: true,
      },
    );
  };

  const runSubmit = async () => {
    const data = form.getValues();
    const filtered = data.sections.filter(
      (s) => s.title.trim() !== "" || s.content.trim() !== "",
    );
    await onUpdate({ informationSections: filtered });
    toast.success("Information sections updated");
    form.reset(data, { keepDefaultValues: false });
  };

  return (
    <Card className="bg-sidebar-accent/50 flex min-h-0 flex-col gap-0 rounded-lg border-0 p-2">
      <CardHeader className="mb-3 shrink-0 gap-0 border-0 px-0 pt-0.5 pb-0 pl-3">
        <CardTitle className="text-foreground text-base leading-none font-semibold">
          How customers know more about you
        </CardTitle>
        <CardDescription className="text-muted-foreground mt-0.5 text-sm">
          Information sections shown on referral pages
        </CardDescription>
      </CardHeader>
      <Card className="border-border/45 bg-background/55 flex min-h-0 flex-1 flex-col gap-0 overflow-hidden rounded-lg border shadow-none">
        <Form {...form}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void runSubmit();
            }}
            className="flex min-h-0 flex-1 flex-col"
          >
            <CardContent className="flex min-h-0 flex-1 flex-col gap-y-4 overflow-auto px-4 py-4">
              {watchSections.map((_, index) => (
                <div key={index} className="flex gap-2 rounded-lg border p-4">
                  <div className="flex-1 space-y-2">
                    <FormField
                      control={form.control}
                      name={`sections.${index}.title`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Section title" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`sections.${index}.content`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Content</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Section content"
                              rows={2}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeSection(index)}
                    className="shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addSection}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add section
              </Button>
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
      </Card>
    </Card>
  );
}

function TermsCard({
  title,
  description,
  value,
  fieldKey,
  onUpdate,
}: {
  title: string;
  description: string;
  value: TermsItem[];
  fieldKey:
    | "termsAndConditionsNewCustomer"
    | "termsAndConditionsExistingCustomer";
  onUpdate: ReturnType<typeof useUpdateReferralProgram>["mutateAsync"];
}) {
  const presetLabels = [
    "Multiple offers cannot be combined in a single bill.",
    "Referral rewards cannot be combined with ongoing campaigns.",
    "Rewards are not redeemable on public holidays.",
    "Reward is redeemable in-store only.",
  ];
  const presetSet = new Set(presetLabels);
  const items = value.map((t) => t.content);
  const form = useForm<{ items: string[] }>({
    defaultValues: {
      items,
    },
  });
  useEffect(() => {
    form.reset({
      items,
    });
  }, [value]);

  const watchItems = form.watch("items");

  const addPoint = () => {
    form.setValue("items", [...watchItems, ""], { shouldDirty: true });
  };
  const removePoint = (index: number) => {
    const next = watchItems.filter((_, i) => i !== index);
    form.setValue("items", next, {
      shouldDirty: true,
    });
  };

  const runSubmit = async () => {
    const data = form.getValues();
    const filtered = data.items
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    await onUpdate({ [fieldKey]: filtered });
    toast.success("Terms updated successfully");
    form.reset(data, { keepDefaultValues: false });
  };

  return (
    <Card className="bg-sidebar-accent/50 flex min-h-0 flex-col gap-0 rounded-lg border-0 p-2">
      <CardHeader className="mb-3 shrink-0 gap-0 border-0 px-0 pt-0.5 pb-0 pl-3">
        <CardTitle className="text-foreground text-base leading-none font-semibold">
          {title}
        </CardTitle>
        <CardDescription className="text-muted-foreground mt-0.5 text-sm">
          {description}
        </CardDescription>
      </CardHeader>
      <Card className="border-border/45 bg-background/55 flex min-h-0 flex-1 flex-col gap-0 overflow-hidden rounded-lg border shadow-none">
        <Form {...form}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void runSubmit();
            }}
            className="flex min-h-0 flex-1 flex-col"
          >
            <CardContent className="flex min-h-0 flex-1 flex-col gap-y-3 overflow-auto px-4 py-4">
              <div className="mb-1 space-y-1">
                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  Suggested defaults
                </p>
                <div className="mt-1 grid gap-2 md:grid-cols-2">
                  {presetLabels.map((label) => {
                    const current = (form.getValues("items") as string[]) ?? [];
                    const isSelected = current.includes(label);
                    return (
                      <TermCard
                        key={label}
                        label={label}
                        checked={isSelected}
                        onCheckedChange={(next) => {
                          const itemsNow =
                            (form.getValues("items") as string[]) ?? [];
                          const exists = itemsNow.includes(label);
                          const nextItems = next
                            ? exists
                              ? itemsNow
                              : [...itemsNow, label]
                            : itemsNow.filter((t) => t !== label);
                          form.setValue("items", nextItems, {
                            shouldDirty: true,
                          });
                        }}
                      />
                    );
                  })}
                </div>
              </div>
              {watchItems.map((_, index) => {
                const valueAtIndex = watchItems[index] ?? "";
                if (presetSet.has(valueAtIndex)) {
                  return null;
                }
                return (
                  <div
                    key={index}
                    className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2"
                  >
                    <Input
                      variant="underline"
                      className="min-w-0 flex-1"
                      value={valueAtIndex}
                      placeholder={`Point ${index + 1}`}
                      onChange={(e) => {
                        const next = [...watchItems];
                        next[index] = e.target.value;
                        form.setValue("items", next, { shouldDirty: true });
                      }}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      onClick={() => removePoint(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addPoint}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add point
              </Button>
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
      </Card>
    </Card>
  );
}
