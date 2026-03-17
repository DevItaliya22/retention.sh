"use client";

import { useR2Upload } from "@/hooks/storage/useR2Upload";
import {
  Button,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Label,
  useFormContext,
} from "@reelo/ui/components";
import { useState } from "react";
import type { FieldPath, FieldValues } from "react-hook-form";

const SETTINGS_ROW_CLASS = "flex flex-col gap-2 md:grid md:grid-cols-12";
const SETTINGS_LABEL_CLASS = "col-span-4 flex flex-col gap-2";
const SETTINGS_CONTROL_CLASS = "col-span-8 flex flex-col gap-1";

interface BrandingFormFieldsProps<T extends FieldValues> {
  /** Field prefix, e.g. "branding" for branding.logo, branding.themeColor, etc. */
  prefix?: FieldPath<T> | string;
  /** Use label-left, value-right layout like general settings page */
  layout?: "default" | "settings";
}

/** Reusable branding form fields (logo, themeColor, textColor, bannerImage, header, subtitle). */
export function BrandingFormFields<T extends FieldValues>({
  prefix = "branding",
  layout = "default",
}: BrandingFormFieldsProps<T>) {
  const form = useFormContext<T>();
  const p = String(prefix);
  const isSettings = layout === "settings";
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const { uploadFile } = useR2Upload();

  const fields = [
    {
      name: `${p}.logo` as FieldPath<T>,
      label: "Logo URL",
      placeholder: "https://...",
      isImage: true,
      uploadingFlag: "logo" as const,
    },
    {
      name: `${p}.themeColor` as FieldPath<T>,
      label: "Theme Color",
      placeholder: "#7c3aed",
    },
    {
      name: `${p}.textColor` as FieldPath<T>,
      label: "Text Color",
      placeholder: "#ffffff",
    },
    {
      name: `${p}.bannerImage` as FieldPath<T>,
      label: "Banner Image URL",
      placeholder: "https://...",
      isImage: true,
      uploadingFlag: "banner" as const,
    },
    {
      name: `${p}.header` as FieldPath<T>,
      label: "Header",
      placeholder: "Welcome to our loyalty program",
    },
    {
      name: `${p}.subtitle` as FieldPath<T>,
      label: "Subtitle",
      placeholder: "Earn points on every purchase",
    },
  ];

  const handleImageUpload = async (
    file: File,
    target: "logo" | "banner",
    onChange: (value: string | null) => void,
  ) => {
    const setUploading =
      target === "logo" ? setIsUploadingLogo : setIsUploadingBanner;
    setUploading(true);
    try {
      const result = await uploadFile(file, {
        type: target === "logo" ? "business_logo" : "business_banner",
      });
      onChange(result.url ?? null);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {fields.map(({ name, label, placeholder, isImage, uploadingFlag }) => (
        <FormField
          key={String(name)}
          control={form.control}
          name={name}
          render={({ field }) => (
            <FormItem className={isSettings ? SETTINGS_ROW_CLASS : undefined}>
              {isSettings ? (
                <div className={SETTINGS_LABEL_CLASS}>
                  <FormLabel className="text-sm">{label}</FormLabel>
                </div>
              ) : (
                <Label className="text-sm">{label}</Label>
              )}
              {isSettings ? (
                <div className={SETTINGS_CONTROL_CLASS}>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <Input
                        variant="underline"
                        placeholder={placeholder}
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === "" ? null : e.target.value,
                          )
                        }
                      />
                      {isImage && (
                        <Button
                          type="button"
                          size="xs"
                          variant="outline"
                          disabled={
                            uploadingFlag === "logo"
                              ? isUploadingLogo
                              : isUploadingBanner
                          }
                          onClick={() => {
                            const input = document.createElement("input");
                            input.type = "file";
                            input.accept = "image/*";
                            input.onchange = async () => {
                              const file = input.files?.[0];
                              if (!file) return;
                              await handleImageUpload(
                                file,
                                uploadingFlag!,
                                (v) => field.onChange(v),
                              );
                            };
                            input.click();
                          }}
                        >
                          {uploadingFlag === "logo"
                            ? isUploadingLogo
                              ? "Uploading..."
                              : "Upload"
                            : isUploadingBanner
                              ? "Uploading..."
                              : "Upload"}
                        </Button>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </div>
              ) : (
                <>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <Input
                        variant="underline"
                        placeholder={placeholder}
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === "" ? null : e.target.value,
                          )
                        }
                      />
                      {isImage && (
                        <Button
                          type="button"
                          size="xs"
                          variant="outline"
                          disabled={
                            uploadingFlag === "logo"
                              ? isUploadingLogo
                              : isUploadingBanner
                          }
                          onClick={() => {
                            const input = document.createElement("input");
                            input.type = "file";
                            input.accept = "image/*";
                            input.onchange = async () => {
                              const file = input.files?.[0];
                              if (!file) return;
                              await handleImageUpload(
                                file,
                                uploadingFlag!,
                                (v) => field.onChange(v),
                              );
                            };
                            input.click();
                          }}
                        >
                          {uploadingFlag === "logo"
                            ? isUploadingLogo
                              ? "Uploading..."
                              : "Upload"
                            : isUploadingBanner
                              ? "Uploading..."
                              : "Upload"}
                        </Button>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </>
              )}
            </FormItem>
          )}
        />
      ))}
    </div>
  );
}
