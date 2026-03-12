"use client";

import { ChannelSelector } from "@/components/common/form-sections";
import { TermCard } from "@/components/common/form-sections/TermCard";
import { BrandingFieldGroup } from "@/components/common/settings/BrandingFieldGroup";
import type { ReferralProgram } from "@/hooks/referral/useReferralProgram";
import {
  useUpdateReferralProgram,
  useUpdateReferralProgramTerms,
} from "@/hooks/referral/useReferralProgram";
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
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
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

type SectionSaveHandle = {
  save: () => Promise<void>;
};

const NewCustomerBenefitsCard = forwardRef<
  SectionSaveHandle,
  {
    referralProgram: ReferralProgram;
    skus: SkuItem[];
    onSubmit: (
      values: NewCustomerBenefitForm,
    ) => Promise<{ success: boolean; error?: string }>;
    embedded?: boolean;
    onDirtyChange?: (dirty: boolean) => void;
  }
>(function NewCustomerBenefitsCard(
  { referralProgram, skus, onSubmit, embedded = false, onDirtyChange },
  ref,
) {
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

  useEffect(() => {
    onDirtyChange?.(form.formState.isDirty);
  }, [form.formState.isDirty, onDirtyChange]);

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

  useImperativeHandle(
    ref,
    () => ({
      save: runSubmit,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [form, referralProgram],
  );

  const content = (
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
                    <Select onValueChange={field.onChange} value={field.value}>
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
                    <FormLabel className="text-sm">Expires In (Days)</FormLabel>
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
          {!embedded && (
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
          )}
        </form>
      </Form>
    </Card>
  );

  if (embedded) return content;

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
      {content}
    </Card>
  );
});

const ExistingCustomerBenefitsCard = forwardRef<
  SectionSaveHandle,
  {
    referralProgram: ReferralProgram;
    skus: SkuItem[];
    onSubmit: (
      values: ExistingCustomerBenefitForm,
    ) => Promise<{ success: boolean; error?: string }>;
    embedded?: boolean;
    onDirtyChange?: (dirty: boolean) => void;
  }
>(function ExistingCustomerBenefitsCard(
  { referralProgram, skus, onSubmit, embedded = false, onDirtyChange },
  ref,
) {
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

  useEffect(() => {
    onDirtyChange?.(form.formState.isDirty);
  }, [form.formState.isDirty, onDirtyChange]);

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

  useImperativeHandle(
    ref,
    () => ({
      save: runSubmit,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [form, referralProgram],
  );

  const content = (
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
                    <Select onValueChange={field.onChange} value={field.value}>
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
              name="existingCustomerBenefitExpiresInDays"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-2 md:grid md:grid-cols-12">
                  <div className="col-span-4">
                    <FormLabel className="text-sm">Expires In (Days)</FormLabel>
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

            <FormField
              control={form.control}
              name="lockReferralPointsUntilFirstPurchase"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-2 md:grid md:grid-cols-12">
                  <div className="col-span-4">
                    <FormLabel className="text-sm">
                      Lock referrer's reward
                    </FormLabel>
                    <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                      Lock cashback until the referred customer’s first bill.
                    </p>
                  </div>
                  <div className="col-span-8 flex items-center">
                    <FormControl>
                      <Switch
                        checked={field.value ?? false}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </div>
                </FormItem>
              )}
            />
          </CardContent>
          {!embedded && (
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
          )}
        </form>
      </Form>
    </Card>
  );

  if (embedded) return content;

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
      {content}
    </Card>
  );
});

