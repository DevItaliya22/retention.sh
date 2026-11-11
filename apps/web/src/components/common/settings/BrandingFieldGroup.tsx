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
    <Card className="border-border/60 from-background via-background to-muted/20 overflow-hidden rounded-3xl border bg-gradient-to-br shadow-sm">
      <CardHeader className="border-border/50 gap-1 border-b px-5 py-4 sm:px-6">
        <CardTitle className="text-foreground text-base leading-none font-semibold">
          {title}
        </CardTitle>
        {description && (
          <CardDescription className="text-muted-foreground text-sm leading-relaxed">
            {description}
          </CardDescription>
        )}
      </CardHeader>

      <FormProvider {...form}>
        <Form {...form}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void runSubmit();
            }}
            className="flex min-h-0 flex-1 flex-col"
          >
            <CardContent className="flex min-h-0 flex-1 flex-col gap-y-5 px-5 py-5 sm:px-6">
              <BrandingFormFields
                prefix="branding"
                layout="settings"
                onResolvePendingUploads={handleResolvePendingUploads}
                onPendingImageChanges={setHasPendingImageChanges}
              />
            </CardContent>
            <CardFooter className="border-border/50 bg-muted/15 flex shrink-0 justify-end border-t px-5 py-4 sm:px-6">
              <Button
                type="button"
                onClick={runSubmit}
                disabled={
                  (!form.formState.isDirty && !hasPendingImageChanges) ||
                  saveState === "loading"
                }
                className="flex items-center gap-2"
              >
                <span className="inline-flex items-center gap-2">
                  {form.formState.isDirty || hasPendingImageChanges
                    ? "Save branding"
                    : "Saved"}
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
  );
}

/**
 * Branding block: images upload immediately to R2 via signed upload URL.
 */
export function BrandingFieldGroup(props: BrandingFieldGroupProps) {
  return <BrandingFieldGroupInner {...props} />;
}
