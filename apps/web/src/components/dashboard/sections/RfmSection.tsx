"use client";

import { useCustomerSegmentsQuery } from "@/hooks/analytics/useAnalyticsQuery";
import type { CustomerSegment } from "@/lib/types/analytics";
import { InfoIcon } from "@reelo/ui/components";
import { Skeleton } from "@reelo/ui/components/skeleton";
import { cn } from "@reelo/ui/lib/utils";
import { Info } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { SectionHeader } from "../shared";

const SEGMENT_BG: Record<string, string> = {
  vip: "bg-blue-50 dark:bg-blue-950/30",
  loyal: "bg-green-50 dark:bg-green-950/30",
  "cant-loose": "bg-amber-50 dark:bg-amber-950/30",
  lost: "bg-red-50 dark:bg-red-950/30",
  "about-to-sleep": "bg-orange-50 dark:bg-orange-950/30",
  "at-risk": "bg-pink-50 dark:bg-pink-950/30",
  "potential-loyalist": "bg-teal-50 dark:bg-teal-950/30",
  promising: "bg-emerald-50 dark:bg-emerald-950/30",
  "needs-attention": "bg-yellow-50 dark:bg-yellow-950/30",
  other: "bg-muted",
};

function SegmentBlock({
  segment,
  onSelect,
}: {
  segment: CustomerSegment;
  onSelect: () => void;
}) {
  const bgClass = SEGMENT_BG[segment.slug] ?? "bg-muted";
  const isLarge =
    segment.percentage >= 15 ||
    ["vip", "loyal", "cant-loose"].includes(segment.slug);

  const infoContent = [segment.description, segment.proTip]
    .filter(Boolean)
    .join("\n\nPro-tip: ");

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        "flex cursor-pointer flex-col justify-end rounded-lg border p-3 text-left transition-colors hover:opacity-90",
        bgClass,
        isLarge ? "col-span-2 row-span-2" : "col-span-1 row-span-1",
      )}
    >
      <div className="mb-1 flex items-center gap-1">
        <p className="text-muted-foreground text-xs font-medium">
          {segment.name}
        </p>
        {infoContent && (
          <div
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            className="inline-flex"
          >
            <InfoIcon content={infoContent} size={12} />
          </div>
        )}
      </div>
      <p className="text-foreground text-2xl font-bold tabular-nums">
        {segment.percentage}%
      </p>
      <p className="text-muted-foreground text-xs">
        {segment.count.toLocaleString()} customers
      </p>
    </div>
  );
}

export function RfmSection() {
  const router = useRouter();
  const { data, isLoading } = useCustomerSegmentsQuery();

  const handleSelect = useCallback(
    (slug: string) => {
      router.push(`/customers?segment=${encodeURIComponent(slug)}`);
    },
    [router],
  );

  return (
    <section className="space-y-3">
      <SectionHeader
        title={
          data
            ? `${data.totalCustomers.toLocaleString()} Total Customers`
            : "Total Customers"
        }
        description="Customer segments based on visit patterns and spending. Click a segment to view customers."
      />
      {isLoading ? (
        <div className="grid auto-rows-[minmax(100px,1fr)] grid-cols-4 gap-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "bg-muted/20 flex flex-col justify-end rounded-lg border p-3",
                i < 3 ? "col-span-2 row-span-2" : "col-span-1 row-span-1",
              )}
            >
              <Skeleton className="mb-2 h-3 w-24" />
              <Skeleton className="mb-2 h-7 w-16" />
              <Skeleton className="h-3 w-28" />
            </div>
          ))}
        </div>
      ) : data?.segments && data.segments.length > 0 ? (
        <>
          <div className="grid auto-rows-[minmax(100px,1fr)] grid-cols-4 gap-3">
            {data.segments
              .filter((s) => s.slug !== "other")
              .sort((a, b) => b.percentage - a.percentage)
              .map((segment) => (
                <SegmentBlock
                  key={segment.slug}
                  segment={segment}
                  onSelect={() => handleSelect(segment.slug)}
                />
              ))}
          </div>
        </>
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
