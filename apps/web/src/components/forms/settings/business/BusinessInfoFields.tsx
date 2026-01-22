"use client";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Button,
} from "@reelo/ui/components";
import { Control, useWatch } from "react-hook-form";
import { RotateCw } from "lucide-react";
import slugify from "slugify";
import { useRef } from "react";

interface BusinessInfoFieldsProps {
  control: Control<any>;
  onRegenerateSlug?: () => void;
}

export function BusinessInfoFields({ control, onRegenerateSlug }: BusinessInfoFieldsProps) {
  const businessName = useWatch({ control, name: "businessName" });
  const slugFieldRef = useRef<{ onChange: (value: string) => void } | null>(null);
  
  const handleRegenerateSlug = () => {
    if (businessName && slugFieldRef.current) {
      const slug = slugify(businessName, {
        lower: true,
        strict: true,
        trim: true,
      });
      slugFieldRef.current.onChange(slug);
      onRegenerateSlug?.();
    }
  };

  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={control as any}
          name="businessName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Business Name</FormLabel>
              <FormControl>
                <Input placeholder="Acme Store" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control as any}
          name="businessSlug"
          render={({ field }) => {
            slugFieldRef.current = field;
            return (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Business Slug</FormLabel>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={handleRegenerateSlug}
                    disabled={!businessName}
                  >
                    <RotateCw className="h-3 w-3 mr-1" />
                    Regenerate
                  </Button>
                </div>
                <FormControl>
                  <div className="flex items-center overflow-hidden rounded-md border shadow-sm focus-within:ring-1 focus-within:ring-ring">
                    <span className="flex items-center bg-muted px-3 py-2 text-sm text-muted-foreground border-r shrink-0">
                      reelo.in/
                    </span>
                    <Input 
                      className="border-0 shadow-none focus-visible:ring-0" 
                      placeholder="acme-store" 
                      {...field} 
                      value={field.value ?? ""}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField
          control={control as any}
          name="defaultPointsName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Points Name</FormLabel>
              <FormControl>
                <Input placeholder="Points" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control as any}
          name="defaultCurrencySymbol"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Currency Symbol</FormLabel>
              <FormControl>
                <Input placeholder="₹" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control as any}
          name="defaultCurrencyCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Currency Code</FormLabel>
              <FormControl>
                <Input placeholder="INR" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={control as any}
          name="themeColor"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Theme Color</FormLabel>
              <FormControl>
                <div className="flex gap-2">
                  <Input 
                    type="color" 
                    className="w-12 h-10 p-1 cursor-pointer shrink-0" 
                    {...field} 
                    value={field.value ?? ""} 
                  />
                  <Input 
                    placeholder="#7c3aed" 
                    {...field} 
                    value={field.value ?? ""} 
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
