"use client";

import type { ReferralProgramFormValues } from "@/lib/schemas/referral-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Textarea,
  useFormContext,
} from "@reelo/ui/components";

const textareaUnderlineClass =
  "border-input min-h-20 border-0 border-b rounded-none bg-transparent resize-none px-0 py-3 shadow-none focus-visible:ring-0";

export function ReferralProgramStep4() {
  const form = useFormContext<ReferralProgramFormValues>();

  return (
    <div className="grid gap-6">
      <FormField
        control={form.control}
        name="branding.logo"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Logo URL</FormLabel>
            <FormControl>
              <Input
                variant="underline"
                placeholder="https://..."
                {...field}
                value={field.value ?? ""}
              />
            </FormControl>
            <FormMessage variant="banner" />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="branding.themeColor"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Theme Color</FormLabel>
            <FormControl>
              <Input
                variant="underline"
                placeholder="#7c3aed"
                {...field}
                value={field.value ?? ""}
              />
            </FormControl>
            <FormMessage variant="banner" />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="branding.textColor"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Text Color</FormLabel>
            <FormControl>
              <Input
                variant="underline"
                placeholder="#ffffff"
                {...field}
                value={field.value ?? ""}
              />
            </FormControl>
            <FormMessage variant="banner" />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="branding.bannerImage"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Banner Image URL</FormLabel>
            <FormControl>
              <Input
                variant="underline"
                placeholder="https://..."
                {...field}
                value={field.value ?? ""}
              />
            </FormControl>
            <FormMessage variant="banner" />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="branding.header"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Header</FormLabel>
            <FormControl>
              <Input
                variant="underline"
                placeholder="Welcome to our referral program"
                {...field}
                value={field.value ?? ""}
              />
            </FormControl>
            <FormMessage variant="banner" />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="branding.subtitle"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Subtitle</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Earn rewards by referring friends"
                className={textareaUnderlineClass}
                {...field}
                value={field.value ?? ""}
                rows={3}
              />
            </FormControl>
            <FormMessage variant="banner" />
          </FormItem>
        )}
      />
    </div>
  );
}
