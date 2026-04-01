"use client";

import {
  DateDisplay,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@reelo/ui/components";
import { Receipt } from "lucide-react";
import { useMemo, useState } from "react";
import { TX_PER_PAGE, getFreeItemName, getTransactionLabel } from "./helpers";
import { PaginationControls } from "./PaginationControls";
import { TransactionTypeBadge } from "./TransactionTypeBadge";
import type { LoyaltyTransaction } from "./types";

interface TransactionHistoryProps {
  transactions: LoyaltyTransaction[];
  accentColor?: string;
}

export function TransactionHistory({
  transactions,
  accentColor,
}: TransactionHistoryProps) {
  const ac = accentColor;
  const [page, setPage] = useState(1);

  const paginated = useMemo(() => {
    const total = transactions.length;
    const totalPages = Math.max(1, Math.ceil(total / TX_PER_PAGE));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * TX_PER_PAGE;
    return {
      items: transactions.slice(start, start + TX_PER_PAGE),
      total,
      totalPages,
      page: safePage,
    };
  }, [transactions, page]);

  return (
    <div
      className={
        ac ? "rounded-xl border p-4" : "rounded-xl border bg-white p-4"
      }
      style={
        ac ? { backgroundColor: `${ac}0A`, borderColor: `${ac}22` } : undefined
      }
    >
      <div className="mb-3 flex items-center gap-2">
        <Receipt
          className={ac ? "size-4" : "size-4"}
          style={ac ? { color: ac } : undefined}
        />
        <h3 className="text-sm font-semibold">Transaction History</h3>
      </div>

      {paginated.total > 0 ? (
        <>
          <div className="-mx-4 overflow-x-auto px-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs">Description</TableHead>
                  <TableHead className="text-xs">Type</TableHead>
                  <TableHead className="text-right text-xs">Amount</TableHead>
                  <TableHead className="text-right text-xs">Expires</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.items.map((tx, index) => {
                  const isCb = tx.valueKind === "CASHBACK";
                  const isFreeItem = tx.valueKind === "FREE_ITEM";
                  const freeItem = isFreeItem ? getFreeItemName(tx) : null;
                  const amountStr = isCb
                    ? `₹${Math.abs(tx.amount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : isFreeItem
                      ? freeItem || "Free item"
                      : `${Math.abs(tx.amount)} pts`;

                  return (
                    <TableRow
                      key={`${tx.createdAt}-${tx.type}-${tx.amount}-${index}`}
                    >
                      <TableCell className="text-xs whitespace-nowrap">
                        <DateDisplay date={tx.createdAt} />
                      </TableCell>
                      <TableCell className="max-w-[160px] text-xs">
                        <span className="font-medium">
                          {getTransactionLabel(tx)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <TransactionTypeBadge type={tx.type} />
                      </TableCell>
                      <TableCell className="text-right">
                        {isFreeItem ? (
                          <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
                            {tx.type === "REDEEMED" ? "Claimed" : "1 item"}
                          </span>
                        ) : (
                          <span
                            className={`text-xs font-medium ${
                              tx.amount > 0
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-red-600 dark:text-red-400"
                            }`}
                          >
                            {tx.amount > 0 ? "+" : "−"}
                            {amountStr}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-right text-xs whitespace-nowrap">
                        {tx.type === "EXPIRED" ? (
                          <span className="text-red-600 dark:text-red-400">
                            Expired
                          </span>
                        ) : tx.expiresAt ? (
                          <DateDisplay date={tx.expiresAt} />
                        ) : (
                          "—"
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <PaginationControls
            page={paginated.page}
            totalPages={paginated.totalPages}
            totalItems={paginated.total}
            onPageChange={setPage}
            label="transactions"
          />
        </>
      ) : (
        <Empty className="py-6">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Receipt className="size-5" />
            </EmptyMedia>
            <EmptyTitle className="text-sm">No transactions yet</EmptyTitle>
            <EmptyDescription className="text-xs">
              Your history will appear here after your first transaction.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </div>
  );
}
