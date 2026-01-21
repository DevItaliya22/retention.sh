"use client";

import { useState } from "react";
import { 
  Button, 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  Form,
} from "@reelo/ui/components";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateBusinessSchema } from "@/lib/schemas/business-settings";
import { updateBusinessSettings } from "@/lib/actions/business-settings";
import { toast } from "sonner";
import { z } from "zod";
import { BusinessInfoFields } from "../../../shared/BusinessInfoFields";

interface BusinessSettingsStepProps {
  initialData: any;
}

export function BusinessSettingsStep({ initialData }: BusinessSettingsStepProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof updateBusinessSchema>>({
    resolver: zodResolver(updateBusinessSchema),
    defaultValues: {
      businessName: initialData?.name || "",
      businessSlug: initialData?.slug || "",
      defaultPointsName: initialData?.defaultPointsName || "Points",
      defaultCurrencySymbol: initialData?.defaultCurrencySymbol || "₹",
      defaultCurrencyCode: initialData?.defaultCurrencyCode || "INR",
      themeColor: initialData?.defaultBranding?.themeColor || "",
    },
  });

  const onUpdate = async (values: z.infer<typeof updateBusinessSchema>) => {
    setIsLoading(true);
    const result = await updateBusinessSettings(values);
    setIsLoading(false);
    if (result.success) {
      toast.success("Business settings updated!");
    } else {
      toast.error(result.error || "Failed to update business");
    }
  };

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader>
        <CardTitle>Business Information</CardTitle>
        <CardDescription>
          Update your business details and branding.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...(form as any)}>
          <form onSubmit={form.handleSubmit(onUpdate)} className="space-y-6">
            <BusinessInfoFields control={form.control as any} />
            <div className="pt-4 border-t flex justify-end">
              <Button type="submit" loading={isLoading} className="px-8">
                Save Changes
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
