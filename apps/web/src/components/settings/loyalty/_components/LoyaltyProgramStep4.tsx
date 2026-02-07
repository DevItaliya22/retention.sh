"use client";

import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  Input,
  Label,
  useFormContext,
} from "@reelo/ui/components";
import type { LoyaltyProgramFormValues } from "@/lib/schemas/loyalty-form";

export function LoyaltyProgramStep4() {
  const form = useFormContext<LoyaltyProgramFormValues>();

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="branding.logo"
        render={({ field }) => (
          <FormItem>
            <Label className="text-sm">Logo URL</Label>
            <FormControl>
              <Input
                variant="underline"
                placeholder="https://..."
                {...field}
                value={field.value ?? ""}
                onChange={(e) =>
                  field.onChange(e.target.value === "" ? null : e.target.value)
                }
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="branding.themeColor"
        render={({ field }) => (
          <FormItem>
            <Label className="text-sm">Theme Color</Label>
            <FormControl>
              <Input
                variant="underline"
                placeholder="#7c3aed"
                {...field}
                value={field.value ?? ""}
                onChange={(e) =>
                  field.onChange(e.target.value === "" ? null : e.target.value)
                }
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="branding.textColor"
        render={({ field }) => (
          <FormItem>
            <Label className="text-sm">Text Color</Label>
            <FormControl>
              <Input
                variant="underline"
                placeholder="#ffffff"
                {...field}
                value={field.value ?? ""}
                onChange={(e) =>
                  field.onChange(e.target.value === "" ? null : e.target.value)
                }
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="branding.bannerImage"
        render={({ field }) => (
          <FormItem>
            <Label className="text-sm">Banner Image URL</Label>
            <FormControl>
              <Input
                variant="underline"
                placeholder="https://..."
                {...field}
                value={field.value ?? ""}
                onChange={(e) =>
                  field.onChange(e.target.value === "" ? null : e.target.value)
                }
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="branding.header"
        render={({ field }) => (
          <FormItem>
            <Label className="text-sm">Header</Label>
            <FormControl>
              <Input
                variant="underline"
                placeholder="Welcome to our loyalty program"
                {...field}
                value={field.value ?? ""}
                onChange={(e) =>
                  field.onChange(e.target.value === "" ? null : e.target.value)
                }
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="branding.subtitle"
        render={({ field }) => (
          <FormItem>
            <Label className="text-sm">Subtitle</Label>
            <FormControl>
              <Input
                variant="underline"
                placeholder="Earn points on every purchase"
                {...field}
                value={field.value ?? ""}
                onChange={(e) =>
                  field.onChange(e.target.value === "" ? null : e.target.value)
                }
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
