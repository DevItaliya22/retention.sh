"use client";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
} from "@reelo/ui/components";
import { Control } from "react-hook-form";

interface BusinessInfoFieldsProps {
  control: Control<any>;
}

export function BusinessInfoFields({ control }: BusinessInfoFieldsProps) {
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
          render={({ field }) => (
            <FormItem>
              <FormLabel>Business Slug</FormLabel>
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
          )}
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

