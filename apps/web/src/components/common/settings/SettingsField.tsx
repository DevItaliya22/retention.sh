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
import type { ReactNode } from "react";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

export type SettingsFieldActionConfig = {
  rowLabel: string;
  summary: string;
  helpText?: string;
  buttonLabel: string;
  onButtonClick: () => void;
};

interface SettingsFieldProps {
  title: string;
  description?: string;
  onSubmit?: (data: { value: string | boolean }) => Promise<{
    success: boolean;
    error?: string;
  }>;
  defaultValue?: string | boolean;
  type?: "text" | "textarea" | "toggle" | "action";
  action?: SettingsFieldActionConfig;
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

function SettingsCardFrame({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <Card className="border-border/60 from-background via-background to-muted/20 overflow-hidden rounded-3xl border bg-gradient-to-br shadow-sm">
      <CardHeader className="border-border/50 gap-1 border-b px-5 py-4 sm:px-6">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
        {description && (
          <CardDescription className="text-sm leading-relaxed">
            {description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="px-5 py-5 sm:px-6">{children}</CardContent>
      {footer ? (
        <CardFooter className="border-border/50 bg-muted/15 flex items-center justify-between gap-3 border-t px-5 py-4 sm:px-6">
          {footer}
        </CardFooter>
      ) : null}
    </Card>
  );
}

function SettingsFieldActionLayout({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action: SettingsFieldActionConfig;
}) {
  return (
    <SettingsCardFrame
      title={title}
      description={description}
      footer={
        <div className="ml-auto">
          <Button
            type="button"
            variant="outline"
            onClick={action.onButtonClick}
          >
            {action.buttonLabel}
          </Button>
        </div>
      }
    >
      <div className="border-border/50 bg-background/75 rounded-2xl border p-4 md:grid md:grid-cols-12 md:gap-4">
        <div className="flex flex-col gap-2 md:col-span-4">
          <Label className="text-sm font-medium">{action.rowLabel}</Label>
        </div>
        <div className="flex flex-col gap-1 md:col-span-8">
          <p className="text-sm leading-relaxed">{action.summary}</p>
          {action.helpText && (
            <p className="text-foreground-lighter text-xs">{action.helpText}</p>
          )}
        </div>
      </div>
    </SettingsCardFrame>
  );
}

const textSchema = z.object({
  value: z.string().min(1, "This field is required"),
});

const toggleSchema = z.object({
  value: z.boolean(),
});

function SettingsFieldEditable({
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
  if (!onSubmit) {
    throw new Error(
      "SettingsField: onSubmit is required unless type is action",
    );
  }

  const [isDeleting, setIsDeleting] = useTransition();
  const [isPending, startTransition] = useTransition();
  const schema = type === "toggle" ? toggleSchema : textSchema;
  const defaultFormValue = defaultValue ?? (type === "toggle" ? false : "");

  const form = useForm<{ value: string | boolean }>({
    resolver: zodResolver(schema),
    defaultValues: { value: defaultFormValue },
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
      return;
    }

    toast.error(result.error || "Failed to update settings");
    throw new Error(result.error);
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

  const footer = (
    <>
      <div>
        {deleteAction ? (
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting || isPending}
            loading={isDeleting}
          >
            {deleteAction.label}
          </Button>
        ) : null}
      </div>
      {type !== "toggle" ? (
        <SaveButton
          onSave={runSubmit}
          disabled={disabled || !isDirty}
          labels={{
            idle: "Save changes",
            loading: "Saving",
            success: "Saved",
          }}
        />
      ) : (
        <div />
      )}
    </>
  );

  return (
    <SettingsCardFrame title={title} description={description} footer={footer}>
      <Form {...form}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (type !== "toggle") void runSubmit();
          }}
          className="space-y-5"
        >
          {type === "toggle" ? (
            <FormField
              control={form.control}
              name="value"
              render={({ field }) => (
                <FormItem className="border-border/50 bg-background/75 flex items-center justify-between rounded-2xl border p-4">
                  <div className="space-y-0.5 pr-4">
                    <FormLabel className="text-sm font-medium">
                      {title}
                    </FormLabel>
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
                <FormItem className="border-border/50 bg-background/75 rounded-2xl border p-4 md:grid md:grid-cols-12 md:gap-4">
                  <div className="flex flex-col gap-2 md:col-span-4">
                    <FormLabel className="text-sm font-medium">
                      {title}
                    </FormLabel>
                  </div>
                  <div className="flex flex-col gap-1 md:col-span-8">
                    <FormControl>
                      <Textarea
                        {...field}
                        value={field.value as string}
                        placeholder={placeholder}
                        maxLength={maxLength}
                        disabled={disabled || isPending}
                        rows={4}
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
                <FormItem className="border-border/50 bg-background/75 rounded-2xl border p-4 md:grid md:grid-cols-12 md:gap-4">
                  <div className="flex flex-col gap-2 md:col-span-4">
                    <FormLabel className="text-sm font-medium">
                      {title}
                    </FormLabel>
                  </div>
                  <div className="flex flex-col gap-1 md:col-span-8">
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
        </form>
      </Form>
    </SettingsCardFrame>
  );
}

export function SettingsField(props: SettingsFieldProps) {
  if (props.type === "action") {
    if (!props.action) return null;
    return (
      <SettingsFieldActionLayout
        title={props.title}
        description={props.description}
        action={props.action}
      />
    );
  }

  return <SettingsFieldEditable {...props} />;
}

interface SettingsFieldSkeletonProps {
  type?: "text" | "textarea" | "toggle";
  showDeleteButton?: boolean;
  title?: string;
  description?: string;
}

export function SettingsFieldSkeleton({
  type = "text",
  showDeleteButton = false,
  title,
  description,
}: SettingsFieldSkeletonProps) {
  return (
    <SettingsCardFrame
      title={title ?? "Loading..."}
      description={description}
      footer={
        <>
          <div>
            {showDeleteButton ? <Skeleton className="h-10 w-24" /> : null}
          </div>
          <Skeleton className="h-10 w-32" />
        </>
      }
    >
      {type === "toggle" ? (
        <div className="border-border/50 bg-background/75 flex items-center justify-between rounded-2xl border p-4">
          <div className="space-y-0.5">
            {title ? (
              <span className="text-sm font-medium">{title}</span>
            ) : (
              <Skeleton className="h-4 w-24" />
            )}
            {description ? (
              <p className="text-muted-foreground text-xs">{description}</p>
            ) : null}
          </div>
          <Skeleton className="h-6 w-11 rounded-full" />
        </div>
      ) : (
        <div className="border-border/50 bg-background/75 rounded-2xl border p-4 md:grid md:grid-cols-12 md:gap-4">
          <div className="flex flex-col gap-2 md:col-span-4">
            {title ? (
              <Label className="text-sm font-medium">{title}</Label>
            ) : (
              <Skeleton className="h-4 w-24" />
            )}
          </div>
          <div className="flex flex-col gap-1 md:col-span-8">
            <Skeleton
              className={type === "textarea" ? "h-24 w-full" : "h-10 w-full"}
            />
          </div>
        </div>
      )}
    </SettingsCardFrame>
  );
}
