"use client";

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
  Label,
  SaveButton,
  Skeleton,
  Switch,
  Textarea,
} from "@reelo/ui/components";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

interface SettingsFieldProps {
  title: string;
  description?: string;
  onSubmit: (data: { value: string | boolean }) => Promise<{
    success: boolean;
    error?: string;
  }>;
  defaultValue?: string | boolean;
  type?: "text" | "textarea" | "toggle";
  placeholder?: string;
  maxLength?: number;
  helpText?: string;
  disabled?: boolean;
  deleteAction?: {
    label: string;
    description?: string;
    onDelete: () => Promise<{ success: boolean; error?: string }>;
    confirmText?: string;
  };
}

const textSchema = z.object({
  value: z.string().min(1, "This field is required"),
});

const toggleSchema = z.object({
  value: z.boolean(),
});

export function SettingsField({
  title,
  description,
  onSubmit,
  defaultValue,
  type = "text",
  placeholder,
  maxLength,
  helpText,
  disabled = false,
  deleteAction,
}: SettingsFieldProps) {
  const [isDeleting, setIsDeleting] = useTransition();

  const schema = type === "toggle" ? toggleSchema : textSchema;

  const defaultFormValue = defaultValue ?? (type === "toggle" ? false : "");

  const form = useForm<{ value: string | boolean }>({
    resolver: zodResolver(schema),
    defaultValues: {
      value: defaultFormValue,
    },
  });

  const { isDirty } = form.formState;

  const runSubmit = async () => {
    const valid = await form.trigger();
    if (!valid) throw new Error("Validation failed");
    const data = form.getValues();
    const result = await onSubmit(data);
    if (result.success) {
      toast.success("Settings updated successfully");
      form.reset({ value: data.value }, { keepDefaultValues: false });
    } else {
      toast.error(result.error || "Failed to update settings");
      throw new Error(result.error);
    }
  };

  const [isPending, startTransition] = useTransition();
  const handleToggleChange = (checked: boolean, currentValue: boolean) => {
    startTransition(async () => {
      try {
        const result = await onSubmit({ value: checked });
        if (result.success) {
          toast.success("Settings updated successfully");
          form.reset({ value: checked }, { keepDefaultValues: false });
        } else {
          form.setValue("value", currentValue, { shouldValidate: false });
          toast.error(result.error || "Failed to update settings");
        }
      } catch (error) {
        console.error("Error updating settings:", error);
        form.setValue("value", currentValue, { shouldValidate: false });
        toast.error("Failed to update settings");
      }
    });
  };

  const handleDelete = () => {
    if (!deleteAction) return;

    const confirmed = window.confirm(
      deleteAction.confirmText ||
        `Are you sure you want to ${deleteAction.label.toLowerCase()}? This action cannot be undone.`,
    );

    if (!confirmed) return;

    setIsDeleting(async () => {
      try {
        const result = await deleteAction.onDelete();
        if (result.success) {
          toast.success(`${deleteAction.label} completed successfully`);
        } else {
          toast.error(
            result.error || `Failed to ${deleteAction.label.toLowerCase()}`,
          );
        }
      } catch (error) {
        console.error(`Error ${deleteAction.label.toLowerCase()}:`, error);
        toast.error(`Failed to ${deleteAction.label.toLowerCase()}`);
      }
    });
  };

  return (
    <Card className="flex min-h-0 flex-col gap-0 rounded-xl border-0 bg-[#EDE7D9] p-2 pb-3 shadow-none">
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

      <Card className="flex min-h-0 flex-1 flex-col gap-0 overflow-hidden rounded-lg border-0 bg-[#FAF8F1] shadow-none">
        <Form {...form}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (type !== "toggle") void runSubmit();
            }}
            className="flex min-h-0 flex-1 flex-col"
          >
            <CardContent className="flex min-h-0 flex-1 flex-col gap-y-4 overflow-auto px-4 py-4">
              {type === "toggle" ? (
                <FormField
                  control={form.control}
                  name="value"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <FormLabel className="text-sm">{title}</FormLabel>
                        {description && (
                          <p className="text-foreground-lighter text-xs">
                            {description}
                          </p>
                        )}
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value as boolean}
                          onCheckedChange={(checked) => {
                            const previousValue = field.value as boolean;
                            field.onChange(checked);
                            handleToggleChange(checked, previousValue);
                          }}
                          disabled={disabled || isPending}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              ) : type === "textarea" ? (
                <FormField
                  control={form.control}
                  name="value"
                  render={({ field }) => (
                    <FormItem className="flex flex-col gap-2 md:grid md:grid-cols-12">
                      <div className="col-span-4 flex flex-col gap-2">
                        <FormLabel className="text-sm">{title}</FormLabel>
                      </div>
                      <div className="col-span-8 flex flex-col gap-1">
                        <FormControl>
                          <Textarea
                            variant="underline"
                            {...field}
                            value={field.value as string}
                            placeholder={placeholder}
                            maxLength={maxLength}
                            disabled={disabled || isPending}
                            rows={3}
                          />
                        </FormControl>
                        {helpText && (
                          <p className="text-foreground-lighter text-xs">
                            {helpText}
                          </p>
                        )}
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
              ) : (
                <FormField
                  control={form.control}
                  name="value"
                  render={({ field }) => (
                    <FormItem className="flex flex-col gap-2 md:grid md:grid-cols-12">
                      <div className="col-span-4 flex flex-col gap-2">
                        <FormLabel className="text-sm">{title}</FormLabel>
                      </div>
                      <div className="col-span-8 flex flex-col gap-1">
                        <FormControl>
                          <Input
                            variant="underline"
                            {...field}
                            value={field.value as string}
                            placeholder={placeholder}
                            maxLength={maxLength}
                            disabled={disabled || isPending}
                          />
                        </FormControl>
                        {helpText && (
                          <p className="text-foreground-lighter text-xs">
                            {helpText}
                          </p>
                        )}
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
              )}
            </CardContent>
            {type !== "toggle" && (
              <CardFooter className="flex shrink-0 items-center justify-end gap-2 border-0 px-4 py-2">
                {deleteAction && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={isDeleting || isPending}
                    loading={isDeleting}
                  >
                    {deleteAction.label}
                  </Button>
                )}
                <SaveButton
                  onSave={runSubmit}
                  disabled={disabled || !isDirty}
                  labels={{
                    idle: "Save changes",
                    loading: "Saving",
                    success: "Saved",
                  }}
                />
              </CardFooter>
            )}
            {type === "toggle" && deleteAction && (
              <CardFooter className="flex shrink-0 items-center justify-end space-x-2 border-0 px-4 py-2">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isDeleting || isPending}
                  loading={isDeleting}
                >
                  {deleteAction.label}
                </Button>
              </CardFooter>
            )}
          </form>
        </Form>
      </Card>
    </Card>
  );
}

