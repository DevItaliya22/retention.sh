"use client";

import {
  type AnalyticsPeriod,
  analyticsPeriods,
} from "@/lib/schemas/analytics";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@reelo/ui/components";

const periodLabels: Record<AnalyticsPeriod, string> = {
  "7d": "Last 7 Days",
  "30d": "Last 30 Days",
  "90d": "Last 90 Days",
  "12mo": "Last 12 Months",
};

interface PeriodSelectorProps {
  value: AnalyticsPeriod;
  onChange: (value: AnalyticsPeriod) => void;
}

export function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as AnalyticsPeriod)}>
      <SelectTrigger
        size="sm"
        className="border-border/60 bg-background text-foreground hover:bg-muted/40 w-[160px] shadow-none"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {analyticsPeriods.map((p) => (
          <SelectItem key={p} value={p}>
            {periodLabels[p]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
