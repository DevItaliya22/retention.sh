import { Coins } from "lucide-react";

interface PointsBalanceCardProps {
  balance: number;
  subtitle?: string;
}

export function PointsBalanceCard({
  balance,
  subtitle,
}: PointsBalanceCardProps) {
  return (
    <div className="bg-card flex items-center gap-4 rounded-xl border p-4">
      <div className="bg-primary/10 flex size-12 shrink-0 items-center justify-center rounded-full">
        <Coins className="text-primary size-6" />
      </div>
      <div className="min-w-0">
        <p className="text-muted-foreground text-xs">Points Balance</p>
        <p className="text-2xl font-bold tabular-nums">
          {balance.toLocaleString()}{" "}
          <span className="text-muted-foreground text-sm font-normal">pts</span>
        </p>
        {subtitle && (
          <p className="text-muted-foreground mt-0.5 text-xs">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
