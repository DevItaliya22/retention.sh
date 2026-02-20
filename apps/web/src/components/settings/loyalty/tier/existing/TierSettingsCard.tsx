"use client";

import {
  SETTINGS_CONTROL_CLASS,
  SETTINGS_LABEL_CLASS,
  SETTINGS_ROW_CLASS,
} from "@/components/settings/loyalty/common";
import type { LoyaltyTier } from "@/hooks/loyalty/useLoyaltySettings";
import {
  TIER_TOP_MAX_LIFETIME_SPEND,
  validateTierRanges,
} from "@/lib/loyalty/helpers";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormProvider,
  Input,
  Separator,
  Switch,
  useForm,
} from "@reelo/ui/components";
import { Plus } from "lucide-react";
import { useFieldArray } from "react-hook-form";
import { toast } from "sonner";
import type { TierSettingsFormValues } from "./TierFieldsSection";
import { TierFieldsSection } from "./TierFieldsSection";

const DEFAULT_TIER = {
  name: "",
  rank: 1,
  minLifetimeSpend: 0,
  maxLifetimeSpend: null as number | null,
  cashbackPercentage: 0,
  minPurchaseForRedemptionEnabled: false,
  minPurchaseForRedemption: null as number | null,
  maxCashbackCapEnabled: false,
  maxCashbackCap: null as number | null,
};

function mapTierToForm(
  tier: LoyaltyTier,
  isTopTier: boolean,
): TierSettingsFormValues["tiers"][number] {
  return {
    id: tier.id,
    name: tier.name,
    rank: tier.rank,
    minLifetimeSpend: tier.minLifetimeSpend,
    maxLifetimeSpend:
      isTopTier && tier.maxLifetimeSpend === TIER_TOP_MAX_LIFETIME_SPEND
        ? null
        : tier.maxLifetimeSpend,
    cashbackPercentage: tier.cashbackPercentage,
    minPurchaseForRedemptionEnabled: tier.minPurchaseForRedemptionEnabled,
    minPurchaseForRedemption: tier.minPurchaseForRedemption,
    maxCashbackCapEnabled: tier.maxCashbackCapEnabled,
    maxCashbackCap: tier.maxCashbackCap,
  };
}

type TierConfig = {
  pointsPerRupee: number;
  onFinalAmount: boolean;
  allowSameBillRedemption?: boolean;
  tiers: LoyaltyTier[];
};

interface TierSettingsCardProps {
  tierConfig: TierConfig;
  onSave: (
    data: {
      pointsPerRupee: number;
      onFinalAmount: boolean;
      allowSameBillRedemption: boolean;
      tiers: Omit<LoyaltyTier, "id">[];
    },
    options?: { onSuccess?: () => void },
  ) => void;
  isSaving: boolean;
}

