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

interface CashierInfoFieldsProps {
  control: Control<any>;
  includePassword?: boolean;
  compact?: boolean;
}

export function CashierInfoFields({ control, includePassword, compact }: CashierInfoFieldsProps) {
  const gridClass = compact ? "grid grid-cols-1 md:grid-cols-3 gap-4" : "grid grid-cols-1 md:grid-cols-2 gap-4";
  const labelClass = compact ? "text-xs uppercase tracking-wider text-muted-foreground/80" : "";
  const inputClass = compact ? "bg-background/50" : "";

  return (
    <div className="space-y-4">
      <div className={gridClass}>
        <FormField
          control={control as any}
          name="cashierName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={labelClass}>Name</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} value={field.value ?? ""} className={inputClass} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control as any}
          name="cashierEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={labelClass}>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="john@example.com" {...field} value={field.value ?? ""} className={inputClass} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {compact && (
          <FormField
            control={control as any}
            name="cashierLinkSlug"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelClass}>Cashier Slug</FormLabel>
                <FormControl>
                  <Input placeholder="john-cashier" {...field} value={field.value ?? ""} className={inputClass} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </div>

      {!compact && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={control as any}
            name="cashierLinkSlug"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelClass}>Cashier Slug</FormLabel>
                <FormControl>
                  <Input placeholder="john-cashier" {...field} value={field.value ?? ""} className={inputClass} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {includePassword && (
            <FormField
              control={control as any}
              name="cashierPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelClass}>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} value={field.value ?? ""} className={inputClass} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>
      )}
    </div>
  );
}