const referralChannelsSchema = z.object({
  whatsappEnabled: z.boolean().optional().default(true),
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
      whatsappEnabled: referralProgram.whatsappEnabled ?? true,
      emailEnabled: referralProgram.emailEnabled ?? false,
      smsEnabled: referralProgram.smsEnabled ?? false,
    },
  });

  useEffect(() => {
    form.reset({
      whatsappEnabled: referralProgram.whatsappEnabled ?? true,
      emailEnabled: referralProgram.emailEnabled ?? false,
      smsEnabled: referralProgram.smsEnabled ?? false,
    });
  }, [referralProgram, form]);

  const runSubmit = async () => {
    const valid = await form.trigger();
    if (!valid) throw new Error("Validation failed");
    const values = form.getValues();
    await onUpdate({
      whatsappEnabled: values.whatsappEnabled ?? true,
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

const referralNotificationsSchema = z.object({
  whatsappEnabled: z.boolean().optional().default(true),
  emailEnabled: z.boolean().optional().default(false),
  smsEnabled: z.boolean().optional().default(false),
  sendReminderToCustomer: z.boolean().optional().default(false),
});

type ReferralNotificationsForm = z.infer<typeof referralNotificationsSchema>;

function ReferralNotificationsCard({
  referralProgram,
  onUpdate,
}: {
  referralProgram: ReferralProgram;
  onUpdate: ReturnType<typeof useUpdateReferralProgram>["mutateAsync"];
}) {
  const form = useForm<ReferralNotificationsForm>({
    resolver: zodResolver(
      referralNotificationsSchema,
    ) as Resolver<ReferralNotificationsForm>,
    defaultValues: {
      whatsappEnabled: referralProgram.whatsappEnabled ?? true,
      emailEnabled: referralProgram.emailEnabled ?? false,
      smsEnabled: referralProgram.smsEnabled ?? false,
      sendReminderToCustomer: referralProgram.sendReminderToCustomer ?? false,
    },
  });

  useEffect(() => {
    form.reset({
      whatsappEnabled: referralProgram.whatsappEnabled ?? true,
      emailEnabled: referralProgram.emailEnabled ?? false,
      smsEnabled: referralProgram.smsEnabled ?? false,
      sendReminderToCustomer: referralProgram.sendReminderToCustomer ?? false,
    });
  }, [
    referralProgram.whatsappEnabled,
    referralProgram.emailEnabled,
    referralProgram.smsEnabled,
    referralProgram.sendReminderToCustomer,
    form,
  ]);

  const runSubmit = async () => {
    const valid = await form.trigger();
    if (!valid) throw new Error("Validation failed");
    const values = form.getValues();
    await onUpdate({
      whatsappEnabled: values.whatsappEnabled ?? true,
      emailEnabled: values.emailEnabled ?? false,
      smsEnabled: values.smsEnabled ?? false,
      sendReminderToCustomer: values.sendReminderToCustomer ?? false,
    });
    toast.success("Notification settings updated");
    form.reset(values, { keepDefaultValues: false });
  };

  return (
    <Card className="bg-sidebar-accent/50 flex min-h-0 flex-col gap-0 rounded-lg border-0 p-2">
      <CardHeader className="mb-3 shrink-0 gap-0 border-0 px-0 pt-0.5 pb-0 pl-3">
        <CardTitle className="text-foreground text-base leading-none font-semibold">
          Notifications
        </CardTitle>
        <CardDescription className="text-muted-foreground mt-0.5 text-sm">
          How to notify referrer and referred customer, and whether to send
          reward reminders
        </CardDescription>
      </CardHeader>
      <Card className="border-border/45 bg-background/55 flex min-h-0 flex-1 flex-col gap-0 overflow-hidden rounded-lg border shadow-none">
        <FormProvider {...form}>
          <Form {...form}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void runSubmit();
              }}
              className="flex min-h-0 flex-1 flex-col"
            >
              <CardContent className="flex min-h-0 flex-1 flex-col gap-y-6 overflow-auto px-4 py-4">
                <ChannelSelector layout="settings" />

                <div className="border-border/45 border-t pt-4">
                  <FormField
                    control={form.control}
                    name="sendReminderToCustomer"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <FormLabel className="text-sm">
                            Send reminder
                          </FormLabel>
                          <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                            Send reminder notifications to customers about their
                            referral rewards.
                          </p>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value ?? false}
                            onCheckedChange={(next) => field.onChange(next)}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
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
  const { mutateAsync: updateReferralProgramTerms } =
    useUpdateReferralProgramTerms();
  const { data: skusData } = useActiveSkusForSelect();
  const skus = skusData?.items ?? [];
  const newBenefitsRef = useRef<SectionSaveHandle | null>(null);
  const newTermsRef = useRef<SectionSaveHandle | null>(null);
  const existingBenefitsRef = useRef<SectionSaveHandle | null>(null);
  const existingTermsRef = useRef<SectionSaveHandle | null>(null);
  const [newBenefitsDirty, setNewBenefitsDirty] = useState(false);
  const [newTermsDirty, setNewTermsDirty] = useState(false);
  const [existingBenefitsDirty, setExistingBenefitsDirty] = useState(false);
  const [existingTermsDirty, setExistingTermsDirty] = useState(false);

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
    <div className="space-y-8">
      <Card className="bg-sidebar-accent/50 flex min-h-0 flex-col gap-0 rounded-lg border-0 p-2">
        <CardHeader className="mb-3 shrink-0 gap-0 border-0 px-0 pt-0.5 pb-0 pl-3">
          <CardTitle className="text-foreground text-base leading-none font-semibold">
            New customer settings
          </CardTitle>
          <CardDescription className="text-muted-foreground mt-0.5 text-sm">
            Rewards and terms for customers who join through a referral link
          </CardDescription>
        </CardHeader>
        <div className="space-y-3">
          <NewCustomerBenefitsCard
            ref={newBenefitsRef}
            referralProgram={referralProgram}
            skus={skus}
            onSubmit={handleUpdateNewCustomerBenefits}
            embedded
            onDirtyChange={setNewBenefitsDirty}
          />
          <TermsCard
            ref={newTermsRef}
            title="Terms & Conditions"
            description="Terms shown to new customers who join via referral"
            value={referralProgram.termsAndConditionsNewCustomer ?? []}
            fieldKey="termsAndConditionsNewCustomer"
            onUpdateTerms={updateReferralProgramTerms}
            embedded
            onDirtyChange={setNewTermsDirty}
          />
        </div>
        <CardFooter className="flex shrink-0 justify-end border-0 px-4 py-2">
          <SaveButton
            onSave={async () => {
              const tasks = [
                newBenefitsRef.current?.save(),
                newTermsRef.current?.save(),
              ].filter(Boolean) as Array<Promise<void>>;
              await Promise.all(tasks);
            }}
            disabled={!(newBenefitsDirty || newTermsDirty)}
            labels={{
              idle: "Save changes",
              loading: "Saving",
              success: "Saved",
            }}
          />
        </CardFooter>
      </Card>

      <Card className="bg-sidebar-accent/50 flex min-h-0 flex-col gap-0 rounded-lg border-0 p-2">
        <CardHeader className="mb-3 shrink-0 gap-0 border-0 px-0 pt-0.5 pb-0 pl-3">
          <CardTitle className="text-foreground text-base leading-none font-semibold">
            Existing customer settings
          </CardTitle>
          <CardDescription className="text-muted-foreground mt-0.5 text-sm">
            Rewards and terms for customers who refer others
          </CardDescription>
        </CardHeader>
        <div className="space-y-3">
          <ExistingCustomerBenefitsCard
            ref={existingBenefitsRef}
            referralProgram={referralProgram}
            skus={skus}
            onSubmit={handleUpdateExistingCustomerBenefits}
            embedded
            onDirtyChange={setExistingBenefitsDirty}
          />
          <TermsCard
            ref={existingTermsRef}
            title="Terms & Conditions"
            description="Terms for existing customers who refer others"
            value={referralProgram.termsAndConditionsExistingCustomer ?? []}
            fieldKey="termsAndConditionsExistingCustomer"
            onUpdateTerms={updateReferralProgramTerms}
            embedded
            onDirtyChange={setExistingTermsDirty}
          />
        </div>
        <CardFooter className="flex shrink-0 justify-end border-0 px-4 py-2">
          <SaveButton
            onSave={async () => {
              const tasks = [
                existingBenefitsRef.current?.save(),
                existingTermsRef.current?.save(),
              ].filter(Boolean) as Array<Promise<void>>;
              await Promise.all(tasks);
            }}
            disabled={!(existingBenefitsDirty || existingTermsDirty)}
            labels={{
              idle: "Save changes",
              loading: "Saving",
              success: "Saved",
            }}
          />
        </CardFooter>
      </Card>

      <ReferralNotificationsCard
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
    </div>
  );
}

