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
  const [isPending, startTransition] = useTransition();
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

  const handleSubmit = (data: { value: string | boolean }) => {
    startTransition(async () => {
      try {
        const result = await onSubmit(data);
        if (result.success) {
          toast.success("Settings updated successfully");
          form.reset({ value: data.value }, { keepDefaultValues: false });
        } else {
          toast.error(result.error || "Failed to update settings");
        }
      } catch (error) {
        console.error("Error updating settings:", error);
        toast.error("Failed to update settings");
      }
    });
  };

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
    <Card className="gap-0 p-0!">
      <CardHeader className="flex flex-col gap-0 border-b py-2!">
        <CardTitle className="text-base font-medium">{title}</CardTitle>
        {description && (
          <CardDescription className="text-xs">{description}</CardDescription>
        )}
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <CardContent className="flex flex-col gap-y-2 border-b px-6 py-4 last:border-none">
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
            <CardFooter className="flex items-center justify-end space-x-2 px-6 py-2">
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
              <Button
                type="submit"
                disabled={isPending || disabled || !isDirty}
                loading={isPending}
              >
                {isPending ? "Saving..." : "Save changes"}
              </Button>
            </CardFooter>
          )}
          {type === "toggle" && deleteAction && (
            <CardFooter className="flex items-center justify-end space-x-2 px-6 py-2">
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
  );
}

interface SettingsFieldSkeletonProps {
  type?: "text" | "textarea" | "toggle";
  showDeleteButton?: boolean;
}

export function SettingsFieldSkeleton({
  type = "text",
  showDeleteButton = false,
}: SettingsFieldSkeletonProps) {
  return (
    <Card className="gap-0 p-0!">
      <CardHeader className="flex flex-col gap-0 border-b py-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="mt-2 h-3 w-48" />
      </CardHeader>
      <CardContent className="flex flex-col gap-y-2 border-b px-6 py-4 last:border-none">
        {type === "toggle" ? (
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-1 h-3 w-40" />
            </div>
            <Skeleton className="h-6 w-11 rounded-full" />
          </div>
        ) : type === "textarea" ? (
          <div className="flex flex-col gap-2 md:grid md:grid-cols-12">
            <div className="col-span-4 flex flex-col gap-2">
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="col-span-8 flex flex-col gap-1">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2 md:grid md:grid-cols-12">
            <div className="col-span-4 flex flex-col gap-2">
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="col-span-8 flex flex-col gap-1">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex items-center justify-end space-x-2 px-6 py-4">
        {showDeleteButton && <Skeleton className="h-10 w-24" />}
        <Skeleton className="h-10 w-32" />
      </CardFooter>
    </Card>
  );
}
