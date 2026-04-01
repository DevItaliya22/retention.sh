const VARIANTS: Record<string, { label: string; className: string }> = {
  EARNED: {
    label: "Earned",
    className:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  },
  REDEEMED: {
    label: "Redeemed",
    className:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  },
  EXPIRED: {
    label: "Expired",
    className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  },
  GIFTED: {
    label: "Gifted",
    className:
      "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  },
  ADJUSTMENT: {
    label: "Adjusted",
    className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  },
  REFUNDED: {
    label: "Refunded",
    className:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  },
};

export function TransactionTypeBadge({ type }: { type: string }) {
  const v = VARIANTS[type] ?? {
    label: type,
    className: "border border-black/10 bg-white text-foreground",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${v.className}`}
    >
      {v.label}
    </span>
  );
}
