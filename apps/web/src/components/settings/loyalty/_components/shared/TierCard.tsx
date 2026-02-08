"use client";

import type { LoyaltyProgramFormValues } from "@/lib/schemas/loyalty-form";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  Input,
  Label,
  useFormContext,
} from "@reelo/ui/components";
import { Trash2 } from "lucide-react";
import { MaxCapToggleField } from "./MaxCapToggleField";
import { MinPurchaseToggleField } from "./MinPurchaseToggleField";

interface TierCardProps {
  index: number;
  onRemove: () => void;
  canRemove: boolean;
}

export function TierCard({ index, onRemove, canRemove }: TierCardProps) {
  const form = useFormContext<LoyaltyProgramFormValues>();
  const prefix = `tiers.${index}` as const;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <span className="text-sm font-medium">Tier {index + 1}</span>
        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-destructive h-8 w-8"
            onClick={onRemove}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={form.control}
          name={`${prefix}.name`}
          render={({ field }) => (
            <FormItem>
              <Label className="text-sm">Tier name</Label>
              <FormControl>
                <Input
                  variant="underline"
                  placeholder="e.g. Silver, Gold, Platinum"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name={`${prefix}.rank`}
            render={({ field }) => (
              <FormItem>
                <Label className="text-sm">Rank (1 = lowest)</Label>
                <FormControl>
                  <Input
                    variant="underline"
                    type="number"
                    min={1}
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      field.onChange(
                        v === "" ? undefined : Math.max(1, Number(v)),
                      );
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={`${prefix}.cashbackPercentage`}
            render={({ field }) => (
              <FormItem>
                <Label className="text-sm">Cashback %</Label>
                <FormControl>
                  <Input
                    variant="underline"
                    type="number"
                    min={0}
                    max={100}
                    step="0.01"
                    placeholder="5"
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      field.onChange(
                        v === ""
                          ? undefined
                          : Math.min(100, Math.max(0, Number(v))),
                      );
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name={`${prefix}.minLifetimeSpend`}
            render={({ field }) => (
              <FormItem>
                <Label className="text-sm">Min lifetime spend (₹)</Label>
                <FormControl>
                  <Input
                    variant="underline"
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="0"
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      field.onChange(
                        v === "" ? undefined : Math.max(0, Number(v)),
                      );
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={`${prefix}.maxLifetimeSpend`}
            render={({ field }) => (
              <FormItem>
                <Label className="text-sm">
                  Max lifetime spend (₹) — leave empty for top tier
                </Label>
                <FormControl>
                  <Input
                    variant="underline"
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="No limit"
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      field.onChange(v === "" ? null : Math.max(0, Number(v)));
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <MinPurchaseToggleField<LoyaltyProgramFormValues>
          enabledName={`${prefix}.minPurchaseForEarningEnabled`}
          valueName={`${prefix}.minPurchaseForEarning`}
          label="Min purchase for earning"
          placeholder="0"
        />
        <MinPurchaseToggleField<LoyaltyProgramFormValues>
          enabledName={`${prefix}.minPurchaseForRedemptionEnabled`}
          valueName={`${prefix}.minPurchaseForRedemption`}
          label="Min purchase for redemption"
          placeholder="0"
        />
        <MaxCapToggleField<LoyaltyProgramFormValues>
          enabledName={`${prefix}.maxCashbackCapEnabled`}
          valueName={`${prefix}.maxCashbackCap`}
          label="Max cashback cap per transaction"
          placeholder="No limit"
        />
      </CardContent>
    </Card>
  );
}
