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
import { RefreshCw, Trash2 } from "lucide-react";
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
  return (
    <div className="flex flex-col gap-3">
      <div
        className="bg-muted/40 border-border/60 group relative flex h-28 w-full max-w-[280px] shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed"
        aria-hidden={!displayUrl}
      >
        {displayUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element -- R2 / arbitrary branding URLs */}
            <img
              src={displayUrl}
              alt=""
              className="max-h-full max-w-full object-contain"
            />
            <div className="absolute inset-0 bg-black/0 transition-colors duration-200 group-focus-within:bg-black/35 group-hover:bg-black/35" />
            <button
              type="button"
              aria-label="Remove image"
              disabled={chooseDisabled}
              onClick={onRemoveClick}
              className="absolute top-2 right-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-white opacity-0 shadow-sm transition-all duration-200 group-focus-within:opacity-100 group-hover:opacity-100 hover:bg-red-700 disabled:pointer-events-none disabled:opacity-40"
            >
              <Trash2 className="size-4" />
            </button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={chooseDisabled}
              onClick={onChooseClick}
              className="absolute top-1/2 left-1/2 h-8 -translate-x-1/2 -translate-y-1/2 rounded-full px-3 opacity-0 shadow-sm transition-all duration-200 group-focus-within:opacity-100 group-hover:opacity-100"
            >
              <RefreshCw className="mr-1.5 size-3.5" />
              Replace
            </Button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <span className="text-muted-foreground px-3 text-center text-xs">
              No image selected
            </span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={chooseDisabled}
              onClick={onChooseClick}
            >
              Choose image
            </Button>
          </div>
        )}
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
  resolveSignedUrl,
}: {
  field: ControllerRenderProps<FieldValues, FieldPath<FieldValues>>;
  pendingPreviewUrl?: string;
  setPendingFile: (file: File) => void;
  clearPendingFile: () => void;
  markDirty: () => void;
  isUploading: boolean;
  resolveSignedUrl: (src: string) => string | null;
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

  const displayUrl = resolveSignedUrl(
    pendingPreviewUrl || (field.value as string | null | undefined) || "",
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
  resolveSignedUrl,
}: {
  field: ControllerRenderProps<T, FieldPath<T>>;
  label: string;
  isSettings: boolean;
  pendingPreviewUrl?: string;
  setPendingFile: (file: File) => void;
  clearPendingFile: () => void;
  markDirty: () => void;
  isUploading: boolean;
  resolveSignedUrl: (src: string) => string | null;
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
      resolveSignedUrl,
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
      resolveSignedUrl: (src) => src || null,
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
  const { getUploadSignedUrl, getReadSignedUrl, isGettingUploadSignedUrl } =
    useR2Upload();
  const p = String(prefix);
  const isSettings = layout === "settings";
  const [pendingFiles, setPendingFiles] = useState<
    Partial<Record<BrandingImageUploadKind, File>>
  >({});
  const [pendingPreviews, setPendingPreviews] = useState<
    Partial<Record<BrandingImageUploadKind, string>>
  >({});
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
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

  useEffect(() => {
    const currentLogo =
      (form.getValues(`${p}.logo` as FieldPath<T>) as string) || "";
    const currentBanner =
      (form.getValues(`${p}.bannerImage` as FieldPath<T>) as string) || "";
    const candidates = [currentLogo, currentBanner].filter(
      (value) =>
        value &&
        !value.startsWith("blob:") &&
        !value.startsWith("http://") &&
        !value.startsWith("https://"),
    );
    if (candidates.length === 0) return;

    let isCancelled = false;
    void Promise.all(
      candidates.map(async (src) => {
        if (signedUrls[src]) return;
        const url = await getReadSignedUrl(src);
        if (isCancelled) return;
        setSignedUrls((prev) => ({ ...prev, [src]: url }));
      }),
    ).catch(() => {});

    return () => {
      isCancelled = true;
    };
  }, [form, p, getReadSignedUrl, signedUrls]);

  const resolveSignedUrl = useCallback(
    (src: string) => {
      if (!src) return null;
      if (src.startsWith("blob:")) return src;
      if (src.startsWith("http://") || src.startsWith("https://")) return src;
      return signedUrls[src] ?? null;
    },
    [signedUrls],
  );

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
          const result = await getUploadSignedUrl(file, {
            type:
              fieldConfig.uploadKind === "logo"
                ? "business_logo"
                : "business_banner",
          });
          const uploadRes = await fetch(result.uploadUrl, {
            method: "PUT",
            headers: {
              "content-type": file.type || "application/octet-stream",
            },
            body: file,
          });
          if (!uploadRes.ok) {
            throw new Error("Failed to upload image file");
          }
          form.setValue(
            fieldConfig.name,
            (result.key ?? null) as T[FieldPath<T>],
            {
              shouldDirty: true,
              shouldTouch: true,
            },
          );
          const signed = await getReadSignedUrl(result.key);
          setSignedUrls((prev) => ({ ...prev, [result.key]: signed }));
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
  }, [pendingFiles, imageFields, getUploadSignedUrl, getReadSignedUrl, form]);

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
              isUploading={isGettingUploadSignedUrl}
              resolveSignedUrl={resolveSignedUrl}
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
