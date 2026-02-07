"use client";

import type { ReferralProgramFormValues } from "@/lib/schemas/referral-form";
import {
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
  Switch,
  useFormContext,
} from "@reelo/ui/components";

export function ReferralProgramStep1() {
  const form = useFormContext<ReferralProgramFormValues>();

  const informationSections = form.watch("informationSections") || [];

  const addInformationSection = () => {
    const current = form.getValues("informationSections") || [];
    form.setValue("informationSections", [
      ...current,
      { title: "", content: "" },
    ]);
  };

  const removeInformationSection = (index: number) => {
    const current = form.getValues("informationSections") || [];
    form.setValue(
      "informationSections",
      current.filter((_, i) => i !== index),
    );
  };

  return (
    <div className="grid gap-6">
      <FormField
        control={form.control}
        name="newCustomerBenefitType"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Benefit Type <span className="text-foreground">*</span>
            </FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger className="w-full rounded-none border-0 border-b bg-transparent px-0 py-3 shadow-none focus-visible:ring-0 dark:bg-transparent dark:hover:bg-transparent">
                  <SelectValue placeholder="Select benefit type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="LOYALTY_BONUS">Loyalty Points</SelectItem>
                <SelectItem value="CASH_DISCOUNT">Cash Discount</SelectItem>
                <SelectItem value="PERCENTAGE_DISCOUNT">
                  Percentage Discount
                </SelectItem>
                <SelectItem value="FREE_ITEM">Free Item</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage variant="banner" />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="newCustomerBenefitValue"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Benefit Value <span className="text-foreground">*</span>
            </FormLabel>
            <FormControl>
              <Input
                type="number"
                variant="underline"
                placeholder="100"
                {...field}
                value={field.value ?? ""}
                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
              />
            </FormControl>
            <FormMessage variant="banner" />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="newCustomerBenefitExpiresInDays"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Expires In (Days)</FormLabel>
            <FormControl>
              <Input
                type="number"
                variant="underline"
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
            <FormMessage variant="banner" />
          </FormItem>
        )}
      />

      {/* Information Sections - temporarily disabled
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <FormLabel>Information Sections</FormLabel>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addInformationSection}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Section
          </Button>
        </div>
        {informationSections.map((section, index) => (
          <div key={index} className="border-input space-y-4 border-b pb-6">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">
                Section {index + 1}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeInformationSection(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <FormField
              control={form.control}
              name={`informationSections.${index}.title`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input
                      variant="underline"
                      placeholder="Section title"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage variant="banner" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`informationSections.${index}.content`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Section content"
                      className="border-input min-h-20 border-0 border-b rounded-none bg-transparent resize-none px-0 py-3 shadow-none focus-visible:ring-0"
                      {...field}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage variant="banner" />
                </FormItem>
              )}
            />
          </div>
        ))}
      </div>
      */}

      <FormField
        control={form.control}
        name="sendReminderToCustomer"
        render={({ field }) => (
          <FormItem className="border-input flex flex-row items-center justify-between border-b py-4">
            <div className="space-y-0.5">
              <FormLabel>Send reminder</FormLabel>
              <p className="text-muted-foreground text-sm">
                Send reminder notifications to customers about their referral
                rewards
              </p>
            </div>
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  );
}
