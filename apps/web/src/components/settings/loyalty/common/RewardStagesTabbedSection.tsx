"use client";

import { GooeyTabs } from "@/components/layouts";
import {
  createDefaultRewardStage,
  getNextRewardStage,
} from "@/lib/loyalty/form-defaults";
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
import { RewardStageFieldsSection } from "./RewardStageFieldsSection";

type RewardStageFormValue = NonNullable<
  LoyaltyProgramFormValues["rewardStages"]
>[number];

interface RewardStagesTabbedSectionProps {
  title: string;
  description: string;
  addButtonLabel: string;
  gooeyId: string;
  defaultStage: RewardStageFormValue;
}

export function RewardStagesTabbedSection({
  title,
  description,
  addButtonLabel,
  gooeyId,
  defaultStage,
}: RewardStagesTabbedSectionProps) {
  const form = useFormContext<LoyaltyProgramFormValues>();
  const [activeStageIndex, setActiveStageIndex] = useState(0);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "rewardStages",
  });

  useEffect(() => {
    if (fields.length > 0) return;
    append(createDefaultRewardStage(defaultStage, 0));
  }, [append, defaultStage, fields.length]);

  useEffect(() => {
    setActiveStageIndex((prev) => {
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
            <span>Stage {index + 1}</span>
            {fields.length > 1 && (
              <span
                role="button"
                tabIndex={0}
                aria-label={`Delete reward stage ${index + 1}`}
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

  const handleAddStage = () => {
    const previousStage = form.getValues("rewardStages")?.[fields.length - 1];
    append(
      previousStage
        ? getNextRewardStage(previousStage, fields.length)
        : createDefaultRewardStage(defaultStage, fields.length),
    );
    setActiveStageIndex(fields.length);
  };

  const handleConfirmDelete = () => {
    const idx = deleteIndex;
    if (idx === null) return;
    const nextLen = Math.max(0, fields.length - 1);

    remove(idx);
    setDeleteOpen(false);
    setDeleteIndex(null);

    setActiveStageIndex((prev) => {
      if (nextLen === 0) return 0;
      if (idx < prev) return prev - 1;
      if (idx === prev) return Math.min(prev, nextLen - 1);
      return prev;
    });
  };

  return (
    <>
      <div className="px-3">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-foreground text-base leading-none font-semibold">
              {title}
            </h3>
            <p className="text-muted-foreground mt-0.5 text-sm">
              {description}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddStage}
            className="shrink-0"
          >
            <Plus className="mr-2 h-4 w-4" />
            {addButtonLabel}
          </Button>
        </div>
        <GooeyTabs
          gooeyId={gooeyId}
          tabs={tabs}
          activeTab={String(activeStageIndex)}
          onTabChange={(path) => setActiveStageIndex(Number(path))}
          fullBleed={false}
          bgClassName="bg-[#F6F4ED]"
          contentClassName="px-4 pt-4 pb-4"
        >
          {fields[activeStageIndex] ? (
            <RewardStageFieldsSection index={activeStageIndex} />
          ) : (
            <div className="text-muted-foreground text-sm">
              No reward stages found.
            </div>
          )}
        </GooeyTabs>
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteIndex === null
                ? "Delete reward stage?"
                : `Delete reward stage ${deleteIndex + 1}?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              This reward stage will be removed. You can add it back later if
              needed.
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
    </>
  );
}
