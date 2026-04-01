import { Gift } from "lucide-react";
import { formatSource } from "./helpers";
import type { FreeItem } from "./types";

interface FreeItemsCardProps {
  items: FreeItem[];
  accentColor?: string;
}

export function FreeItemsCard({ items, accentColor }: FreeItemsCardProps) {
  if (items.length === 0) return null;
  const ac = accentColor;

  return (
    <div
      className={ac ? "rounded-xl border p-4" : "bg-card rounded-xl border p-4"}
      style={
        ac ? { backgroundColor: `${ac}0A`, borderColor: `${ac}22` } : undefined
      }
    >
      <div className="mb-3 flex items-center gap-2">
        <Gift
          className={ac ? "size-4" : "size-4 text-purple-500"}
          style={ac ? { color: ac } : undefined}
        />
        <h3 className="text-sm font-semibold">Free items to claim</h3>
      </div>
      <p className="text-muted-foreground mb-3 text-xs">
        Claim these at the store on your next visit.
      </p>
      <ul className="space-y-2">
        {items.map((item) => {
          const sourceLabel = formatSource(item.source);
          return (
            <li
              key={item.id}
              className={
                ac
                  ? "flex items-center justify-between rounded-lg px-3 py-2 text-sm"
                  : "flex items-center justify-between rounded-lg bg-purple-50 px-3 py-2 text-sm dark:bg-purple-900/20"
              }
              style={ac ? { backgroundColor: `${ac}10` } : undefined}
            >
              <span className="font-medium">{item.skuName}</span>
              {sourceLabel ? (
                <span className="text-muted-foreground text-xs">
                  {sourceLabel}
                </span>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