/** Single card for all tier configuration and tier definitions, separated by Separator (no cards per tier). */
export function TierSettingsCard({
  tierConfig,
  onSave,
  isSaving,
}: TierSettingsCardProps) {
  const initialMaxRank =
    tierConfig.tiers?.length > 0
      ? Math.max(...tierConfig.tiers.map((t) => t.rank))
      : 0;
  const form = useForm<TierSettingsFormValues>({
    defaultValues: {
      pointsPerRupee: tierConfig.pointsPerRupee ?? 1,
      onFinalAmount: tierConfig.onFinalAmount ?? false,
      allowSameBillRedemption: tierConfig.allowSameBillRedemption ?? false,
      tiers: tierConfig.tiers.map((t) =>
        mapTierToForm(t, t.rank === initialMaxRank && initialMaxRank > 0),
      ),
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "tiers",
  });
  const watchedTiers = form.watch("tiers");
  const maxRank =
    watchedTiers?.length > 0
      ? Math.max(...watchedTiers.map((t) => Number(t?.rank ?? 0)))
      : 0;

  const handleSave = form.handleSubmit((values) => {
    const validation = validateTierRanges(
      values.tiers.map((t) => ({
        rank: t.rank,
        minLifetimeSpend: t.minLifetimeSpend,
        maxLifetimeSpend: t.maxLifetimeSpend ?? null,
      })),
    );
    if (!validation.valid) {
      const message = validation.errors.join(". ");
      form.setError("tiers", { type: "manual", message });
      toast.error(message);
      return;
    }
    const maxRank =
      values.tiers.length > 0
        ? Math.max(...values.tiers.map((t) => t.rank))
        : 0;
    const payload = {
      pointsPerRupee: values.pointsPerRupee,
      onFinalAmount: values.onFinalAmount,
      allowSameBillRedemption: values.allowSameBillRedemption ?? false,
      tiers: values.tiers.map((t) => {
        const isTopTier = t.rank === maxRank && maxRank > 0;
        return {
          name: t.name,
          rank: t.rank,
          minLifetimeSpend: t.minLifetimeSpend,
          maxLifetimeSpend:
            isTopTier &&
            (t.maxLifetimeSpend == null || t.maxLifetimeSpend === 0)
              ? null
              : t.maxLifetimeSpend,
          cashbackPercentage: t.cashbackPercentage,
          minPurchaseForRedemptionEnabled: t.minPurchaseForRedemptionEnabled,
          minPurchaseForRedemption: t.minPurchaseForRedemption,
          maxCashbackCapEnabled: t.maxCashbackCapEnabled,
          maxCashbackCap: t.maxCashbackCap,
        };
      }),
    };
    onSave(payload, {
      onSuccess: () => form.reset(values, { keepDefaultValues: false }),
    });
  });

  return (
    <Card className="gap-0 p-0!">
      <CardHeader className="flex flex-col gap-0 border-b py-2!">
        <CardTitle className="text-base font-medium">
          Tier configuration
        </CardTitle>
        <CardDescription className="text-xs">
          Points conversion and tier definitions based on lifetime spending.
          Higher rank = better tier.
        </CardDescription>
      </CardHeader>
      <FormProvider {...form}>
        <Form {...form}>
          <form onSubmit={(e) => e.preventDefault()}>
            <CardContent className="flex flex-col gap-y-4 border-b px-6 py-4 last:border-none">
              <FormField
                control={form.control}
                name="pointsPerRupee"
                render={({ field }) => (
                  <FormItem className={SETTINGS_ROW_CLASS}>
                    <div className={SETTINGS_LABEL_CLASS}>
                      <FormLabel className="text-sm">
                        Points per rupee (default)
                      </FormLabel>
                    </div>
                    <div className={SETTINGS_CONTROL_CLASS}>
                      <FormControl>
                        <Input
                          variant="underline"
                          type="number"
                          min={0}
                          step="0.01"
                          placeholder="1"
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
                            if (!Number.isNaN(n))
                              field.onChange(Math.max(0, n));
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="onFinalAmount"
                render={({ field }) => (
                  <FormItem className={SETTINGS_ROW_CLASS}>
                    <div className={SETTINGS_LABEL_CLASS}>
                      <FormLabel
                        htmlFor="tier-onFinalAmount"
                        className="cursor-pointer text-sm"
                      >
                        Calculate cashback on final amount (after store
                        discounts and tax)
                      </FormLabel>
                    </div>
                    <div className={SETTINGS_CONTROL_CLASS}>
                      <FormControl>
                        <Switch
                          id="tier-onFinalAmount"
                          checked={field.value ?? false}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="allowSameBillRedemption"
                render={({ field }) => (
                  <FormItem className={SETTINGS_ROW_CLASS}>
                    <div className={SETTINGS_LABEL_CLASS}>
                      <FormLabel
                        htmlFor="tier-allowSameBillRedemption"
                        className="cursor-pointer text-sm"
                      >
                        Allow customers to use cashback earned on this bill on
                        the same bill (if off, cashback is available from the
                        next bill only)
                      </FormLabel>
                    </div>
                    <div className={SETTINGS_CONTROL_CLASS}>
                      <FormControl>
                        <Switch
                          id="tier-allowSameBillRedemption"
                          checked={field.value ?? false}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              <Separator />

              {fields.map((field, index) => (
                <div key={field.id} className="space-y-4">
                  <TierFieldsSection
                    index={index}
                    onRemove={() => remove(index)}
                    canRemove={fields.length > 1}
                    isTopTier={
                      Number(watchedTiers?.[index]?.rank ?? 0) === maxRank &&
                      maxRank > 0
                    }
                  />
                  {index < fields.length - 1 && <Separator />}
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  append({
                    ...DEFAULT_TIER,
                    rank: fields.length + 1,
                  })
                }
              >
                <Plus className="mr-2 h-4 w-4" />
                Add tier
              </Button>
            </CardContent>
            <CardFooter className="flex justify-end px-6 py-2">
              <Button
                type="button"
                onClick={handleSave}
                loading={isSaving}
                disabled={!form.formState.isDirty}
              >
                Save changes
              </Button>
            </CardFooter>
          </form>
        </Form>
      </FormProvider>
    </Card>
  );
}
