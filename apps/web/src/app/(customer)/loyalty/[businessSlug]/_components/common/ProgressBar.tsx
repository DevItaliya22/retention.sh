interface ProgressBarProps {
  value: number;
  max: number;
  className?: string;
  barClassName?: string;
  /** Inline color override (e.g. branding theme color) — takes precedence over barClassName */
  barColor?: string;
}

export function ProgressBar({
  value,
  max,
  className = "",
  barClassName = "",
  barColor,
}: ProgressBarProps) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div
      className={`bg-muted h-2 w-full overflow-hidden rounded-full ${className}`}
    >
      <div
        className={`h-full rounded-full transition-all duration-500 ${barColor ? "" : barClassName || "bg-primary"}`}
        style={{
          width: `${pct}%`,
          ...(barColor ? { backgroundColor: barColor } : {}),
        }}
      />
    </div>
  );
}
