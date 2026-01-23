"use client";

import { PageLayout, ScaffoldContainer } from "@/components/layouts";
import type { CurrentBusiness } from "@/hooks/business/useCurrentBusiness";
import { useUpdateBusiness } from "@/hooks/business/useCurrentBusiness";
import {
  Button,
  Input,
  Form as UiForm,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@reelo/ui/components";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface BusinessExistingSettingsProps {
  business: CurrentBusiness;
}

interface BusinessSettingsFormValues {
  name: string;
  defaultPointsName: string;
  defaultCurrencySymbol: string;
  defaultCurrencyCode: string;
  logo: string;
  themeColor: string;
  header: string;
  subtitle: string;
}

export function BusinessExistingSettings({
  business,
}: BusinessExistingSettingsProps) {
  const { mutateAsync: updateBusiness, isPending } = useUpdateBusiness();

  const form = useForm<BusinessSettingsFormValues>({
    defaultValues: {
      name: business.name,
      defaultPointsName: business.defaultPointsName,
      defaultCurrencySymbol: business.defaultCurrencySymbol,
      defaultCurrencyCode: business.defaultCurrencyCode,
      logo: business.defaultBranding?.logo ?? "",
      themeColor: business.defaultBranding?.themeColor ?? "",
      header: business.defaultBranding?.header ?? "",
      subtitle: business.defaultBranding?.subtitle ?? "",
    },
  });

  useEffect(() => {
    form.reset({
      name: business.name,
      defaultPointsName: business.defaultPointsName,
      defaultCurrencySymbol: business.defaultCurrencySymbol,
      defaultCurrencyCode: business.defaultCurrencyCode,
      logo: business.defaultBranding?.logo ?? "",
      themeColor: business.defaultBranding?.themeColor ?? "",
      header: business.defaultBranding?.header ?? "",
      subtitle: business.defaultBranding?.subtitle ?? "",
    });
  }, [business, form]);

  const handleSubmit = async (values: BusinessSettingsFormValues) => {
    try {
      await updateBusiness({
        name: values.name,
        defaultPointsName: values.defaultPointsName,
        defaultCurrencySymbol: values.defaultCurrencySymbol,
        defaultCurrencyCode: values.defaultCurrencyCode,
        defaultBranding: {
          logo: values.logo || null,
          themeColor: values.themeColor || null,
          header: values.header || null,
          subtitle: values.subtitle || null,
        },
      });
      toast.success("Business settings updated");
    } catch (error: any) {
      toast.error(error.message || "Failed to update business settings");
    }
  };

  return (
    <PageLayout
      title="Business Settings"
      subtitle="Manage your business settings"
      size="default"
      scaffoldSectionClassName="h-full w-full pt-2 pb-0"
    >
      <ScaffoldContainer>
        <div className="flex w-full justify-center">
          <div className="w-full max-w-xl">
            <UiForm {...(form as any)}>
              <form
                className="space-y-6"
                onSubmit={form.handleSubmit(handleSubmit)}
              >
                <FormField
                  control={form.control as any}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Acme Store" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormItem>
                  <FormLabel>Business Slug</FormLabel>
                  <FormControl>
                    <Input
                      value={`reelo.in/${business.slug}`}
                      readOnly
                      className="bg-muted"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>

                <FormField
                  control={form.control as any}
                  name="defaultPointsName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Points Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Points" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control as any}
                  name="defaultCurrencySymbol"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency Symbol</FormLabel>
                      <FormControl>
                        <Input placeholder="₹" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control as any}
                  name="defaultCurrencyCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency Code</FormLabel>
                      <FormControl>
                        <Input placeholder="INR" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control as any}
                  name="logo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Logo URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control as any}
                  name="themeColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Theme Color</FormLabel>
                      <FormControl>
                        <Input placeholder="#7c3aed" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control as any}
                  name="header"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Header</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Welcome to Acme Store"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control as any}
                  name="subtitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subtitle</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Earn points on every purchase"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end">
                  <Button type="submit" disabled={isPending}>
                    {isPending ? "Saving..." : "Save changes"}
                  </Button>
                </div>
              </form>
            </UiForm>
          </div>
        </div>
      </ScaffoldContainer>
    </PageLayout>
  );
}

