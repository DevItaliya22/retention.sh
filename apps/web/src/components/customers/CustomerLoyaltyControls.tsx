"use client";

import { useCustomerLoyaltyAdjustMutation } from "@/hooks/customers/useCustomerQuery";
import type { FreeItemEntry } from "@/lib/utils/free-items";
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
  Input,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@reelo/ui/components";
import { Gift, Sparkles, Wallet } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

function sanitizeNonNegativeInput(value: string) {
  return value.replace(/-/g, "").trimStart();
}

function getPositiveAmount(
  action: "cashback_delta" | "points_delta",
  rawValue: string,
) {
  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  if (action === "points_delta") {
    const points = Math.trunc(parsed);
    return points > 0 ? points : null;
  }

  return Number(parsed.toFixed(2));
}

export function CustomerLoyaltyControls({ slugId }: { slugId: string }) {
  const adjustMutation = useCustomerLoyaltyAdjustMutation(slugId);
  const [isOpen, setIsOpen] = useState(false);
  const [cashbackAmount, setCashbackAmount] = useState("");
  const [pointsAmount, setPointsAmount] = useState("");
  const [freeItemName, setFreeItemName] = useState("");
  const [description, setDescription] = useState("");

  const getDescription = () => {
    const trimmed = description.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={() => setIsOpen(true)}
      >
        Adjust
        <Sparkles className="size-3.5" />
      </Button>
      <SheetContent side="right" className="w-full sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Adjust Customer Loyalty</SheetTitle>
          <SheetDescription>
            Enter positive values only. Use Add or Remove actions below.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <div className="grid gap-3 rounded-xl border p-4">
            <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.14em] uppercase">
              <Wallet className="size-4" />
              Cashback (INR)
            </p>
            <Input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              placeholder="Amount"
              value={cashbackAmount}
              onChange={(e) =>
                setCashbackAmount(sanitizeNonNegativeInput(e.target.value))
              }
            />
            <div className="flex gap-2">
              <Button
                type="button"
                disabled={adjustMutation.isPending}
                onClick={async () => {
                  const amount = getPositiveAmount(
                    "cashback_delta",
                    cashbackAmount,
                  );
                  if (amount == null) {
                    toast.error("Enter a valid cashback amount");
                    return;
                  }
                  try {
                    await adjustMutation.mutateAsync({
                      action: "cashback_delta",
                      delta: amount,
                      description: getDescription(),
                    });
                    toast.success("Cashback added");
                    setCashbackAmount("");
                  } catch (error) {
                    toast.error(
                      error instanceof Error
                        ? error.message
                        : "Failed to update cashback",
                    );
                  }
                }}
              >
                Add Cashback
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={adjustMutation.isPending}
                onClick={async () => {
                  const amount = getPositiveAmount(
                    "cashback_delta",
                    cashbackAmount,
                  );
                  if (amount == null) {
                    toast.error("Enter a valid cashback amount");
                    return;
                  }
                  try {
                    await adjustMutation.mutateAsync({
                      action: "cashback_delta",
                      delta: -amount,
                      description: getDescription(),
                    });
                    toast.success("Cashback removed");
                    setCashbackAmount("");
                  } catch (error) {
                    toast.error(
                      error instanceof Error
                        ? error.message
                        : "Failed to update cashback",
                    );
                  }
                }}
              >
                Remove Cashback
              </Button>
            </div>
          </div>

          <div className="grid gap-3 rounded-xl border p-4">
            <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.14em] uppercase">
              <Sparkles className="size-4" />
              Points
            </p>
            <Input
              type="number"
              inputMode="numeric"
              min="0"
              step="1"
              placeholder="Points"
              value={pointsAmount}
              onChange={(e) =>
                setPointsAmount(sanitizeNonNegativeInput(e.target.value))
              }
            />
            <div className="flex gap-2">
              <Button
                type="button"
                disabled={adjustMutation.isPending}
                onClick={async () => {
                  const amount = getPositiveAmount(
                    "points_delta",
                    pointsAmount,
                  );
                  if (amount == null) {
                    toast.error("Enter a valid points amount");
                    return;
                  }
                  try {
                    await adjustMutation.mutateAsync({
                      action: "points_delta",
                      delta: amount,
                      description: getDescription(),
                    });
                    toast.success("Points added");
                    setPointsAmount("");
                  } catch (error) {
                    toast.error(
                      error instanceof Error
                        ? error.message
                        : "Failed to update points",
                    );
                  }
                }}
              >
                Add Points
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={adjustMutation.isPending}
                onClick={async () => {
                  const amount = getPositiveAmount(
                    "points_delta",
                    pointsAmount,
                  );
                  if (amount == null) {
                    toast.error("Enter a valid points amount");
                    return;
                  }
                  try {
                    await adjustMutation.mutateAsync({
                      action: "points_delta",
                      delta: -amount,
                      description: getDescription(),
                    });
                    toast.success("Points removed");
                    setPointsAmount("");
                  } catch (error) {
                    toast.error(
                      error instanceof Error
                        ? error.message
                        : "Failed to update points",
                    );
                  }
                }}
              >
                Remove Points
              </Button>
            </div>
          </div>

          <div className="grid gap-3 rounded-xl border p-4">
            <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.14em] uppercase">
              <Gift className="size-4" />
              Free Item
            </p>
            <Input
              placeholder="Item name"
              value={freeItemName}
              onChange={(e) => setFreeItemName(e.target.value)}
            />
            <div className="flex gap-2">
              <Button
                type="button"
                disabled={adjustMutation.isPending}
                onClick={async () => {
                  const itemName = freeItemName.trim();
                  if (!itemName) {
                    toast.error("Enter a free item name");
                    return;
                  }
                  try {
                    await adjustMutation.mutateAsync({
                      action: "add_free_item",
                      skuName: itemName,
                      description: getDescription(),
                    });
                    toast.success("Free item added");
                    setFreeItemName("");
                  } catch (error) {
                    toast.error(
                      error instanceof Error
                        ? error.message
                        : "Failed to add free item",
                    );
                  }
                }}
              >
                Add Free Item
              </Button>
            </div>
          </div>

          <div className="grid gap-2">
            <p className="text-muted-foreground text-xs">Optional note</p>
            <Input
              placeholder="Reason for adjustment (saved in activity)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function FreeItemRemoveButton({
  slugId,
  freeItem,
}: {
  slugId: string;
  freeItem: FreeItemEntry;
}) {
  const adjustMutation = useCustomerLoyaltyAdjustMutation(slugId);
  const [open, setOpen] = useState(false);

  if (!freeItem.id) {
    return <span className="text-muted-foreground text-xs">—</span>;
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900/60 dark:text-red-400 dark:hover:bg-red-950/40"
        onClick={() => setOpen(true)}
        disabled={adjustMutation.isPending}
      >
        Remove
      </Button>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove free item?</AlertDialogTitle>
          <AlertDialogDescription>
            This removes <strong>{freeItem.skuName}</strong> from the customer
            wallet. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={adjustMutation.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={adjustMutation.isPending}
            onClick={async () => {
              try {
                await adjustMutation.mutateAsync({
                  action: "remove_free_item",
                  freeItemId: freeItem.id!,
                });
                toast.success("Free item removed");
                setOpen(false);
              } catch (error) {
                toast.error(
                  error instanceof Error
                    ? error.message
                    : "Failed to remove free item",
                );
              }
            }}
          >
            {adjustMutation.isPending ? "Removing..." : "Yes, Remove"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
