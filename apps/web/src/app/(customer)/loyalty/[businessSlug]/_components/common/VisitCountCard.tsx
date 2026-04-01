import { Footprints } from "lucide-react";

interface VisitCountCardProps {
  count: number;
  subtitle?: string;
  accentColor?: string;
}

export function VisitCountCard({
  count,
  subtitle,
  accentColor,
}: VisitCountCardProps) {
  const ac = accentColor;

  return (
    <div
      className={
        ac
          ? "flex items-center gap-4 rounded-xl border p-4"
          : "bg-card flex items-center gap-4 rounded-xl border p-4"
      }
      style={
        ac ? { backgroundColor: `${ac}0A`, borderColor: `${ac}22` } : undefined
      }
    >
      <div
        className={
          ac
            ? "flex size-12 shrink-0 items-center justify-center rounded-full"
            : "flex size-12 shrink-0 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30"
        }
        style={ac ? { backgroundColor: `${ac}18` } : undefined}
      >
        <Footprints
          className={
            ac ? "size-6" : "size-6 text-indigo-600 dark:text-indigo-400"
          }
          style={ac ? { color: ac } : undefined}
        />
      </div>
      <div className="min-w-0">
        <p className="text-muted-foreground text-xs">Total Visits</p>
        <p className="text-2xl font-bold tabular-nums">
          {count.toLocaleString()}
        </p>
        {subtitle && (
          <p className="text-muted-foreground mt-0.5 text-xs">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
