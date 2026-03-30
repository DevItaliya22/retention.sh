"use client";

import { BrandingFormFields } from "@/components/common/form-sections";
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
  FormProvider,
  PixelIcon,
} from "@reelo/ui/components";
import { useCallback, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

const brandingFormSchema = z.object({
  branding: z.object({
    logo: z.string().max(2048).optional().nullable(),
    themeColor: z.string().max(7).optional().nullable(),
    textColor: z.string().max(7).optional().nullable(),
    bannerImage: z.string().max(2048).optional().nullable(),
    header: z.string().max(200).optional().nullable(),
    subtitle: z.string().max(500).optional().nullable(),
  }),
});

type BrandingFormValues = z.infer<typeof brandingFormSchema>;

export interface BrandingFieldGroupDefaultValues {
  logo?: string;
  themeColor?: string;
  textColor?: string;
  bannerImage?: string;
  header?: string;
  subtitle?: string;
}

export interface BrandingFieldGroupProps {
  title: string;
  description?: string;
  defaultValues: BrandingFieldGroupDefaultValues;
  onSubmit: (values: Record<string, string>) => Promise<{
    success: boolean;
    error?: string;
  }>;
}

function BrandingFieldGroupInner({
  title,
  description,
  defaultValues,
  onSubmit,
}: BrandingFieldGroupProps) {
  const resolvePendingUploadsRef = useRef<null | (() => Promise<void>)>(null);
  const [hasPendingImageChanges, setHasPendingImageChanges] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "loading" | "success">(
    "idle",
  );
  const handleResolvePendingUploads = useCallback(
    (resolver: () => Promise<void>) => {
      resolvePendingUploadsRef.current = resolver;
    },
    [],
  );

  const form = useForm<BrandingFormValues>({
    resolver: zodResolver(brandingFormSchema),
    defaultValues: {
      branding: {
        logo: defaultValues.logo || null,
        themeColor: defaultValues.themeColor || null,
        textColor: defaultValues.textColor || null,
        bannerImage: defaultValues.bannerImage || null,
        header: defaultValues.header || null,
        subtitle: defaultValues.subtitle || null,
      },
    },
  });

  const runSubmit = async () => {
    setSaveState("loading");

    try {
      if (resolvePendingUploadsRef.current) {
        try {
          await resolvePendingUploadsRef.current();
        } catch (error) {
          toast.error(
            error instanceof Error
              ? error.message
              : "Failed to upload image. Please try again.",
          );
          setSaveState("idle");
          return;
        }
      }

      const valid = await form.trigger();
      if (!valid) {
        toast.error("Please fix the errors below");
        setSaveState("idle");
        return;
      }

      const b = form.getValues().branding;
      const filteredValues: Record<string, string> = {
        logo: b.logo ?? "",
        themeColor: b.themeColor ?? "",
        textColor: b.textColor ?? "",
        bannerImage: b.bannerImage ?? "",
        header: b.header ?? "",
        subtitle: b.subtitle ?? "",
      };

      const result = await onSubmit(filteredValues);

      if (result.success) {
        toast.success("Settings updated successfully");
        const next = form.getValues();
        form.reset(next, { keepDefaultValues: false });
        setSaveState("success");
        setTimeout(() => {
          setSaveState("idle");
        }, 3000);
      } else {
        toast.error(result.error || "Failed to update settings");
        setSaveState("idle");
      }
    } catch {
      setSaveState("idle");
    }
  };

  return (
    <Card className="bg-sidebar-accent/50 flex min-h-0 flex-col gap-0 rounded-lg border-0 p-2">
      <CardHeader className="mb-3 shrink-0 gap-0 border-0 px-0 pt-0.5 pb-0 pl-3">
        <CardTitle className="text-foreground text-base leading-none font-semibold">
          {title}
        </CardTitle>
        {description && (
          <CardDescription className="text-muted-foreground mt-0.5 text-sm">
            {description}
          </CardDescription>
        )}
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
              <CardContent className="flex min-h-0 flex-1 flex-col gap-y-4 overflow-auto px-4 py-4">
                <BrandingFormFields
                  prefix="branding"
                  layout="settings"
                  onResolvePendingUploads={handleResolvePendingUploads}
                  onPendingImageChanges={setHasPendingImageChanges}
                />
              </CardContent>
              <CardFooter className="flex shrink-0 justify-end border-0 px-4 py-2">
                <Button
                  type="button"
                  onClick={runSubmit}
                  variant="outline"
                  disabled={
                    (!form.formState.isDirty && !hasPendingImageChanges) ||
                    saveState === "loading"
                  }
                  className="flex items-center gap-2"
                >
                  <span className="inline-flex items-center gap-2">
                    Save changes
                    {saveState !== "idle" && (
                      <PixelIcon
                        state={saveState === "loading" ? "loading" : "success"}
                      />
                    )}
                  </span>
                </Button>
              </CardFooter>
            </form>
          </Form>
        </FormProvider>
      </Card>
    </Card>
  );
}

/**
 * Branding block: images upload immediately to R2 via signed upload URL.
 */
export function BrandingFieldGroup(props: BrandingFieldGroupProps) {
  return <BrandingFieldGroupInner {...props} />;
}
