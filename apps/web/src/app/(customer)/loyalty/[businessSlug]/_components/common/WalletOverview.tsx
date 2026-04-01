import { Coins, Gift, Wallet } from "lucide-react";
import { formatCurrency } from "./helpers";

interface WalletOverviewProps {
  pointsBalance: number;
  cashbackBalance: number;
  freeItemCount: number;
  currencySymbol?: string;
  pointsSubtitle?: string;
  accentColor?: string;
}

export function WalletOverview({
  pointsBalance,
  cashbackBalance,
  freeItemCount,
  currencySymbol = "₹",
  pointsSubtitle,
  accentColor,
}: WalletOverviewProps) {
  const ac = accentColor;

  return (
    <div
      className={ac ? "rounded-xl border p-4" : "bg-card rounded-xl border p-4"}
      style={
        ac ? { backgroundColor: `${ac}0A`, borderColor: `${ac}22` } : undefined
      }
    >
      <div
        className="grid grid-cols-3 divide-x"
        style={ac ? { borderColor: `${ac}18` } : undefined}
      >
        <div className="pr-3">
          <div className="mb-1.5 flex items-center gap-1.5">
            <Coins
              className={ac ? "size-3.5" : "text-primary size-3.5"}
              style={ac ? { color: ac } : undefined}
            />
            <span className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">
              Points
            </span>
          </div>
          <p className="text-lg leading-tight font-bold tabular-nums">
            {pointsBalance.toLocaleString()}
          </p>
          {pointsSubtitle && (
            <p className="text-muted-foreground mt-0.5 text-[10px] leading-tight">
              {pointsSubtitle}
            </p>
          )}
        </div>

        <div className="px-3">
          <div className="mb-1.5 flex items-center gap-1.5">
            <Wallet className="size-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">
              Cashback
            </span>
          </div>
          <p className="text-lg leading-tight font-bold tabular-nums">
            {formatCurrency(cashbackBalance, currencySymbol)}
          </p>
        </div>

        <div className="pl-3">
          <div className="mb-1.5 flex items-center gap-1.5">
            <Gift className="size-3.5 text-purple-500" />
            <span className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">
              Free Items
            </span>
          </div>
          <p className="text-lg leading-tight font-bold tabular-nums">
            {freeItemCount}
          </p>
          {freeItemCount > 0 && (
            <p className="text-[10px] leading-tight text-purple-600 dark:text-purple-400">
              unclaimed
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
