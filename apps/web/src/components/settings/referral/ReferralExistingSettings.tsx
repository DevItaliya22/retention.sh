"use client";

import { SettingsFieldGroup } from "@/components/common/settings/SettingsFieldGroup";
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
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Textarea,
} from "@reelo/ui/components";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useTransition } from "react";
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
    values: Record<string, string | undefined>,
  ) => Promise<{ success: boolean; error?: string }>;
}) {
  const [isPending, startTransition] = useTransition();
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

  return (
    <Card className="gap-0 p-0!">
      <CardHeader className="flex flex-col gap-0 border-b py-2!">
        <CardTitle className="text-base font-medium">
          New Customer Benefits
        </CardTitle>
        <CardDescription className="text-xs">
          Rewards for customers who join through a referral link
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((values) =>
            startTransition(async () => {
              const result = await onSubmit(values);
              if (result.success)
                toast.success("Settings updated successfully");
              else toast.error(result.error || "Failed to update");
            }),
          )}
        >
          <CardContent className="flex flex-col gap-y-4 border-b px-6 py-4">
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
          <CardFooter className="flex justify-end px-6 py-2">
            <Button
              type="submit"
              disabled={isPending || !form.formState.isDirty}
              loading={isPending}
            >
              Save changes
            </Button>
          </CardFooter>
        </form>
      </Form>
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
    values: Record<string, string | undefined>,
  ) => Promise<{ success: boolean; error?: string }>;
}) {
  const [isPending, startTransition] = useTransition();
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
    });
  }, [referralProgram, form]);

  return (
    <Card className="gap-0 p-0!">
      <CardHeader className="flex flex-col gap-0 border-b py-2!">
        <CardTitle className="text-base font-medium">
          Existing Customer Benefits
        </CardTitle>
        <CardDescription className="text-xs">
          Rewards for customers who refer others
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((values) =>
            startTransition(async () => {
              const result = await onSubmit(values);
              if (result.success)
                toast.success("Settings updated successfully");
              else toast.error(result.error || "Failed to update");
            }),
          )}
        >
          <CardContent className="flex flex-col gap-y-4 border-b px-6 py-4">
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
          </CardContent>
          <CardFooter className="flex justify-end px-6 py-2">
            <Button
              type="submit"
              disabled={isPending || !form.formState.isDirty}
              loading={isPending}
            >
              Save changes
            </Button>
          </CardFooter>
        </form>
      </Form>
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
  const [reminderPending, startReminderTransition] = useTransition();
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
    values: Record<string, string | undefined>,
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
    values: Record<string, string | undefined>,
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
      });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || "Failed to update" };
    }
  };

  const handleReminderChange = async (value: boolean) => {
    startReminderTransition(async () => {
      try {
        await updateReferralProgram({ sendReminderToCustomer: value });
        toast.success("Settings updated successfully");
      } catch (error: any) {
        toast.error(error.message || "Failed to update");
      }
    });
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

      {/* Send reminder */}
      <Card className="gap-0 p-0!">
        <CardHeader className="flex flex-col gap-0 border-b py-2!">
          <CardTitle className="text-base font-medium">Send Reminder</CardTitle>
          <CardDescription className="text-xs">
            Send reminder notifications to customers about their referral
            rewards
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-row items-center justify-between px-6 py-4">
          <span className="text-sm">Send reminder to customer</span>
          <Switch
            checked={referralProgram.sendReminderToCustomer}
            onCheckedChange={handleReminderChange}
            disabled={reminderPending}
          />
        </CardContent>
      </Card>

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
      <SettingsFieldGroup
        title="Branding"
        description="Customize appearance of referral pages"
        fields={[
          {
            name: "logo",
            label: "Logo URL",
            placeholder: "https://...",
            helpText: "Image URL for your logo.",
          },
          {
            name: "themeColor",
            label: "Theme Color",
            placeholder: "#7c3aed",
            helpText: "Hex color (e.g. #7c3aed).",
          },
          {
            name: "textColor",
            label: "Text Color",
            placeholder: "#ffffff",
            helpText: "Hex color for text.",
          },
          {
            name: "bannerImage",
            label: "Banner Image URL",
            placeholder: "https://...",
            helpText: "Image URL for banner.",
          },
          {
            name: "header",
            label: "Header",
            placeholder: "Welcome",
            helpText: "Main heading on referral pages.",
          },
          {
            name: "subtitle",
            label: "Subtitle",
            placeholder: "Earn rewards",
            helpText: "Subheading or short description.",
          },
        ]}
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
  const [isPending, startTransition] = useTransition();
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

  const onSubmit = (data: {
    sections: Array<{ title: string; content: string }>;
  }) => {
    startTransition(async () => {
      try {
        const filtered = data.sections.filter(
          (s) => s.title.trim() !== "" || s.content.trim() !== "",
        );
        await onUpdate({ informationSections: filtered });
        toast.success("Information sections updated");
      } catch (error: any) {
        toast.error(error.message || "Failed to update");
      }
    });
  };

  return (
    <Card className="gap-0 p-0!">
      <CardHeader className="flex flex-col gap-0 border-b py-2!">
        <CardTitle className="text-base font-medium">
          How customers know more about you
        </CardTitle>
        <CardDescription className="text-xs">
          Information sections shown on referral pages
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4 border-b px-6 py-4">
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
          <CardFooter className="flex justify-end border-t px-6 py-4">
            <Button
              type="submit"
              disabled={isPending || !form.formState.isDirty}
              loading={isPending}
            >
              Save changes
            </Button>
          </CardFooter>
        </form>
      </Form>
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
  const [isPending, startTransition] = useTransition();
  const items = value.map((t) => t.content);
  const form = useForm<{ items: string[] }>({
    defaultValues: {
      items: items.length > 0 ? items : [""],
    },
  });
  useEffect(() => {
    form.reset({
      items: items.length > 0 ? items : [""],
    });
  }, [value]);

  const watchItems = form.watch("items");

  const addPoint = () => {
    form.setValue("items", [...watchItems, ""], { shouldDirty: true });
  };
  const removePoint = (index: number) => {
    const next = watchItems.filter((_, i) => i !== index);
    form.setValue("items", next.length > 0 ? next : [""], {
      shouldDirty: true,
    });
  };

  const onSubmit = (data: { items: string[] }) => {
    startTransition(async () => {
      try {
        const filtered = data.items
          .map((s) => s.trim())
          .filter((s) => s.length > 0);
        await onUpdate({ [fieldKey]: filtered });
        toast.success("Terms updated successfully");
      } catch (error: any) {
        toast.error(error.message || "Failed to update");
      }
    });
  };

  return (
    <Card className="gap-0 p-0!">
      <CardHeader className="flex flex-col gap-0 border-b py-2!">
        <CardTitle className="text-base font-medium">{title}</CardTitle>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-3 border-b px-6 py-4">
            {watchItems.map((_, index) => (
              <div key={index} className="flex items-start gap-2">
                <FormField
                  control={form.control}
                  name={`items.${index}`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Textarea
                          variant="underline"
                          placeholder={`Point ${index + 1}`}
                          {...field}
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
                  onClick={() => removePoint(index)}
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
              onClick={addPoint}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add point
            </Button>
          </CardContent>
          <CardFooter className="flex justify-end border-t px-6 py-4">
            <Button
              type="submit"
              disabled={isPending || !form.formState.isDirty}
              loading={isPending}
            >
              Save changes
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
