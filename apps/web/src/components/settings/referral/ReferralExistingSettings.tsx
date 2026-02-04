"use client";

import { SettingsFieldGroup } from "@/components/common/settings/SettingsFieldGroup";
import type { ReferralProgram } from "@/hooks/referral/useReferralProgram";
import { useUpdateReferralProgram } from "@/hooks/referral/useReferralProgram";
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
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useTransition } from "react";
import type { Resolver } from "react-hook-form";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const BENEFIT_TYPES = [
  { value: "LOYALTY_BONUS", label: "Loyalty Points" },
  { value: "CASH_DISCOUNT", label: "Cash Discount" },
  { value: "PERCENTAGE_DISCOUNT", label: "Percentage Discount" },
  { value: "FREE_ITEM", label: "Free Item" },
] as const;

type NewCustomerFormValues = {
  newCustomerBenefitType:
    | "CASH_DISCOUNT"
    | "PERCENTAGE_DISCOUNT"
    | "FREE_ITEM"
    | "LOYALTY_BONUS";
  newCustomerBenefitValue: number;
  newCustomerBenefitExpiresInDays: number | "";
};

type ExistingCustomerFormValues = {
  existingCustomerBenefitType:
    | "CASH_DISCOUNT"
    | "PERCENTAGE_DISCOUNT"
    | "FREE_ITEM"
    | "LOYALTY_BONUS";
  existingCustomerBenefitValue: number;
  existingCustomerBenefitExpiresInDays: number | "";
};

const newCustomerSchema = z.object({
  newCustomerBenefitType: z.enum([
    "CASH_DISCOUNT",
    "PERCENTAGE_DISCOUNT",
    "FREE_ITEM",
    "LOYALTY_BONUS",
  ]),
  newCustomerBenefitValue: z.coerce.number().int().min(0),
  newCustomerBenefitExpiresInDays: z.union([
    z.coerce.number().int().min(1),
    z.literal(""),
  ]),
});

const existingCustomerSchema = z.object({
  existingCustomerBenefitType: z.enum([
    "CASH_DISCOUNT",
    "PERCENTAGE_DISCOUNT",
    "FREE_ITEM",
    "LOYALTY_BONUS",
  ]),
  existingCustomerBenefitValue: z.coerce.number().int().min(0),
  existingCustomerBenefitExpiresInDays: z.union([
    z.coerce.number().int().min(1),
    z.literal(""),
  ]),
});

interface ReferralExistingSettingsProps {
  referralProgram: ReferralProgram;
}

