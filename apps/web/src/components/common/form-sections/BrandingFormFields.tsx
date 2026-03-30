"use client";

import { useR2Upload } from "@/hooks/storage/useR2Upload";
import { useSignedImageUrl } from "@/hooks/storage/useSignedImageUrl";
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
import { useCallback, useEffect, useRef, useState } from "react";
import type {
  ControllerRenderProps,
  FieldPath,
  FieldValues,
} from "react-hook-form";
import { toast } from "sonner";

const SETTINGS_ROW_CLASS = "flex flex-col gap-2 md:grid md:grid-cols-12";
const SETTINGS_LABEL_CLASS = "col-span-4 flex flex-col gap-2";
const SETTINGS_CONTROL_CLASS = "col-span-8 flex flex-col gap-1";

export type BrandingImageUploadKind = "logo" | "banner";

interface BrandingFormFieldsProps<T extends FieldValues> {
  prefix?: FieldPath<T> | string;
  layout?: "default" | "settings";
  onResolvePendingUploads?: (resolver: () => Promise<void>) => void;
  onPendingImageChanges?: (hasPending: boolean) => void;
}

function BrandingImageUploadControl({
  displayUrl,
  onChooseClick,
  onRemoveClick,
  chooseDisabled,
}: {
  displayUrl: string | null;
  onChooseClick: () => void;
  onRemoveClick: () => void;
  chooseDisabled: boolean;
}) {
  const showRemove = !!displayUrl;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
      <div
        className="bg-muted/40 border-border/60 relative flex h-28 w-full max-w-[280px] shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed"
        aria-hidden={!displayUrl}
      >
        {displayUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- R2 / arbitrary branding URLs
          <img
            src={displayUrl}
            alt=""
            className="max-h-full max-w-full object-contain"
          />
        ) : (
          <span className="text-muted-foreground px-3 text-center text-xs">
            No image selected
          </span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={chooseDisabled}
          onClick={onChooseClick}
        >
          {displayUrl ? "Replace image" : "Choose image"}
        </Button>
        {showRemove ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="text-muted-foreground"
            disabled={chooseDisabled}
            onClick={onRemoveClick}
          >
            Remove
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function validateBrandingImage(file: File) {
  const maxSizeMb = 10;
  const maxBytes = maxSizeMb * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error(`Image must be smaller than ${maxSizeMb}MB`);
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose a valid image file");
  }
}

function useBrandingImageField({
  field,
  pendingPreviewUrl,
  setPendingFile,
  clearPendingFile,
  markDirty,
  isUploading,
}: {
  field: ControllerRenderProps<FieldValues, FieldPath<FieldValues>>;
  pendingPreviewUrl?: string;
  setPendingFile: (file: File) => void;
  clearPendingFile: () => void;
  markDirty: () => void;
  isUploading: boolean;
}) {
  const pickFile = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        validateBrandingImage(file);
        setPendingFile(file);
        markDirty();
        toast.success("Image selected. Click Save changes to upload.");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to select image");
      }
    };
    input.click();
  }, [setPendingFile, markDirty]);

  const remove = useCallback(() => {
    clearPendingFile();
    field.onChange(null);
  }, [clearPendingFile, field]);

  const displayUrl = useSignedImageUrl(
    pendingPreviewUrl || (field.value as string | null | undefined) || null,
  );

  // Keep existing behavior of trimming empty strings to null if an external caller sets ""
  useEffect(() => {
    if (field.value === "") {
      field.onChange(null);
    }
  }, [field]);

  return {
    displayUrl,
    pickFile,
    remove,
    chooseDisabled: isUploading,
  };
}

