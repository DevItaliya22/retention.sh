"use client";

import { useRfmQuery } from "@/hooks/analytics/useAnalyticsQuery";
import type { RfmSegment } from "@/lib/types/analytics";
import { Skeleton } from "@reelo/ui/components/skeleton";
import { cn } from "@reelo/ui/lib/utils";
import { Info } from "lucide-react";
import { SectionHeader } from "../shared";

const SEGMENT_BG: Record<string, string> = {
  New: "bg-emerald-50 dark:bg-emerald-950/30",
  Promising: "bg-teal-50 dark:bg-teal-950/30",
  VIP: "bg-blue-50 dark:bg-blue-950/30",
  Loyal: "bg-green-50 dark:bg-green-950/30",
  "Needs Attention": "bg-yellow-50 dark:bg-yellow-950/30",
  "At Risk": "bg-pink-50 dark:bg-pink-950/30",
  Lost: "bg-red-50 dark:bg-red-950/30",
};

function SegmentBlock({ segment }: { segment: RfmSegment }) {
  const bgClass = SEGMENT_BG[segment.name] ?? "bg-muted";
  const isLarge = segment.percentage >= 15;

  return (
    <div
      className={cn(
        "flex flex-col justify-end rounded-lg border p-3 transition-colors",
        bgClass,
        isLarge ? "col-span-2 row-span-2" : "col-span-1 row-span-1",
      )}
    >
      {isLarge && (
        <p className="text-muted-foreground mb-auto text-xs">{segment.name}</p>
      )}
      <p className="text-foreground text-2xl font-bold tabular-nums">
        {segment.percentage}%
      </p>
      <p className="text-muted-foreground text-xs">
        {segment.count.toLocaleString()} customers
      </p>
      {!isLarge && (
        <p className="text-muted-foreground mt-0.5 text-xs font-medium">
          {segment.name}
        </p>
      )}
    </div>
  );
}

export function RfmSection() {
  const { data, isLoading } = useRfmQuery();

  return (
    <section className="space-y-3">
      <SectionHeader
        title={
          data
            ? `${data.totalCustomers.toLocaleString()} Total Customers`
            : "Total Customers"
        }
        description="Explore how recently, how often and how much money a customer has given your brand with RFM analysis."
      />
      {isLoading ? (
        <div className="grid grid-cols-4 gap-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton
              key={i}
              className={cn(
                "rounded-lg",
                i < 2 ? "col-span-2 row-span-2 h-36" : "h-28",
              )}
            />
          ))}
        </div>
      ) : data?.segments && data.segments.length > 0 ? (
        <div className="grid auto-rows-[minmax(100px,1fr)] grid-cols-4 gap-3">
          {data.segments
            .filter((s) => s.count > 0)
            .sort((a, b) => b.percentage - a.percentage)
            .map((segment) => (
              <SegmentBlock key={segment.name} segment={segment} />
            ))}
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-lg border p-6">
          <Info className="text-muted-foreground size-4" />
          <p className="text-muted-foreground text-sm">
            No customer data available yet.
          </p>
        </div>
      )}
    </section>
  );
}
