"use client";

import {
  useFeedbackDetailQuery,
  type FeedbackDetailDto,
} from "@/hooks/feedback/useFeedbackConfig";
import {
  buttonVariants,
  Label,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  Skeleton,
} from "@reelo/ui/components";
import { ExternalLink, FileText, User } from "lucide-react";
import Link from "next/link";

interface FeedbackCommentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feedbackResponseId: string | null;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function formatCurrency(amount: number | null) {
  if (amount == null) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function FeedbackCommentSheet({
  open,
  onOpenChange,
  feedbackResponseId,
}: FeedbackCommentSheetProps) {
  const {
    data: detail,
    isLoading,
    isError,
    error,
  } = useFeedbackDetailQuery(feedbackResponseId);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 sm:max-w-lg"
      >
        <SheetHeader className="shrink-0">
          <SheetTitle>Feedback details</SheetTitle>
          <SheetDescription>
            Customer, bill, and full feedback. Data loads when you open this
            panel.
          </SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-2 pb-4">
          {!feedbackResponseId ? null : isLoading ? (
            <DetailSkeleton />
          ) : isError ? (
            <p className="text-destructive text-sm">
              {error?.message ?? "Failed to load feedback"}
            </p>
          ) : detail ? (
            <div className="space-y-6">
              <DetailsSection detail={detail} />
              <CommentSection comment={detail.comment} />
            </div>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-10 w-48" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-16 w-full rounded-lg" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
    </div>
  );
}

function DetailsSection({ detail }: { detail: FeedbackDetailDto }) {
  return (
    <div className="space-y-6">
      {/* Customer */}
      <section className="space-y-2">
        <Label className="text-muted-foreground text-xs font-medium">
          Customer
        </Label>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-foreground text-sm font-medium">
            {detail.customerName || "—"}
          </span>
          {detail.customerSlugId ? (
            <Link
              href={`/customers/${detail.customerSlugId}`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <User className="mr-1.5 size-3.5" />
              View customer
            </Link>
          ) : null}
        </div>
        {detail.customerPhone ? (
          <p className="text-muted-foreground text-xs">
            {detail.customerPhone}
          </p>
        ) : null}
      </section>

      {/* Bill */}
      <section className="space-y-2">
        <Label className="text-muted-foreground text-xs font-medium">
          Bill (this feedback)
        </Label>
        {detail.bill ? (
          <div className="bg-muted/30 rounded-lg border p-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-medium">{detail.bill.billNumber}</span>
              <Link
                href={`/bills/${detail.bill.id}`}
                className={buttonVariants({ variant: "ghost", size: "sm" })}
              >
                <ExternalLink className="mr-1 size-3.5" />
                View bill
              </Link>
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              {formatDate(detail.bill.createdAt)} ·{" "}
              {formatCurrency(
                detail.bill.userPaidAmount ?? detail.bill.finalAmount,
              )}
            </p>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">No bill linked</p>
        )}
      </section>

      {/* Feedback summary */}
      <section className="space-y-2">
        <Label className="text-muted-foreground text-xs font-medium">
          Rating & date
        </Label>
        <p className="text-foreground text-sm">
          {detail.rating != null ? `${detail.rating}/5` : "—"} ·{" "}
          {formatDate(detail.createdAt)}
        </p>
      </section>

      {detail.howDidYouHear ? (
        <section className="space-y-2">
          <Label className="text-muted-foreground text-xs font-medium">
            How did you hear about us?
          </Label>
          <p className="text-foreground text-sm">{detail.howDidYouHear}</p>
        </section>
      ) : null}

      {detail.selectedCategories?.length ? (
        <section className="space-y-2">
          <Label className="text-muted-foreground text-xs font-medium">
            Categories
          </Label>
          <p className="text-foreground text-sm">
            {detail.selectedCategories.join(", ")}
          </p>
        </section>
      ) : null}

      {detail.selectedSelectionOptions?.length ? (
        <section className="space-y-2">
          <Label className="text-muted-foreground text-xs font-medium">
            Selections
          </Label>
          <p className="text-foreground text-sm">
            {detail.selectedSelectionOptions.map((o) => o.label).join(", ")}
          </p>
        </section>
      ) : null}
    </div>
  );
}

function CommentSection({ comment }: { comment: string | null }) {
  const hasComment = comment != null && comment.trim() !== "";

  return (
    <div className="space-y-2">
      <Label className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
        <FileText className="size-3.5" />
        Comment
      </Label>
      {hasComment ? (
        <p className="text-foreground bg-muted/20 rounded-lg border p-3 text-sm break-words whitespace-pre-wrap">
          {comment}
        </p>
      ) : (
        <p className="text-muted-foreground text-sm">No comment</p>
      )}
    </div>
  );
}
