"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
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
  SaveButton,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@reelo/ui/components";
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

interface SettingsFieldGroupProps {
  title: string;
  description?: string;
  fields: FieldDefinition[];
  defaultValues: Record<string, string>;
  onSubmit: (values: Record<string, string>) => Promise<{
    success: boolean;
    error?: string;
  }>;
}

export function SettingsFieldGroup({
  title,
  description,
  fields,
  defaultValues,
  onSubmit,
}: SettingsFieldGroupProps) {
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
    if (!valid) throw new Error("Validation failed");
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
    } else {
      toast.error(result.error || "Failed to update settings");
      throw new Error(result.error);
    }
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
              void runSubmit();
            }}
            className="flex min-h-0 flex-1 flex-col"
          >
            <CardContent className="flex min-h-0 flex-1 flex-col gap-y-4 overflow-auto px-4 py-4">
              {fields.map((field) => (
                <FormField
                  key={field.name}
                  control={form.control}
                  name={field.name}
                  render={({ field: formField }) => (
                    <FormItem className="flex flex-col gap-2 md:grid md:grid-cols-12">
                      <div className="col-span-4 flex flex-col gap-2">
                        {field.tooltip ? (
                          <div className="flex items-center gap-1.5">
                            <FormLabel className="text-sm">
                              {field.label}
                            </FormLabel>
                            <InfoIcon content={field.tooltip} size={14} />
                          </div>
                        ) : (
                          <FormLabel className="text-sm">
                            {field.label}
                          </FormLabel>
                        )}
                      </div>
                      <div className="col-span-8 flex flex-col gap-1">
                        <FormControl>
                          {field.type === "textarea" ? (
                            <Textarea
                              variant="underline"
                              {...formField}
                              value={formField.value || ""}
                              placeholder={field.placeholder}
                              disabled={field.disabled}
                            />
                          ) : field.type === "select" && field.options ? (
                            <Select
                              onValueChange={formField.onChange}
                              value={formField.value || ""}
                              disabled={field.disabled}
                            >
                              <SelectTrigger className="w-full rounded-none border-0 border-b bg-transparent px-0 py-3 shadow-none focus-visible:ring-0 dark:bg-transparent dark:hover:bg-transparent">
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
                              variant="underline"
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
            <CardFooter className="flex shrink-0 items-center justify-end border-0 px-4 py-2">
              <SaveButton
                onSave={runSubmit}
                disabled={!isDirty}
                labels={{
                  idle: "Save changes",
                  loading: "Saving",
                  success: "Saved",
                }}
              />
            </CardFooter>
          </form>
        </Form>
      </Card>
    </Card>
  );
}
