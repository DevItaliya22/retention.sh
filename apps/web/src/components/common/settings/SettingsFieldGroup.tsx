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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@reelo/ui/components";
import { useTransition } from "react";
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
  const [isPending, startTransition] = useTransition();

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

  const handleSubmit = (values: Record<string, string | undefined>) => {
    startTransition(async () => {
      try {
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
        }
      } catch (error) {
        console.error("Error updating settings:", error);
        toast.error("Failed to update settings");
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
          <CardContent className="flex flex-col gap-y-4 border-b px-6 py-4 last:border-none">
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
                        <FormLabel className="text-sm">{field.label}</FormLabel>
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
                            disabled={field.disabled || isPending}
                          />
                        ) : field.type === "select" && field.options ? (
                          <Select
                            onValueChange={formField.onChange}
                            value={formField.value || ""}
                            disabled={field.disabled || isPending}
                          >
                            <SelectTrigger className="w-full border-0 border-b rounded-none bg-transparent dark:bg-transparent dark:hover:bg-transparent px-0 py-3 shadow-none focus-visible:ring-0">
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
                              disabled={field.disabled || isPending}
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
                            disabled={field.disabled || isPending}
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
          <CardFooter className="flex items-center justify-end space-x-2 px-6 py-2">
            <Button
              type="submit"
              disabled={isPending || !isDirty}
              loading={isPending}
            >
              {isPending ? "Saving..." : "Save changes"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
