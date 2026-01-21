"use client";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  Checkbox,
  useFormContext,
} from "@reelo/ui/components";
import type { WelcomeFormValues } from "@/lib/schemas/onboarding";
import { CashierInfoFields } from "@/components/forms/shared/CashierInfoFields"; 

export function CashierStep() {
  const form = useFormContext<WelcomeFormValues>();
  const createCashier = form.watch("createCashier");

  return (
    <div className="grid gap-6">
      <FormField
        control={form.control}
        name="createCashier"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm bg-muted/20">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel className="cursor-pointer">
                Create a cashier account now?
              </FormLabel>
              <p className="text-muted-foreground text-sm">
                You can always add cashiers later from your dashboard.
              </p>
            </div>
          </FormItem>
        )}
      />

      {createCashier && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-300">
          <CashierInfoFields control={form.control as any} includePassword />
        </div>
      )}
      
      {!createCashier && (
        <div className="bg-muted/30 rounded-lg p-8 text-center border-2 border-dashed border-border/50">
          <p className="text-muted-foreground">
            No problem! You can skip this step and set up your team later.
          </p>
        </div>
      )}
    </div>
  );
}