function BrandingImageFieldRow<T extends FieldValues>({
  field,
  label,
  isSettings,
  pendingPreviewUrl,
  setPendingFile,
  clearPendingFile,
  markDirty,
  isUploading,
}: {
  field: ControllerRenderProps<T, FieldPath<T>>;
  label: string;
  isSettings: boolean;
  pendingPreviewUrl?: string;
  setPendingFile: (file: File) => void;
  clearPendingFile: () => void;
  markDirty: () => void;
  isUploading: boolean;
}) {
  const { displayUrl, pickFile, remove, chooseDisabled } =
    useBrandingImageField({
      field: field as ControllerRenderProps<
        FieldValues,
        FieldPath<FieldValues>
      >,
      pendingPreviewUrl,
      setPendingFile,
      clearPendingFile,
      markDirty,
      isUploading,
    });

  return (
    <FormItem className={isSettings ? SETTINGS_ROW_CLASS : undefined}>
      {isSettings ? (
        <>
          <div className={SETTINGS_LABEL_CLASS}>
            <FormLabel className="text-sm">{label}</FormLabel>
          </div>
          <div className={SETTINGS_CONTROL_CLASS}>
            <FormControl>
              <BrandingImageUploadControl
                displayUrl={displayUrl}
                onChooseClick={pickFile}
                onRemoveClick={remove}
                chooseDisabled={chooseDisabled}
              />
            </FormControl>
            <FormMessage />
          </div>
        </>
      ) : (
        <>
          <Label className="text-sm">{label}</Label>
          <FormControl>
            <BrandingImageUploadControl
              displayUrl={displayUrl}
              onChooseClick={pickFile}
              onRemoveClick={remove}
              chooseDisabled={chooseDisabled}
            />
          </FormControl>
          <FormMessage />
        </>
      )}
    </FormItem>
  );
}

function BrandingImageUploadFormFieldInner<T extends FieldValues>({
  field,
  label,
  formMessageVariant,
}: {
  field: ControllerRenderProps<T, FieldPath<T>>;
  label: string;
  formMessageVariant?: "banner";
}) {
  const { displayUrl, pickFile, remove, chooseDisabled } =
    useBrandingImageField({
      field: field as ControllerRenderProps<
        FieldValues,
        FieldPath<FieldValues>
      >,
      pendingPreviewUrl: undefined,
      setPendingFile: () => {},
      clearPendingFile: () => {},
      markDirty: () => {},
      isUploading: false,
    });

  return (
    <FormItem>
      <FormLabel>{label}</FormLabel>
      <FormControl>
        <BrandingImageUploadControl
          displayUrl={displayUrl}
          onChooseClick={pickFile}
          onRemoveClick={remove}
          chooseDisabled={chooseDisabled}
        />
      </FormControl>
      <FormMessage variant={formMessageVariant} />
    </FormItem>
  );
}

export function BrandingImageUploadFormField<T extends FieldValues>({
  name,
  label,
  formMessageVariant,
}: {
  name: FieldPath<T>;
  label: string;
  formMessageVariant?: "banner";
}) {
  const form = useFormContext<T>();

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <BrandingImageUploadFormFieldInner
          field={field}
          label={label}
          formMessageVariant={formMessageVariant}
        />
      )}
    />
  );
}