interface SettingsFieldSkeletonProps {
  type?: "text" | "textarea" | "toggle";
  showDeleteButton?: boolean;
  /** When provided, shown as static text (no skeleton) to match real UI */
  title?: string;
  /** When provided, shown as static text (no skeleton) */
  description?: string;
}

export function SettingsFieldSkeleton({
  type = "text",
  showDeleteButton = false,
  title,
  description,
}: SettingsFieldSkeletonProps) {
  return (
    <Card className="flex min-h-0 flex-col gap-0 rounded-xl border-0 bg-[#EDE7D9] p-2 pb-3 shadow-none">
      <CardHeader className="mb-3 shrink-0 gap-0 border-0 px-0 pt-0.5 pb-0 pl-3">
        <CardTitle className="text-foreground text-base leading-none font-semibold">
          {title ?? "Loading…"}
        </CardTitle>
        {description != null && (
          <CardDescription className="text-muted-foreground mt-0.5 text-sm">
            {description}
          </CardDescription>
        )}
      </CardHeader>
      <Card className="flex min-h-0 flex-1 flex-col gap-0 overflow-hidden rounded-lg border-0 bg-[#FAF8F1] shadow-none">
        <CardContent className="flex min-h-0 flex-1 flex-col gap-y-4 overflow-auto px-4 py-4">
          {type === "toggle" ? (
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                {title ? (
                  <span className="text-sm font-medium">{title}</span>
                ) : (
                  <Skeleton className="h-4 w-24" />
                )}
                {description && (
                  <p className="text-muted-foreground text-xs">{description}</p>
                )}
              </div>
              <Skeleton className="h-6 w-11 rounded-full" />
            </div>
          ) : type === "textarea" ? (
            <div className="flex flex-col gap-2 md:grid md:grid-cols-12">
              <div className="col-span-4 flex flex-col gap-2">
                {title ? (
                  <Label className="text-sm">{title}</Label>
                ) : (
                  <Skeleton className="h-4 w-24" />
                )}
              </div>
              <div className="col-span-8 flex flex-col gap-1">
                <Skeleton className="h-20 w-full" />
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2 md:grid md:grid-cols-12">
              <div className="col-span-4 flex flex-col gap-2">
                {title ? (
                  <Label className="text-sm">{title}</Label>
                ) : (
                  <Skeleton className="h-4 w-24" />
                )}
              </div>
              <div className="col-span-8 flex flex-col gap-1">
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex shrink-0 items-center justify-end space-x-2 border-0 px-4 py-2">
          {showDeleteButton && <Skeleton className="h-10 w-24" />}
          <Skeleton className="h-10 w-32" />
        </CardFooter>
      </Card>
    </Card>
  );
}
