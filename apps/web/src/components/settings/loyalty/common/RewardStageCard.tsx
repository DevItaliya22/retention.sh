"use client";

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
} from "@reelo/ui/components";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { RewardStageFieldsSection } from "./RewardStageFieldsSection";

interface RewardStageCardProps {
  index: number;
  onRemove: () => void;
  canRemove: boolean;
}

export function RewardStageCard({
  index,
  onRemove,
  canRemove,
}: RewardStageCardProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);

  const handleConfirmRemove = () => {
    onRemove();
    setDeleteOpen(false);
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-row items-center justify-between gap-2">
        <h3 className="text-base font-medium">Reward stage {index + 1}</h3>
        {canRemove && (
          <>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive h-8 w-8"
              onClick={() => setDeleteOpen(true)}
              aria-label={`Delete reward stage ${index + 1}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Delete reward stage {index + 1}?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This reward stage will be removed. You can add it back later
                    if needed.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleConfirmRemove}
                    className="bg-destructive hover:bg-destructive/90 text-white hover:text-white"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </div>

      <RewardStageFieldsSection index={index} />
    </section>
  );
}