type TermsItem = { id: string; content: string };
type TermsItemInput = { id?: string; content: string };

const REFERRAL_PAUSE_TERM =
  "The business may pause or end the referral program at any time. Existing earned rewards remain valid as per the configured expiry (if any).";
const REFERRAL_LOCK_TERM =
  "Referrer's cashback will be locked until the person they referred makes their first bill. Locked amount shows in bill redemption UI. The referred customer can use their reward normally.";

const SUGGESTED_DEFAULTS_NEW = [REFERRAL_PAUSE_TERM];
const SUGGESTED_DEFAULTS_EXISTING = [REFERRAL_LOCK_TERM, REFERRAL_PAUSE_TERM];

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

const TermsCard = forwardRef<
  SectionSaveHandle,
  {
    title: string;
    description: string;
    value: TermsItem[];
    fieldKey:
      | "termsAndConditionsNewCustomer"
      | "termsAndConditionsExistingCustomer";
    onUpdateTerms: (payload: {
      termsAndConditionsNewCustomer?: TermsItemInput[];
      termsAndConditionsExistingCustomer?: TermsItemInput[];
    }) => Promise<unknown>;
    embedded?: boolean;
    onDirtyChange?: (dirty: boolean) => void;
  }
>(function TermsCard(
  {
    title,
    description,
    value,
    fieldKey,
    onUpdateTerms,
    embedded = false,
    onDirtyChange,
  },
  ref,
) {
  const presetDisplayLabels =
    fieldKey === "termsAndConditionsExistingCustomer"
      ? SUGGESTED_DEFAULTS_EXISTING
      : SUGGESTED_DEFAULTS_NEW;
  const presetSet = new Set(presetDisplayLabels);
  const contentToId = new Map(value.map((t) => [t.content, t.id]));
  const items: TermsItemInput[] = Array.from(
    new Map(
      value.map((t) => [t.content, { id: t.id, content: t.content }]),
    ).values(),
  );
  const form = useForm<{ items: TermsItemInput[] }>({
    defaultValues: { items },
  });

  useEffect(() => {
    form.reset({ items });
  }, [value]);

  useEffect(() => {
    onDirtyChange?.(form.formState.isDirty);
  }, [form.formState.isDirty, onDirtyChange]);

  const watchItems = form.watch("items");

  const addPoint = () => {
    form.setValue("items", [...watchItems, { content: "" }], {
      shouldDirty: true,
    });
  };
  const removePoint = (index: number) => {
    form.setValue(
      "items",
      watchItems.filter((_, i) => i !== index),
      { shouldDirty: true },
    );
  };

  const runSubmit = async () => {
    const data = form.getValues();
    const normalized: TermsItemInput[] = Array.from(
      new Map(
        data.items
          .map((t) => ({ id: t.id, content: t.content.trim() }))
          .filter((t) => t.content.length > 0)
          .map((t) => [t.content, t] as const),
      ).values(),
    );
    await onUpdateTerms({ [fieldKey]: normalized });
    toast.success("Terms updated successfully");
    form.reset(data, { keepDefaultValues: false });
  };

  useImperativeHandle(
    ref,
    () => ({ save: runSubmit }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [form, value],
  );

  const content = (
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
            {embedded && (
              <div className="space-y-0.5">
                <p className="text-foreground text-sm font-semibold">{title}</p>
                <p className="text-muted-foreground text-xs">{description}</p>
              </div>
            )}
            <div className="mb-1 space-y-1">
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Suggested defaults
              </p>
              <div className="mt-1 grid gap-2 md:grid-cols-2">
                {presetDisplayLabels.map((label) => {
                  const current =
                    (form.getValues("items") as TermsItemInput[]) ?? [];
                  const isSelected = current.some((t) => t.content === label);
                  return (
                    <TermCard
                      key={label}
                      label={label}
                      checked={isSelected}
                      disabled={false}
                      onCheckedChange={(next) => {
                        const itemsNow =
                          (form.getValues("items") as TermsItemInput[]) ?? [];
                        const exists = itemsNow.some(
                          (t) => t.content === label,
                        );
                        const nextItems = next
                          ? exists
                            ? itemsNow
                            : [
                                ...itemsNow,
                                { id: contentToId.get(label), content: label },
                              ]
                          : itemsNow.filter((t) => t.content !== label);
                        form.setValue("items", nextItems, {
                          shouldDirty: true,
                        });
                      }}
                    />
                  );
                })}
              </div>
            </div>
            {watchItems.map((item, index) => {
              const valueAtIndex = item?.content ?? "";
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
                      next[index] = { ...next[index], content: e.target.value };
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
          {!embedded && (
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
          )}
        </form>
      </Form>
    </Card>
  );

  if (embedded) return content;

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
      {content}
    </Card>
  );
});
