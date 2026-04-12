"use client";

import {
  useFeedbackDetailQuery,
  type FeedbackDetailDto,
} from "@/hooks/feedback/useFeedbackConfig";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  Skeleton,
} from "@reelo/ui/components";
import { cn } from "@reelo/ui/lib/utils";
import { Star } from "lucide-react";
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

const STAGGER_MS = 50;

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
        className="flex w-full flex-col gap-0 overflow-hidden sm:max-w-[420px]"
      >
        <SheetHeader className="border-border/50 shrink-0 space-y-0 border-b px-1 pb-4">
          <SheetTitle className="text-foreground/90 text-[15px] font-semibold tracking-tight">
            Feedback
          </SheetTitle>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
          <div
            className="from-muted/30 min-h-full bg-gradient-to-b to-transparent px-4 py-5"
            style={{ paddingBottom: "1.5rem" }}
          >
            {!feedbackResponseId ? null : isLoading ? (
              <DetailSkeleton />
            ) : isError ? (
              <div className="rounded-2xl border border-red-200 bg-red-500/5 px-4 py-8 text-center dark:border-red-900/40 dark:bg-red-950/30">
                <p className="text-sm font-medium text-red-600 dark:text-red-400">
                  {error?.message ?? "Failed to load"}
                </p>
              </div>
            ) : detail ? (
              <div className="flex flex-col gap-5">
                <RatingStrip
                  rating={detail.rating}
                  createdAt={detail.createdAt}
                  style={{ animationDelay: "0ms" }}
                />
                <CommentCard
                  comment={detail.comment}
                  style={{ animationDelay: `${STAGGER_MS}ms` }}
                />
                <SourceRow
                  detail={detail}
                  style={{ animationDelay: `${STAGGER_MS * 2}ms` }}
                />
                <MetaTags
                  detail={detail}
                  style={{ animationDelay: `${STAGGER_MS * 3}ms` }}
                />
              </div>
            ) : null}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-32 rounded-full" />
        <Skeleton className="h-3.5 w-28" />
      </div>
      <Skeleton className="h-24 w-full rounded-2xl" />
      <div className="flex gap-2">
        <Skeleton className="h-9 flex-1 rounded-xl" />
        <Skeleton className="h-9 w-20 rounded-xl" />
      </div>
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-6 w-16 rounded-lg" />
        <Skeleton className="h-6 w-20 rounded-lg" />
      </div>
    </div>
  );
}

function RatingStrip({
  rating,
  createdAt,
  style,
}: {
  rating: number | null;
  createdAt: string;
  style?: React.CSSProperties;
}) {
  const r = rating ?? 0;
  const isLow = r <= 2;
  const isMid = r === 3;

  return (
    <div
      className="animate-in fade-in slide-in-from-bottom-2 flex items-center gap-3 fill-current duration-300"
      style={style}
    >
      <div
        className={cn(
          "flex items-center gap-1 rounded-full px-3 py-1.5",
          isLow &&
            "bg-red-500/15 text-red-600 dark:bg-red-500/20 dark:text-red-400",
          isMid &&
            "bg-amber-500/15 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
          !isLow &&
            !isMid &&
            r > 0 &&
            "bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400",
          r === 0 && "bg-muted/60 text-muted-foreground",
        )}
      >
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={cn(
              "size-4",
              i <= r
                ? "fill-current opacity-100"
                : "fill-transparent opacity-40",
            )}
          />
        ))}
        <span className="ml-1.5 text-sm font-semibold tabular-nums">
          {rating != null ? `${rating}/5` : "—"}
        </span>
      </div>
      <span className="text-muted-foreground text-xs">
        {formatDate(createdAt)}
      </span>
    </div>
  );
}

function CommentCard({
  comment,
  style,
}: {
  comment: string | null;
  style?: React.CSSProperties;
}) {
  const hasComment = comment != null && comment.trim() !== "";

  return (
    <div
      className="animate-in fade-in slide-in-from-bottom-2 duration-300"
      style={style}
    >
      {hasComment ? (
        <div className="border-border/70 bg-background/80 relative rounded-2xl border px-4 py-4 shadow-sm backdrop-blur-[1px]">
          <span className="text-muted-foreground/40 absolute top-3 left-4 text-2xl leading-none">
            “
          </span>
          <p className="text-foreground/95 pr-1 pl-5 text-[15px] leading-relaxed break-words whitespace-pre-wrap">
            {comment}
          </p>
        </div>
      ) : (
        <p className="border-border/60 bg-muted/20 text-muted-foreground rounded-2xl border border-dashed px-4 py-6 text-center text-sm italic">
          No comment
        </p>
      )}
    </div>
  );
}

function SourceRow({
  detail,
  style,
}: {
  detail: FeedbackDetailDto;
  style?: React.CSSProperties;
}) {
  const hasCustomer = detail.customerName || detail.customerSlugId;
  const hasBill = detail.bill;

  return (
    <div
      className="animate-in fade-in slide-in-from-bottom-2 flex flex-col gap-1.5 duration-300"
      style={style}
    >
      <div className="flex flex-wrap items-center gap-2">
        {hasCustomer ? (
          <Link
            href={
              detail.customerSlugId
                ? `/customers/${detail.customerSlugId}`
                : "#"
            }
            className={cn(
              "border-border/70 bg-background/70 text-foreground/90 hover:border-foreground/20 hover:bg-muted/40 inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-colors",
              !detail.customerSlugId && "pointer-events-none opacity-80",
            )}
          >
            <span className="bg-muted text-foreground/80 flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
              {(detail.customerName || "?")?.[0]?.toUpperCase() ?? "?"}
            </span>
            <span className="max-w-[140px] truncate">
              {detail.customerName || "—"}
            </span>
          </Link>
        ) : null}
        {hasBill ? (
          <Link
            href={`/bills/${detail.bill!.id}`}
            className="border-border/70 bg-background/70 hover:border-foreground/20 hover:bg-muted/40 inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors"
          >
            <span className="text-foreground/90 font-medium tabular-nums">
              {detail.bill!.billNumber}
            </span>
            <span className="text-muted-foreground text-xs">
              {formatCurrency(
                detail.bill!.userPaidAmount ?? detail.bill!.finalAmount,
              )}
            </span>
          </Link>
        ) : null}
      </div>
      {detail.customerPhone ? (
        <p className="text-muted-foreground text-xs">{detail.customerPhone}</p>
      ) : null}
    </div>
  );
}

function MetaTags({
  detail,
  style,
}: {
  detail: FeedbackDetailDto;
  style?: React.CSSProperties;
}) {
  const hear = detail.howDidYouHear?.trim();
  const categories = detail.selectedCategories ?? [];
  const selections = detail.selectedSelectionOptions ?? [];
  const hasAny = hear || categories.length > 0 || selections.length > 0;
  if (!hasAny) return null;

  return (
    <div
      className="animate-in fade-in slide-in-from-bottom-2 flex flex-col gap-2 duration-300"
      style={style}
    >
      {hear ? (
        <p className="text-muted-foreground text-xs">
          <span className="text-foreground/70 font-medium">Heard via </span>
          {detail.howDidYouHear}
        </p>
      ) : null}
      {categories.length > 0 || selections.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {categories.map((c) => (
            <span
              key={c}
              className="bg-muted/50 text-foreground/80 rounded-lg px-2.5 py-1 text-xs font-medium"
            >
              {c}
            </span>
          ))}
          {selections.map((o) => (
            <span
              key={o.id}
              className="bg-muted/50 text-foreground/80 rounded-lg px-2.5 py-1 text-xs font-medium"
            >
              {o.label}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
