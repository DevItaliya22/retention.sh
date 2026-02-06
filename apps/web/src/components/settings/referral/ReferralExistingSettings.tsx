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
  Switch,
  Textarea,
} from "@reelo/ui/components";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

const BENEFIT_TYPE_OPTIONS = [
  { value: "LOYALTY_BONUS", label: "Loyalty Points" },
  { value: "CASH_DISCOUNT", label: "Cash Discount" },
  { value: "PERCENTAGE_DISCOUNT", label: "Percentage Discount" },
  { value: "FREE_ITEM", label: "Free Item" },
];

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

  const handleUpdateNewCustomerBenefits = async (
    values: Record<string, string>,
  ) => {
    try {
      await updateReferralProgram({
        newCustomerBenefitType: values.newCustomerBenefitType as any,
        newCustomerBenefitValue: Number(values.newCustomerBenefitValue) || 0,
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
    values: Record<string, string>,
  ) => {
    try {
      await updateReferralProgram({
        existingCustomerBenefitType: values.existingCustomerBenefitType as any,
        existingCustomerBenefitValue:
          Number(values.existingCustomerBenefitValue) || 0,
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
      {/* New Customer Benefits */}
      <SettingsFieldGroup
        title="New Customer Benefits"
        description="Rewards for customers who join through a referral link"
        fields={[
          {
            name: "newCustomerBenefitType",
            label: "Benefit Type",
            type: "select",
            options: BENEFIT_TYPE_OPTIONS,
          },
          {
            name: "newCustomerBenefitValue",
            label: "Benefit Value",
            type: "number",
            placeholder: "100",
            min: 0,
          },
          {
            name: "newCustomerBenefitExpiresInDays",
            label: "Expires In (Days)",
            type: "number",
            placeholder: "Optional",
            optional: true,
            min: 1,
          },
        ]}
        defaultValues={{
          newCustomerBenefitType: referralProgram.newCustomerBenefitType,
          newCustomerBenefitValue: String(
            referralProgram.newCustomerBenefitValue,
          ),
          newCustomerBenefitExpiresInDays:
            referralProgram.newCustomerBenefitExpiresInDays
              ? String(referralProgram.newCustomerBenefitExpiresInDays)
              : "",
        }}
        onSubmit={handleUpdateNewCustomerBenefits}
      />

      {/* Existing Customer Benefits */}
      <SettingsFieldGroup
        title="Existing Customer Benefits"
        description="Rewards for customers who refer others"
        fields={[
          {
            name: "existingCustomerBenefitType",
            label: "Benefit Type",
            type: "select",
            options: BENEFIT_TYPE_OPTIONS,
          },
          {
            name: "existingCustomerBenefitValue",
            label: "Benefit Value",
            type: "number",
            placeholder: "50",
            min: 0,
          },
          {
            name: "existingCustomerBenefitExpiresInDays",
            label: "Expires In (Days)",
            type: "number",
            placeholder: "Optional",
            optional: true,
            min: 1,
          },
        ]}
        defaultValues={{
          existingCustomerBenefitType:
            referralProgram.existingCustomerBenefitType,
          existingCustomerBenefitValue: String(
            referralProgram.existingCustomerBenefitValue,
          ),
          existingCustomerBenefitExpiresInDays:
            referralProgram.existingCustomerBenefitExpiresInDays
              ? String(referralProgram.existingCustomerBenefitExpiresInDays)
              : "",
        }}
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
