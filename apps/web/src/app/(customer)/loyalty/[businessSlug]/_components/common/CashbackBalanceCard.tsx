import { Wallet } from "lucide-react";
import { formatCurrency } from "./helpers";

interface CashbackBalanceCardProps {
  balance: number;
  currencySymbol?: string;
  subtitle?: string;
}

export function CashbackBalanceCard({
  balance,
  currencySymbol = "₹",
  subtitle,
}: CashbackBalanceCardProps) {
  return (
    <div className="bg-card flex items-center gap-4 rounded-xl border p-4">
      <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
        <Wallet className="size-6 text-emerald-600 dark:text-emerald-400" />
      </div>
      <div className="min-w-0">
        <p className="text-muted-foreground text-xs">Cashback Balance</p>
        <p className="text-2xl font-bold tabular-nums">
          {formatCurrency(balance, currencySymbol)}
        </p>
        {subtitle && (
          <p className="text-muted-foreground mt-0.5 text-xs">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
