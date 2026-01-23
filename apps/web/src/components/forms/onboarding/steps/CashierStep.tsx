"use client";

import type { WelcomeFormValues } from "@/lib/schemas/onboarding";
import {
  Checkbox,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  useFormContext,
} from "@reelo/ui/components";

export function CashierStep() {
  const form = useFormContext<WelcomeFormValues>();
  const createCashier = form.watch("createCashier");

  return (
    <div className="grid gap-6">
      <FormField
        control={form.control}
        name="createCashier"
        render={({ field }) => (
          <FormItem className="bg-muted/20 flex flex-row items-start space-y-0 space-x-3 rounded-md border p-4 shadow-sm">
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
        <div className="animate-in fade-in slide-in-from-top-4 space-y-4 duration-300">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control as any}
              name="cashierName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="John Doe"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control as any}
              name="cashierEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="john@example.com"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control as any}
              name="cashierLinkSlug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cashier Slug</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="john-cashier"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control as any}
              name="cashierPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      )}

      {!createCashier && (
        <div className="bg-muted/30 border-border/50 rounded-lg border-2 border-dashed p-8 text-center">
          <p className="text-muted-foreground">
            No problem! You can skip this step and set up your team later.
          </p>
        </div>
      )}
    </div>
  );
}
