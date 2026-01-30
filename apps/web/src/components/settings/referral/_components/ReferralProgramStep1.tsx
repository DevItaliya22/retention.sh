"use client";

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
  Textarea,
  useFormContext,
} from "@reelo/ui/components";
import { Plus, Trash2 } from "lucide-react";
import type { ReferralProgramFormValues } from "@/lib/schemas/referral-form";

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
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">New Customer Benefits</h3>
          <p className="text-muted-foreground text-sm">
            Set up rewards for customers who join through referrals
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="newCustomerBenefitType"
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
            name="newCustomerBenefitValue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Benefit Value</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="100"
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
          name="newCustomerBenefitExpiresInDays"
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
          <h3 className="text-lg font-semibold">How It Works</h3>
          <p className="text-muted-foreground text-sm">
            Explain to customers how the referral program works
          </p>
        </div>

        <div className="space-y-4">
          <div className="text-sm text-muted-foreground space-y-2">
            <p>
              • Firstly, your customers get a referral message after their
              purchase (right now we don't have a message sending system)
            </p>
            <p>
              • They'll then receive a personal referral sharing page - every
              customer will get a personalized page for themselves
            </p>
            <p>
              • Customers can share their referral link with friends to earn
              rewards
            </p>
          </div>

          <div className="space-y-2">
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
              <Card key={index}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">
                      Section {index + 1}
                    </CardTitle>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeInformationSection(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name={`informationSections.${index}.title`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Section title" {...field} />
                        </FormControl>
                        <FormMessage />
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
                            {...field}
                            rows={3}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <FormField
          control={form.control}
          name="sendReminderToCustomer"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Send Reminder</FormLabel>
                <CardDescription>
                  Send reminder notifications to customers about their referral
                  rewards
                </CardDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
