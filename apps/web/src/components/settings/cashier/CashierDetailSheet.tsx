"use client";

import {
  useCashierDetail,
  useManageCashier,
} from "@/hooks/cashier/useManageCashier";
import { getErrorMessageFromResponse } from "@/lib/utils/error-handler";
import {
  Badge,
  Button,
  DateDisplay,
  Label,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  Skeleton,
} from "@reelo/ui/components";
import { ExternalLink, UserCheck, UserX } from "lucide-react";
import { useCallback } from "react";
import { toast } from "sonner";

interface CashierDetailSheetProps {
  cashierId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CashierDetailSheet({
  cashierId,
  open,
  onOpenChange,
}: CashierDetailSheetProps) {
  const { data, isLoading, isError, error } = useCashierDetail(cashierId);
  const { update } = useManageCashier();

  const cashier = data?.cashier ?? null;

  const handleSetActive = useCallback(
    async (active: boolean) => {
      if (!cashier?.id) return;
      try {
        await update.mutateAsync({
          id: cashier.id,
          data: {
            name: cashier.name,
            email: cashier.email ?? "",
            cashierLinkSlug: cashier.cashierLinkSlug,
            isActive: active,
          },
        });
        toast.success(
          active ? "Cashier has been enabled." : "Cashier has been disabled.",
        );
        if (!active) onOpenChange(false);
      } catch (err: unknown) {
        const msg = getErrorMessageFromResponse(
          err,
          active
            ? "Failed to enable cashier. Please try again."
            : "Failed to disable cashier. Please try again.",
        );
        toast.error(msg);
      }
    },
    [cashier, update, onOpenChange],
  );

  const handleOpenChange = useCallback(
    (next: boolean) => {
      onOpenChange(next);
    },
    [onOpenChange],
  );

  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 sm:max-w-xl"
      >
        <SheetHeader className="shrink-0">
          <div className="flex items-center gap-2">
            <SheetTitle className="text-lg">Cashier details</SheetTitle>
            {!isLoading && cashier && (
              <Badge
                variant={cashier.isActive ? "default" : "secondary"}
                className={
                  cashier.isActive
                    ? "bg-green-600/90 hover:bg-green-600/90"
                    : ""
                }
              >
                {cashier.isActive ? "Active" : "Inactive"}
              </Badge>
            )}
          </div>
          <SheetDescription>
            View cashier information and last 3 bills
          </SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 pb-4">
          {isLoading && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
              <div className="space-y-2 pt-2">
                <Skeleton className="h-4 w-28" />
                <div className="space-y-1.5">
                  <Skeleton className="h-12 w-full rounded-lg" />
                  <Skeleton className="h-12 w-full rounded-lg" />
                </div>
              </div>
            </div>
          )}

          {isError && (
            <div className="border-destructive/30 bg-destructive/5 rounded-lg border px-4 py-3">
              <p className="text-destructive text-sm">
                {error?.message ?? "Failed to load cashier details"}
              </p>
            </div>
          )}

          {!isLoading && cashier && (
            <div className="space-y-6">
              <section className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-foreground-lighter text-xs font-medium">
                    Name
                  </Label>
                  <p className="text-foreground text-sm">{cashier.name}</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-foreground-lighter text-xs font-medium">
                    Email
                  </Label>
                  <p className="text-foreground text-sm">
                    {cashier.email ?? "—"}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-foreground-lighter text-xs font-medium">
                    Created
                  </Label>
                  <p className="text-foreground-lighter text-sm">
                    <DateDisplay
                      date={cashier.createdAt}
                      relative={false}
                      formatOptions={{
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }}
                    />
                  </p>
                </div>
              </section>

              <section className="space-y-2">
                <Label className="text-foreground-lighter text-xs font-medium">
                  Last 3 bills
                </Label>
                {cashier.recentBills.length === 0 ? (
                  <p className="text-foreground-lighter rounded-lg border border-dashed py-6 text-center text-sm">
                    No bills yet
                  </p>
                ) : (
                  <ul className="space-y-1.5">
                    {cashier.recentBills.map((bill) => (
                      <li key={bill.id}>
                        <button
                          type="button"
                          onClick={() =>
                            window.open(
                              `/bills/${bill.id}`,
                              "_blank",
                              "noopener,noreferrer",
                            )
                          }
                          className="bg-muted/30 hover:bg-muted/50 flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors"
                        >
                          <div className="min-w-0 flex-1">
                            <span className="font-mono text-sm font-medium">
                              {bill.billNumber}
                            </span>
                            <span className="text-foreground-lighter ml-2 text-xs">
                              <DateDisplay
                                date={bill.createdAt}
                                relative={true}
                              />
                            </span>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <span className="text-foreground-lighter text-sm tabular-nums">
                              {bill.amount != null
                                ? `₹${bill.amount.toFixed(2)}`
                                : "—"}
                            </span>
                            <ExternalLink className="text-foreground-lighter h-3.5 w-3.5 shrink-0" />
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          )}
        </div>

        {cashier && (
          <SheetFooter className="bg-background sticky bottom-0 shrink-0 gap-2 border-t p-4">
            <div className="flex w-full items-center justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={update.isPending}
              >
                Close
              </Button>
              {cashier.isActive ? (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => handleSetActive(false)}
                  disabled={update.isPending}
                  loading={update.isPending}
                  className="gap-2"
                >
                  <UserX className="h-4 w-4" />
                  Disable cashier
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={() => handleSetActive(true)}
                  disabled={update.isPending}
                  loading={update.isPending}
                  className="gap-2"
                >
                  <UserCheck className="h-4 w-4" />
                  Enable cashier
                </Button>
              )}
            </div>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
