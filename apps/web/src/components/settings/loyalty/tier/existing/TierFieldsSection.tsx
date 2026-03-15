"use client";

import {
  MaxCapToggleField,
  MinPurchaseToggleField,
  numericInputHandlers,
  SETTINGS_CONTROL_CLASS,
  SETTINGS_LABEL_CLASS,
  SETTINGS_ROW_CLASS,
} from "@/components/settings/loyalty/common";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  useFormContext,
} from "@reelo/ui/components";

/** Form values shape for the single tier settings form (pointsPerRupee + onFinalAmount + allowSameBillRedemption + tiers). */
export interface TierSettingsFormValues {
  pointsPerRupee: number;
  onFinalAmount: boolean;
  allowSameBillRedemption: boolean;
  tiers: Array<{
    id?: string;
    name: string;
    rank: number;
    minLifetimeSpend: number;
    maxLifetimeSpend: number | null;
    cashbackPercentage: number;
    minPurchaseForRedemptionEnabled: boolean;
    minPurchaseForRedemption: number | null;
    maxCashbackCapEnabled: boolean;
    maxCashbackCap: number | null;
  }>;
}

interface TierFieldsSectionProps {
  index: number;
  isTopTier?: boolean;
}

/** Single tier block (no Card): heading row + fields. Used inside TierSettingsCard with separators. */
export function TierFieldsSection({
  index,
  isTopTier = false,
}: TierFieldsSectionProps) {
  const form = useFormContext<TierSettingsFormValues>();
  const prefix = `tiers.${index}` as const;
  const minLifetimeSpend = form.watch(`${prefix}.minLifetimeSpend`) ?? 0;

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name={`${prefix}.name`}
        render={({ field }) => (
          <FormItem className={SETTINGS_ROW_CLASS}>
            <div className={SETTINGS_LABEL_CLASS}>
              <FormLabel className="text-sm">Tier name</FormLabel>
            </div>
            <div className={SETTINGS_CONTROL_CLASS}>
              <FormControl>
                <Input
                  variant="underline"
                  placeholder="e.g. Silver, Gold, Platinum"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </div>
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name={`${prefix}.rank`}
        render={({ field }) => (
          <FormItem className={SETTINGS_ROW_CLASS}>
            <div className={SETTINGS_LABEL_CLASS}>
              <FormLabel className="text-sm">Rank (1 = lowest)</FormLabel>
            </div>
            <div className={SETTINGS_CONTROL_CLASS}>
              <FormControl>
                <Input
                  variant="underline"
                  type="number"
                  min={1}
                  placeholder="1"
                  value={
                    field.value === undefined || field.value === null
                      ? ""
                      : String(field.value)
                  }
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "") {
                      field.onChange(1);
                      return;
                    }
                    const n = Number(v);
                    if (!Number.isNaN(n)) field.onChange(Math.max(1, n));
                  }}
                  {...numericInputHandlers}
                />
              </FormControl>
              <FormMessage />
            </div>
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name={`${prefix}.cashbackPercentage`}
        render={({ field }) => (
          <FormItem className={SETTINGS_ROW_CLASS}>
            <div className={SETTINGS_LABEL_CLASS}>
              <FormLabel className="text-sm">Cashback %</FormLabel>
            </div>
            <div className={SETTINGS_CONTROL_CLASS}>
              <FormControl>
                <Input
                  variant="underline"
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  placeholder="5"
                  value={
                    field.value === undefined ||
                    field.value === null ||
                    field.value === 0
                      ? ""
                      : String(field.value)
                  }
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "") {
                      field.onChange(5);
                      return;
                    }
                    const n = Number(v);
                    if (!Number.isNaN(n))
                      field.onChange(Math.min(100, Math.max(0, n)));
                  }}
                  {...numericInputHandlers}
                />
              </FormControl>
              <FormMessage />
            </div>
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name={`${prefix}.minLifetimeSpend`}
        render={({ field }) => (
          <FormItem className={SETTINGS_ROW_CLASS}>
            <div className={SETTINGS_LABEL_CLASS}>
              <FormLabel className="text-sm">Min lifetime spend (₹)</FormLabel>
            </div>
            <div className={SETTINGS_CONTROL_CLASS}>
              <FormControl>
                <Input
                  variant="underline"
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="0"
                  value={
                    field.value === undefined ||
                    field.value === null ||
                    field.value === 0
                      ? ""
                      : String(field.value)
                  }
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "") {
                      field.onChange(0);
                      return;
                    }
                    const n = Number(v);
                    if (!Number.isNaN(n)) field.onChange(Math.max(0, n));
                  }}
                  {...numericInputHandlers}
                />
              </FormControl>
              <FormMessage />
            </div>
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name={`${prefix}.maxLifetimeSpend`}
        render={({ field }) => (
          <FormItem className={SETTINGS_ROW_CLASS}>
            <div className={SETTINGS_LABEL_CLASS}>
              <FormLabel className="text-sm">
                Max lifetime spend (₹)
                {isTopTier ? " — leave empty (recommended)" : ""}
              </FormLabel>
            </div>
            <div className={SETTINGS_CONTROL_CLASS}>
              <FormControl>
                <Input
                  variant="underline"
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder={isTopTier ? "No limit" : "e.g. 5000"}
                  value={
                    field.value === null || field.value === undefined
                      ? ""
                      : String(field.value)
                  }
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "") {
                      field.onChange(null);
                      return;
                    }
                    const n = Number(v);
                    if (!Number.isNaN(n)) field.onChange(Math.max(0, n));
                  }}
                  {...numericInputHandlers}
                />
              </FormControl>
              {isTopTier && (
                <p className="text-muted-foreground text-xs">
                  Not needed — all customers with spend ≥ ₹
                  {Number(minLifetimeSpend).toLocaleString()} will be in this
                  tier.
                </p>
              )}
              <FormMessage />
            </div>
          </FormItem>
        )}
      />
      <MinPurchaseToggleField<TierSettingsFormValues>
        enabledName={`${prefix}.minPurchaseForRedemptionEnabled`}
        valueName={`${prefix}.minPurchaseForRedemption`}
        label="Min purchase for redemption"
        placeholder="0"
        layout="settings"
      />
      <MaxCapToggleField<TierSettingsFormValues>
        enabledName={`${prefix}.maxCashbackCapEnabled`}
        valueName={`${prefix}.maxCashbackCap`}
        label="Max cashback cap per transaction"
        placeholder="No limit"
        layout="settings"
      />
    </div>
  );
}
