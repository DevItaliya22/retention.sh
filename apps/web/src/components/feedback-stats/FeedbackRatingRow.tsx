"use client";

export interface FeedbackRatingRowProps {
  label: string;
  avgRating: number;
  positive: number;
  neutral: number;
  negative: number;
}

const sentimentConfig = [
  {
    key: "positive" as const,
    label: "Positive",
    emoji: "😊",
    borderClass: "border-l-emerald-500",
    bgClass: "bg-emerald-500/8 dark:bg-emerald-500/10",
    textClass: "text-emerald-700 dark:text-emerald-400",
  },
  {
    key: "neutral" as const,
    label: "Neutral",
    emoji: "😐",
    borderClass: "border-l-amber-500",
    bgClass: "bg-amber-500/8 dark:bg-amber-500/10",
    textClass: "text-amber-700 dark:text-amber-400",
  },
  {
    key: "negative" as const,
    label: "Negative",
    emoji: "😞",
    borderClass: "border-l-rose-500",
    bgClass: "bg-rose-500/8 dark:bg-rose-500/10",
    textClass: "text-rose-700 dark:text-rose-400",
  },
] as const;

export function FeedbackRatingRow({
  label,
  avgRating,
  positive,
  neutral,
  negative,
}: FeedbackRatingRowProps) {
  const values = { positive, neutral, negative };

  return (
    <div className="group border-border/60 bg-card hover:border-border hover:bg-muted/30 grid w-full grid-cols-1 items-stretch gap-0 overflow-hidden rounded-xl border transition-colors sm:grid-cols-[minmax(0,1fr)_auto_280px]">
      <div className="border-border/50 flex items-center px-5 py-4 sm:border-r">
        <span className="text-foreground font-medium tracking-tight">
          {label}
        </span>
      </div>
      <div className="border-border/50 flex items-center justify-center bg-emerald-600/10 px-5 py-4 sm:border-r dark:bg-emerald-500/10">
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-semibold tracking-wider text-emerald-600 uppercase dark:text-emerald-400">
            Avg. Rating
          </span>
          <span className="text-2xl font-bold text-emerald-700 tabular-nums dark:text-emerald-300">
            {avgRating.toFixed(2)}
          </span>
          <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80">
            Out of 5
          </span>
        </div>
      </div>
      <div className="grid grid-cols-3">
        {sentimentConfig.map(
          ({ key, label: l, emoji, borderClass, bgClass, textClass }) => (
            <div
              key={key}
              className={`flex flex-col items-center justify-center gap-0.5 border-l-2 px-4 py-4 ${bgClass} ${borderClass}`}
            >
              <span className="text-base opacity-90" aria-hidden>
                {emoji}
              </span>
              <span className={`text-xl font-bold tabular-nums ${textClass}`}>
                {values[key]}
              </span>
              <span className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">
                {l}
              </span>
            </div>
          ),
        )}
      </div>
    </div>
  );
}
