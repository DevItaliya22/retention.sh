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
  Checkbox,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  InfoIcon,
  Input,
  PixelIcon,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@reelo/ui/components";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

interface SelectOption {
  value: string;
  label: string;
}

interface FieldDefinition {
  name: string;
  label: string;
  placeholder?: string;
  helpText?: string;
  tooltip?: string;
  disabled?: boolean;
  optional?: boolean;
  type?: "text" | "textarea" | "number" | "select" | "checkbox";
  options?: SelectOption[];
  checkboxLabel?: string;
  min?: number;
  max?: number;
  step?: string;
}

export interface FooterActionConfig {
  label: string;
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  onAction: () => Promise<void>;
  loading?: boolean;
}

interface SettingsFieldGroupProps {
  title: string;
  description?: string;
  fields: FieldDefinition[];
  defaultValues: Record<string, string>;
  onSubmit: (values: Record<string, string>) => Promise<{
    success: boolean;
    error?: string;
  }>;
  /** Optional buttons (e.g. Dissolve) shown in footer left; Save stays right */
  footerActions?: FooterActionConfig[];
}

export function SettingsFieldGroup({
  title,
  description,
  fields,
  defaultValues,
  onSubmit,
  footerActions = [],
}: SettingsFieldGroupProps) {
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "loading" | "success">(
    "idle",
  );

  const schema = z.object(
    fields.reduce(
      (acc, field) => {
        if (field.disabled || field.optional) {
          acc[field.name] = z.string().optional();
        } else {
          acc[field.name] = z.string().min(1, `${field.label} is required`);
        }
        return acc;
      },
      {} as Record<string, z.ZodString | z.ZodOptional<z.ZodString>>,
    ),
  );

  const form = useForm<Record<string, string | undefined>>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const { isDirty } = form.formState;

  const runSubmit = async () => {
    const valid = await form.trigger();
    if (!valid) return;

    setSaveState("loading");

    try {
      const values = form.getValues();
      const filteredValues: Record<string, string> = {};
      fields.forEach((field) => {
        if (!field.disabled) {
          filteredValues[field.name] = (values[field.name] ?? "") as string;
        }
      });

      const result = await onSubmit(filteredValues);

      if (result.success) {
        toast.success("Settings updated successfully");
        form.reset(values, { keepDefaultValues: false });
        setSaveState("success");
        setTimeout(() => {
          setSaveState("idle");
        }, 3000);
      } else {
        toast.error(result.error || "Failed to update settings");
        setSaveState("idle");
      }
    } catch (error) {
      setSaveState("idle");
      throw error;
    }
  };

  return (
    <Card className="border-border/60 from-background via-background to-muted/20 overflow-hidden rounded-3xl border bg-gradient-to-br shadow-sm">
      <CardHeader className="border-border/50 shrink-0 gap-1 border-b px-5 py-4 sm:px-6">
        <CardTitle className="text-foreground text-base leading-none font-semibold">
          {title}
        </CardTitle>
        {description && (
          <CardDescription className="text-muted-foreground text-sm leading-relaxed">
            {description}
          </CardDescription>
        )}
      </CardHeader>

      <Form {...form}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void runSubmit();
          }}
          className="flex min-h-0 flex-1 flex-col"
        >
          <CardContent className="flex min-h-0 flex-1 flex-col gap-y-5 px-5 py-5 sm:px-6">
            {fields.map((field) => (
              <FormField
                key={field.name}
                control={form.control}
                name={field.name}
                render={({ field: formField }) => (
                  <FormItem className="border-border/50 bg-background/75 rounded-2xl border p-4 md:grid md:grid-cols-12 md:gap-4">
                    <div className="col-span-4 flex flex-col gap-2">
                      {field.tooltip ? (
                        <div className="flex items-center gap-1.5">
                          <FormLabel className="text-sm font-medium">
                            {field.label}
                          </FormLabel>
                          <InfoIcon content={field.tooltip} size={14} />
                        </div>
                      ) : (
                        <FormLabel className="text-sm font-medium">
                          {field.label}
                        </FormLabel>
                      )}
                    </div>
                    <div className="col-span-8 flex flex-col gap-1">
                      <FormControl>
                        {field.type === "textarea" ? (
                          <Textarea
                            {...formField}
                            value={formField.value || ""}
                            placeholder={field.placeholder}
                            disabled={field.disabled}
                            className="min-h-28"
                          />
                        ) : field.type === "select" && field.options ? (
                          <Select
                            onValueChange={formField.onChange}
                            value={formField.value || ""}
                            disabled={field.disabled}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue
                                placeholder={field.placeholder || "Select..."}
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {field.options.map((option) => (
                                <SelectItem
                                  key={option.value}
                                  value={option.value}
                                >
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : field.type === "checkbox" ? (
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={formField.value === "true"}
                              onCheckedChange={(v) =>
                                formField.onChange(v ? "true" : "false")
                              }
                              disabled={field.disabled}
                            />
                            {field.checkboxLabel && (
                              <span className="text-muted-foreground text-sm">
                                {field.checkboxLabel}
                              </span>
                            )}
                          </div>
                        ) : (
                          <Input
                            type={field.type === "number" ? "number" : "text"}
                            {...formField}
                            value={formField.value || ""}
                            placeholder={field.placeholder}
                            disabled={field.disabled}
                            {...(field.type === "number"
                              ? {
                                  min: field.min,
                                  max: field.max,
                                  step: field.step,
                                }
                              : {})}
                          />
                        )}
                      </FormControl>
                      {field.helpText && (
                        <p className="text-foreground-lighter text-xs">
                          {field.helpText}
                        </p>
                      )}
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
            ))}
          </CardContent>
          <CardFooter className="border-border/50 bg-muted/15 flex shrink-0 items-center justify-between gap-3 border-t px-5 py-4 sm:px-6">
            <div className="flex flex-wrap gap-2">
              {footerActions.map((action, i) => (
                <Button
                  key={i}
                  type="button"
                  variant={action.variant ?? "outline"}
                  size="sm"
                  disabled={action.loading ?? actionLoading === i}
                  loading={action.loading ?? actionLoading === i}
                  onClick={async () => {
                    setActionLoading(i);
                    try {
                      await action.onAction();
                    } finally {
                      setActionLoading(null);
                    }
                  }}
                >
                  {action.label}
                </Button>
              ))}
            </div>
            <Button
              onClick={runSubmit}
              disabled={!isDirty && saveState === "idle"}
              className="flex items-center gap-2"
            >
              <span className="inline-flex items-center gap-2">
                {isDirty ? "Save changes" : "Saved"}
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
    </Card>
  );
}
