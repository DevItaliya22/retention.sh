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
  SaveButton,
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

/** Tier configuration with Common settings and Reward stages sections, single save. */
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

  const runSubmit = async () => {
    const valid = await form.trigger();
    if (!valid) throw new Error("Validation failed");
    const values = form.getValues();
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
      throw new Error(message);
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
    return new Promise<void>((resolve, reject) => {
      onSave(payload, {
        onSuccess: () => {
          form.reset(values, { keepDefaultValues: false });
          resolve();
        },
        onError: (e) => reject(e),
      } as { onSuccess?: () => void; onError?: (e: unknown) => void });
    });
  };

  return (
    <Card className="bg-sidebar-accent/50 flex min-h-0 flex-col gap-0 rounded-lg border-0 p-2">
      <CardHeader className="mb-3 shrink-0 gap-0 border-0 px-0 pt-0.5 pb-0 pl-3">
        <CardTitle className="text-foreground text-base leading-none font-semibold">
          Tier configuration
        </CardTitle>
        <CardDescription className="text-muted-foreground mt-0.5 text-sm">
          Points conversion and tier definitions based on lifetime spending.
          Higher rank = better tier. Reward stages — define tiers by lifetime
          spend.
        </CardDescription>
      </CardHeader>
      <FormProvider {...form}>
        <Form {...form}>
          <form
            onSubmit={(e) => e.preventDefault()}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="space-y-3">
              <Card className="border-border/45 bg-background/55 flex min-h-0 flex-1 flex-col gap-0 overflow-hidden rounded-lg border shadow-none">
                <CardHeader className="mb-3 shrink-0 gap-0 border-0 px-4 pt-4 pb-0">
                  <CardTitle className="text-foreground text-base leading-none font-semibold">
                    Common settings
                  </CardTitle>
                  <CardDescription className="text-muted-foreground mt-0.5 text-sm">
                    Points conversion and redemption rules
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex min-h-0 flex-1 flex-col gap-y-4 overflow-auto px-4 py-4 pt-4">
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
                            Calculate on final amount
                          </FormLabel>
                          <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                            Apply cashback on final amount (after store
                            discounts and tax).
                          </p>
                        </div>
                        <div className={SETTINGS_CONTROL_CLASS}>
                          <div className="flex items-center">
                            <FormControl>
                              <Switch
                                id="tier-onFinalAmount"
                                checked={field.value ?? false}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </div>
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
                            Same-bill redemption
                          </FormLabel>
                          <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                            Allow customers to use cashback earned on this bill
                            on the same bill. If off, cashback is available from
                            the next bill only.
                          </p>
                        </div>
                        <div className={SETTINGS_CONTROL_CLASS}>
                          <div className="flex items-center">
                            <FormControl>
                              <Switch
                                id="tier-allowSameBillRedemption"
                                checked={field.value ?? false}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
              <div className="space-y-0.5 px-4">
                <h3 className="text-foreground text-base leading-none font-semibold">
                  Reward stages
                </h3>
                <p className="text-muted-foreground text-sm">
                  Customers redeem points for these rewards.
                </p>
              </div>
              {fields.map((field, index) => (
                <Card
                  key={field.id}
                  className="border-border/45 bg-background/55 flex min-h-0 flex-1 flex-col gap-0 overflow-hidden rounded-lg border shadow-none"
                >
                  <CardContent className="px-4 py-4">
                    <TierFieldsSection
                      index={index}
                      onRemove={() => remove(index)}
                      canRemove={fields.length > 1}
                      isTopTier={
                        Number(watchedTiers?.[index]?.rank ?? 0) === maxRank &&
                        maxRank > 0
                      }
                    />
                  </CardContent>
                </Card>
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
            </div>
            <CardFooter className="flex shrink-0 justify-end border-0 px-4 py-2">
              <SaveButton
                onSave={runSubmit}
                disabled={!form.formState.isDirty}
                labels={{
                  idle: "Save changes",
                  loading: "Saving",
                  success: "Saved",
                }}
              />
            </CardFooter>
          </form>
        </Form>
      </FormProvider>
    </Card>
  );
}
