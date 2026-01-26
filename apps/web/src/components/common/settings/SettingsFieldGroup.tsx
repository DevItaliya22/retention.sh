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
} from "@reelo/ui/components";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

interface FieldDefinition {
  name: string;
  label: string;
  placeholder?: string;
  helpText?: string;
  disabled?: boolean;
  type?: "text" | "textarea";
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
    fields.reduce((acc, field) => {
      if (!field.disabled) {
        acc[field.name] = z.string().min(1, `${field.label} is required`);
      } else {
        acc[field.name] = z.string().optional();
      }
      return acc;
    }, {} as Record<string, z.ZodString | z.ZodOptional<z.ZodString>>)
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
          if (!field.disabled && values[field.name]) {
            filteredValues[field.name] = values[field.name] as string;
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
                      <FormLabel className="text-sm">{field.label}</FormLabel>
                    </div>
                    <div className="col-span-8 flex flex-col gap-1">
                      <FormControl>
                        <Input
                          {...formField}
                          value={formField.value || ""}
                          placeholder={field.placeholder}
                          disabled={field.disabled || isPending}
                        />
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
