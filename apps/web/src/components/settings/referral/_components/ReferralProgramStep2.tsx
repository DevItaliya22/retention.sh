"use client";

import {
  Button,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  useFormContext,
} from "@reelo/ui/components";
import { Plus, Trash2 } from "lucide-react";
import type { ReferralProgramFormValues } from "@/lib/schemas/referral-form";

export function ReferralProgramStep2() {
  const form = useFormContext<ReferralProgramFormValues>();

  const termsNew = form.watch("termsAndConditionsNewCustomer") ?? [];
  const termsExisting = form.watch("termsAndConditionsExistingCustomer") ?? [];

  const addTerm = (
    field:
      | "termsAndConditionsNewCustomer"
      | "termsAndConditionsExistingCustomer",
  ) => {
    const current = form.getValues(field) ?? [];
    form.setValue(field, [...current, ""]);
  };
  const removeTerm = (
    field:
      | "termsAndConditionsNewCustomer"
      | "termsAndConditionsExistingCustomer",
    index: number,
  ) => {
    const current = form.getValues(field) ?? [];
    form.setValue(
      field,
      current.filter((_: string, i: number) => i !== index),
    );
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Existing Customer Benefits</h3>
          <p className="text-muted-foreground text-sm">
            Set up rewards for customers who refer others
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="existingCustomerBenefitType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Benefit Type</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select benefit type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="LOYALTY_BONUS">
                      Loyalty Points
                    </SelectItem>
                    <SelectItem value="CASH_DISCOUNT">Cash Discount</SelectItem>
                    <SelectItem value="PERCENTAGE_DISCOUNT">
                      Percentage Discount
                    </SelectItem>
                    <SelectItem value="FREE_ITEM">Free Item</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="existingCustomerBenefitValue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Benefit Value</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="50"
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(parseInt(e.target.value) || 0)
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="existingCustomerBenefitExpiresInDays"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Expires In (Days)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="30 (optional)"
                  {...field}
                  value={field.value ?? ""}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value ? parseInt(e.target.value) : null,
                    )
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Terms & Conditions</h3>
          <p className="text-muted-foreground text-sm">
            Add terms as separate points for new and existing customers
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <FormLabel>Terms for New Customers</FormLabel>
            {(termsNew.length === 0 ? [] : termsNew).map(
              (_: string, index: number) => (
                <div key={index} className="flex gap-2 items-start">
                  <FormField
                    control={form.control}
                    name={`termsAndConditionsNewCustomer.${index}`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Textarea
                            placeholder={`Point ${index + 1}`}
                            className="min-h-[60px]"
                            {...field}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      removeTerm("termsAndConditionsNewCustomer", index)
                    }
                    className="shrink-0 mt-2"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ),
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addTerm("termsAndConditionsNewCustomer")}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add point
            </Button>
          </div>

          <div className="space-y-2">
            <FormLabel>Terms for Existing Customers</FormLabel>
            {(termsExisting.length === 0 ? [] : termsExisting).map(
              (_: string, index: number) => (
                <div key={index} className="flex gap-2 items-start">
                  <FormField
                    control={form.control}
                    name={`termsAndConditionsExistingCustomer.${index}`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Textarea
                            placeholder={`Point ${index + 1}`}
                            className="min-h-[60px]"
                            {...field}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      removeTerm("termsAndConditionsExistingCustomer", index)
                    }
                    className="shrink-0 mt-2"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ),
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addTerm("termsAndConditionsExistingCustomer")}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add point
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
