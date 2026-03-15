"use client";

import { GooeyTabs } from "@/components/layouts";
import {
  numericInputHandlers,
  SETTINGS_CONTROL_CLASS,
  SETTINGS_LABEL_CLASS,
  SETTINGS_ROW_CLASS,
} from "@/components/settings/loyalty/common";
import type { LoyaltyTier } from "@/hooks/loyalty/useLoyaltySettings";
import {
  createDefaultTier,
  getClosedTierMax,
  getNextTier,
} from "@/lib/loyalty/form-defaults";
import {
  TIER_TOP_MAX_LIFETIME_SPEND,
  validateTierRanges,
} from "@/lib/loyalty/helpers";
import { tierEditorStepSchema } from "@/lib/schemas/loyalty-form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
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
import { Plus, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useFieldArray } from "react-hook-form";
import { toast } from "sonner";
import type { TierSettingsFormValues } from "./TierFieldsSection";
import { TierFieldsSection } from "./TierFieldsSection";

function mapTierToForm(
  tier: LoyaltyTier,
  isTopTier: boolean,
): TierSettingsFormValues["tiers"][number] {
  return createDefaultTier(tier.rank, {
    id: tier.id,
    name: tier.name,
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
  });
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
    options?: { onSuccess?: () => void; onError?: (e: unknown) => void },
  ) => void;
  isSaving: boolean;
}

/** Tier configuration with Common settings and Reward stages sections, single save. */
export function TierSettingsCard({
  tierConfig,
  onSave,
  isSaving,
}: TierSettingsCardProps) {
  const [activeTierIndex, setActiveTierIndex] = useState(0);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

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

  useEffect(() => {
    setActiveTierIndex((prev) => {
      if (fields.length === 0) return 0;
      return Math.max(0, Math.min(prev, fields.length - 1));
    });
  }, [fields.length]);

  const tabs = useMemo(() => {
    return fields.map((_, index) => ({
      value: String(index),
      label: (
        <div className="flex items-center gap-2">
          <span>Tier {index + 1}</span>
          {fields.length > 1 && (
            <span
              role="button"
              tabIndex={0}
              aria-label={`Delete tier ${index + 1}`}
              className="text-muted-foreground hover:text-destructive -mr-1 inline-flex h-6 w-6 items-center justify-center rounded-md transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setDeleteIndex(index);
                setDeleteOpen(true);
              }}
              onKeyDown={(e) => {
                if (e.key !== "Enter" && e.key !== " ") return;
                e.preventDefault();
                e.stopPropagation();
                setDeleteIndex(index);
                setDeleteOpen(true);
              }}
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
        </div>
      ),
      path: String(index),
    }));
  }, [fields]);

  const handleAddTier = () => {
    const previousTier = form.getValues("tiers")?.[fields.length - 1];
    if (previousTier && previousTier.maxLifetimeSpend == null) {
      form.setValue(
        `tiers.${fields.length - 1}.maxLifetimeSpend`,
        getClosedTierMax(previousTier),
        { shouldDirty: true, shouldValidate: true },
      );
    }
    append(getNextTier(previousTier, fields.length + 1));
    setActiveTierIndex(fields.length);
  };

  const handleConfirmDelete = () => {
    const idx = deleteIndex;
    if (idx === null) return;
    const nextLen = Math.max(0, fields.length - 1);

    remove(idx);
    setDeleteOpen(false);
    setDeleteIndex(null);

    setActiveTierIndex((prev) => {
      if (nextLen === 0) return 0;
      if (idx < prev) return prev - 1;
      if (idx === prev) return Math.min(prev, nextLen - 1);
      return prev;
    });
  };

  const runSubmit = async () => {
    const valid = await form.trigger();
    if (!valid) throw new Error("Validation failed");
    const values = form.getValues();
    form.clearErrors("tiers");
    const tiersValidation = tierEditorStepSchema.safeParse({
      tiers: values.tiers,
    });
    if (!tiersValidation.success) {
      const firstIssue = tiersValidation.error.issues[0];
      for (const issue of tiersValidation.error.issues) {
        const [root, index, field] = issue.path;
        if (
          root === "tiers" &&
          typeof index === "number" &&
          typeof field === "string"
        ) {
          form.setError(`tiers.${index}.${field}` as never, {
            type: "manual",
            message: issue.message,
          });
        }
      }
      const message =
        typeof firstIssue?.path?.[1] === "number" && firstIssue.path[2]
          ? `Tier ${Number(firstIssue.path[1]) + 1}: ${String(firstIssue.path[2])} is required.`
          : firstIssue?.message || "Please complete all tiers before saving.";
      toast.error(message);
      throw new Error(message);
    }
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

              <div className="px-3">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-foreground text-base leading-none font-semibold">
                      Reward stages
                    </h3>
                    <p className="text-muted-foreground mt-0.5 text-sm">
                      Define tiers by lifetime spend
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddTier}
                    className="shrink-0"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    New tier
                  </Button>
                </div>
                <GooeyTabs
                  gooeyId="loyalty-tier-existing-gooey"
                  tabs={tabs}
                  activeTab={String(activeTierIndex)}
                  onTabChange={(path) => setActiveTierIndex(Number(path))}
                  fullBleed={false}
                  bgClassName="bg-[#F6F4ED]"
                  contentClassName="px-4 pt-4 pb-4"
                >
                  {fields[activeTierIndex] ? (
                    <TierFieldsSection
                      index={activeTierIndex}
                      isTopTier={
                        Number(watchedTiers?.[activeTierIndex]?.rank ?? 0) ===
                          maxRank && maxRank > 0
                      }
                    />
                  ) : (
                    <div className="text-muted-foreground text-sm">
                      No tiers found.
                    </div>
                  )}
                </GooeyTabs>
              </div>
            </div>
            <CardFooter className="flex shrink-0 justify-end border-0 px-4 py-2">
              <SaveButton
                onSave={runSubmit}
                disabled={!form.formState.isDirty || isSaving}
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

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteIndex === null
                ? "Delete tier?"
                : `Delete tier ${deleteIndex + 1}?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              This tier will be removed. You can add it back later if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteIndex(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive hover:bg-destructive/90 text-white hover:text-white"
              disabled={fields.length <= 1}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
