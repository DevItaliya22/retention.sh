"use client";

import { GooeyTabs } from "@/components/layouts";
import { getClosedTierMax, getNextTier } from "@/lib/loyalty/form-defaults";
import type { LoyaltyProgramFormValues } from "@/lib/schemas/loyalty-form";
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
  useFormContext,
} from "@reelo/ui/components";
import { Plus, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useFieldArray } from "react-hook-form";
import { TierCard } from "./TierCard";

export function TierEditorStep() {
  const form = useFormContext<LoyaltyProgramFormValues>();
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "tiers",
  });
  const watchedTiers = form.watch("tiers") ?? [];
  const maxRank =
    watchedTiers.length > 0
      ? Math.max(...watchedTiers.map((t) => Number(t?.rank ?? 0)))
      : 0;

  const tiersError = form.formState.errors.tiers?.message as string | undefined;

  const [activeTierIndex, setActiveTierIndex] = useState(0);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

  useEffect(() => {
    setActiveTierIndex((prev) => {
      if (fields.length === 0) return 0;
      return Math.max(0, Math.min(prev, fields.length - 1));
    });
  }, [fields.length]);

  const tabs = useMemo(
    () =>
      fields.map((_, index) => ({
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
      })),
    [fields],
  );

  const handleConfirmDelete = () => {
    const idx = deleteIndex;
    if (idx === null) return;
    const nextLen = Math.max(0, fields.length - 1);

    const currentTiers = form.getValues("tiers") ?? [];
    if (currentTiers.length <= 1) return;
    const nextTiers = currentTiers.filter((_tier, index) => index !== idx);
    form.setValue("tiers", nextTiers, {
      shouldDirty: true,
      shouldValidate: true,
    });
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

  return (
    <div className="grid gap-4">
      {tiersError ? (
        <p className="text-destructive text-sm" role="alert">
          {tiersError}
        </p>
      ) : null}

      <div className="px-1">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-foreground text-base leading-none font-semibold">
              Tiers
            </h3>
            <p className="text-muted-foreground mt-0.5 text-sm">
              Define tiers by lifetime spend
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
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
            }}
            className="shrink-0"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add tier
          </Button>
        </div>

        <GooeyTabs
          gooeyId="loyalty-tier-onboarding-gooey"
          tabs={tabs}
          activeTab={String(activeTierIndex)}
          onTabChange={(path) => setActiveTierIndex(Number(path))}
          fullBleed={false}
          bgClassName="bg-[#F6F4ED]"
          contentClassName="px-4 pt-4 pb-4"
        >
          {fields[activeTierIndex] ? (
            <TierCard
              index={activeTierIndex}
              isTopTier={
                Number(watchedTiers?.[activeTierIndex]?.rank ?? 0) ===
                  maxRank && maxRank > 0
              }
            />
          ) : (
            <div className="text-muted-foreground text-sm">No tiers found.</div>
          )}
        </GooeyTabs>
      </div>
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
    </div>
  );
}