export function ReferralExistingSettings({
  referralProgram,
}: ReferralExistingSettingsProps) {
  const { mutateAsync: updateReferralProgram } = useUpdateReferralProgram();
  const [reminderPending, startReminderTransition] = useTransition();

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
      {/* New Customer Benefits */}
      <NewCustomerBenefitsCard
        referralProgram={referralProgram}
        onUpdate={updateReferralProgram}
      />

      {/* Existing Customer Benefits */}
      <ExistingCustomerBenefitsCard
        referralProgram={referralProgram}
        onUpdate={updateReferralProgram}
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

      {/* Information Sections (editable list) */}
      <InformationSectionsCard
        sections={
          (referralProgram.informationSections as Array<{
            title: string;
            content: string;
          }>) ?? []
        }
        onUpdate={updateReferralProgram}
      />

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

function NewCustomerBenefitsCard({
  referralProgram,
  onUpdate,
}: {
  referralProgram: ReferralProgram;
  onUpdate: ReturnType<typeof useUpdateReferralProgram>["mutateAsync"];
}) {
  const [isPending, startTransition] = useTransition();
  const form = useForm<NewCustomerFormValues>({
    resolver: zodResolver(newCustomerSchema) as Resolver<NewCustomerFormValues>,
    defaultValues: {
      newCustomerBenefitType: referralProgram.newCustomerBenefitType as
        | "CASH_DISCOUNT"
        | "PERCENTAGE_DISCOUNT"
        | "FREE_ITEM"
        | "LOYALTY_BONUS",
      newCustomerBenefitValue: referralProgram.newCustomerBenefitValue,
      newCustomerBenefitExpiresInDays:
        referralProgram.newCustomerBenefitExpiresInDays ?? "",
    },
  });

  const onSubmit = (values: NewCustomerFormValues) => {
    startTransition(async () => {
      try {
        await onUpdate({
          newCustomerBenefitType: values.newCustomerBenefitType,
          newCustomerBenefitValue: values.newCustomerBenefitValue,
          newCustomerBenefitExpiresInDays:
            values.newCustomerBenefitExpiresInDays === ""
              ? null
              : values.newCustomerBenefitExpiresInDays,
        });
        toast.success("Settings updated successfully");
      } catch (error: any) {
        toast.error(error.message || "Failed to update");
      }
    });
  };

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
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="flex flex-col gap-y-4 border-b px-6 py-4">
            <FormField
              control={form.control}
              name="newCustomerBenefitType"
              render={({ field }) => (
                <FormItem className="md:grid md:grid-cols-12">
                  <div className="col-span-4">
                    <FormLabel>Benefit Type</FormLabel>
                  </div>
                  <div className="col-span-8">
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {BENEFIT_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="newCustomerBenefitValue"
              render={({ field }) => (
                <FormItem className="md:grid md:grid-cols-12">
                  <div className="col-span-4">
                    <FormLabel>Benefit Value</FormLabel>
                  </div>
                  <div className="col-span-8">
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? Number(e.target.value) : 0,
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="newCustomerBenefitExpiresInDays"
              render={({ field }) => (
                <FormItem className="md:grid md:grid-cols-12">
                  <div className="col-span-4">
                    <FormLabel>Expires In (Days)</FormLabel>
                  </div>
                  <div className="col-span-8">
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Optional"
                        {...field}
                        value={field.value === null ? "" : field.value}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? Number(e.target.value) : "",
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
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

function ExistingCustomerBenefitsCard({
  referralProgram,
  onUpdate,
}: {
  referralProgram: ReferralProgram;
  onUpdate: ReturnType<typeof useUpdateReferralProgram>["mutateAsync"];
}) {
  const [isPending, startTransition] = useTransition();
  const form = useForm<ExistingCustomerFormValues>({
    resolver: zodResolver(
      existingCustomerSchema,
    ) as Resolver<ExistingCustomerFormValues>,
    defaultValues: {
      existingCustomerBenefitType:
        referralProgram.existingCustomerBenefitType as
          | "CASH_DISCOUNT"
          | "PERCENTAGE_DISCOUNT"
          | "FREE_ITEM"
          | "LOYALTY_BONUS",
      existingCustomerBenefitValue:
        referralProgram.existingCustomerBenefitValue,
      existingCustomerBenefitExpiresInDays:
        referralProgram.existingCustomerBenefitExpiresInDays ?? "",
    },
  });

  const onSubmit = (values: ExistingCustomerFormValues) => {
    startTransition(async () => {
      try {
        await onUpdate({
          existingCustomerBenefitType: values.existingCustomerBenefitType,
          existingCustomerBenefitValue: values.existingCustomerBenefitValue,
          existingCustomerBenefitExpiresInDays:
            values.existingCustomerBenefitExpiresInDays === ""
              ? null
              : values.existingCustomerBenefitExpiresInDays,
        });
        toast.success("Settings updated successfully");
      } catch (error: any) {
        toast.error(error.message || "Failed to update");
      }
    });
  };

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
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="flex flex-col gap-y-4 border-b px-6 py-4">
            <FormField
              control={form.control}
              name="existingCustomerBenefitType"
              render={({ field }) => (
                <FormItem className="md:grid md:grid-cols-12">
                  <div className="col-span-4">
                    <FormLabel>Benefit Type</FormLabel>
                  </div>
                  <div className="col-span-8">
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {BENEFIT_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="existingCustomerBenefitValue"
              render={({ field }) => (
                <FormItem className="md:grid md:grid-cols-12">
                  <div className="col-span-4">
                    <FormLabel>Benefit Value</FormLabel>
                  </div>
                  <div className="col-span-8">
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? Number(e.target.value) : 0,
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="existingCustomerBenefitExpiresInDays"
              render={({ field }) => (
                <FormItem className="md:grid md:grid-cols-12">
                  <div className="col-span-4">
                    <FormLabel>Expires In (Days)</FormLabel>
                  </div>
                  <div className="col-span-8">
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Optional"
                        {...field}
                        value={field.value === null ? "" : field.value}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? Number(e.target.value) : "",
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
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
          <CardContent className="border-b px-6 py-4 space-y-4">
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
          <CardContent className="border-b px-6 py-4 space-y-3">
            {watchItems.map((_, index) => (
              <div key={index} className="flex gap-2 items-start">
                <FormField
                  control={form.control}
                  name={`items.${index}`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Textarea
                          placeholder={`Point ${index + 1}`}
                          className="min-h-[60px]"
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
                  className="shrink-0 mt-2"
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