export function BrandingFormFields<T extends FieldValues>({
  prefix = "branding",
  layout = "default",
  onResolvePendingUploads,
  onPendingImageChanges,
}: BrandingFormFieldsProps<T>) {
  const form = useFormContext<T>();
  const { uploadFile, isUploading } = useR2Upload();
  const p = String(prefix);
  const isSettings = layout === "settings";
  const [pendingFiles, setPendingFiles] = useState<
    Partial<Record<BrandingImageUploadKind, File>>
  >({});
  const [pendingPreviews, setPendingPreviews] = useState<
    Partial<Record<BrandingImageUploadKind, string>>
  >({});
  const pendingPreviewsRef = useRef<
    Partial<Record<BrandingImageUploadKind, string>>
  >({});

  const textFields = [
    {
      name: `${p}.themeColor` as FieldPath<T>,
      label: "Theme Color",
      placeholder: "#7c3aed",
      type: "color" as const,
    },
    {
      name: `${p}.textColor` as FieldPath<T>,
      label: "Text Color",
      placeholder: "#ffffff",
      type: "color" as const,
    },
    {
      name: `${p}.header` as FieldPath<T>,
      label: "Header",
      placeholder: "Welcome to our loyalty program",
      type: "text" as const,
    },
    {
      name: `${p}.subtitle` as FieldPath<T>,
      label: "Subtitle",
      placeholder: "Earn points on every purchase",
      type: "text" as const,
    },
  ] as const;

  const imageFields = [
    {
      name: `${p}.logo` as FieldPath<T>,
      label: "Logo",
      uploadKind: "logo" as const,
    },
    {
      name: `${p}.bannerImage` as FieldPath<T>,
      label: "Banner image",
      uploadKind: "banner" as const,
    },
  ] as const;

  useEffect(() => {
    pendingPreviewsRef.current = pendingPreviews;
  }, [pendingPreviews]);

  useEffect(() => {
    return () => {
      Object.values(pendingPreviewsRef.current).forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, []);

  const setPendingFile = useCallback(
    (kind: BrandingImageUploadKind, file: File) => {
      const nextPreviewUrl = URL.createObjectURL(file);
      setPendingFiles((prev) => ({ ...prev, [kind]: file }));
      setPendingPreviews((prev) => {
        const existing = prev[kind];
        if (existing) {
          URL.revokeObjectURL(existing);
        }
        return { ...prev, [kind]: nextPreviewUrl };
      });
    },
    [],
  );

  const clearPendingFile = useCallback((kind: BrandingImageUploadKind) => {
    setPendingFiles((prev) => {
      const next = { ...prev };
      delete next[kind];
      return next;
    });
    setPendingPreviews((prev) => {
      const existing = prev[kind];
      if (existing) {
        URL.revokeObjectURL(existing);
      }
      const next = { ...prev };
      delete next[kind];
      return next;
    });
  }, []);

  const resolvePendingImageUploads = useCallback(async () => {
    const fileByKind = pendingFiles;
    const uploadTasks: Array<Promise<void>> = [];

    for (const fieldConfig of imageFields) {
      const file = fileByKind[fieldConfig.uploadKind];
      if (!file) continue;

      uploadTasks.push(
        (async () => {
          const result = await uploadFile(file, {
            type:
              fieldConfig.uploadKind === "logo"
                ? "business_logo"
                : "business_banner",
          });
          form.setValue(
            fieldConfig.name,
            (result.url ?? null) as T[FieldPath<T>],
            {
              shouldDirty: true,
              shouldTouch: true,
            },
          );
        })(),
      );
    }

    await Promise.all(uploadTasks);
    setPendingFiles({});
    setPendingPreviews((prev) => {
      Object.values(prev).forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
      return {};
    });
  }, [pendingFiles, imageFields, uploadFile, form]);

  useEffect(() => {
    if (!onResolvePendingUploads) return;
    onResolvePendingUploads(resolvePendingImageUploads);
  }, [onResolvePendingUploads, resolvePendingImageUploads]);

  useEffect(() => {
    if (!onPendingImageChanges) return;
    onPendingImageChanges(Object.keys(pendingFiles).length > 0);
  }, [onPendingImageChanges, pendingFiles]);

  return (
    <div className="space-y-4">
      {imageFields.map(({ name, label, uploadKind }) => (
        <FormField
          key={String(name)}
          control={form.control}
          name={name}
          render={({ field }) => (
            <BrandingImageFieldRow
              field={field}
              label={label}
              isSettings={isSettings}
              pendingPreviewUrl={pendingPreviews[uploadKind]}
              setPendingFile={(file) => setPendingFile(uploadKind, file)}
              clearPendingFile={() => clearPendingFile(uploadKind)}
              markDirty={() =>
                form.setValue(name, form.getValues(name), {
                  shouldDirty: true,
                  shouldTouch: true,
                })
              }
              isUploading={isUploading}
            />
          )}
        />
      ))}

      {textFields.map(({ name, label, placeholder, type }) => (
        <FormField
          key={String(name)}
          control={form.control}
          name={name}
          render={({ field }) => (
            <FormItem className={isSettings ? SETTINGS_ROW_CLASS : undefined}>
              {isSettings ? (
                <>
                  <div className={SETTINGS_LABEL_CLASS}>
                    <FormLabel className="text-sm">{label}</FormLabel>
                  </div>
                  <div className={SETTINGS_CONTROL_CLASS}>
                    <FormControl>
                      {type === "color" ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={(field.value as string) || "#7c3aed"}
                            onChange={(e) => field.onChange(e.target.value)}
                            className="border-border h-9 w-12 cursor-pointer rounded border bg-transparent p-1"
                            aria-label={`${label} picker`}
                          />
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
                        </div>
                      ) : (
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
                      )}
                    </FormControl>
                    <FormMessage />
                  </div>
                </>
              ) : (
                <>
                  <Label className="text-sm">{label}</Label>
                  <FormControl>
                    {type === "color" ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={(field.value as string) || "#7c3aed"}
                          onChange={(e) => field.onChange(e.target.value)}
                          className="border-border h-9 w-12 cursor-pointer rounded border bg-transparent p-1"
                          aria-label={`${label} picker`}
                        />
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
                      </div>
                    ) : (
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
                    )}
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
