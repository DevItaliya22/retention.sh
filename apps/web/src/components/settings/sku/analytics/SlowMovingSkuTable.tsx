"use client";

import { useSkuTopItemsQuery } from "@/hooks/analytics/useAnalyticsQuery";
import type { AnalyticsPeriod } from "@/lib/schemas/analytics";
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@reelo/ui/components";
import { Skeleton } from "@reelo/ui/components/skeleton";
import { TrendingDown } from "lucide-react";

interface SlowMovingSkuTableProps {
  period?: AnalyticsPeriod;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "Never";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function SlowMovingSkuTable({
  period = "30d",
}: SlowMovingSkuTableProps) {
  const { data, isLoading } = useSkuTopItemsQuery(period);
  const items = data?.slowMoving ?? [];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <TrendingDown className="size-4 text-amber-500" />
          <CardTitle className="text-sm font-medium">
            Slow-Moving SKUs
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        <div className="overflow-hidden rounded-b-lg">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="pl-6">SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Qty Sold</TableHead>
                <TableHead className="pr-6 text-right">Last Sold</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={`skeleton-${i}`}>
                    <TableCell className="pl-6">
                      <Skeleton className="h-4 w-28" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="ml-auto h-4 w-12" />
                    </TableCell>
                    <TableCell className="pr-6">
                      <Skeleton className="ml-auto h-4 w-20" />
                    </TableCell>
                  </TableRow>
                ))
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-muted-foreground py-8 text-center text-sm"
                  >
                    All SKUs are selling well
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.skuId}>
                    <TableCell className="pl-6">
                      <div className="font-medium">{item.skuName}</div>
                      <div className="text-muted-foreground text-xs">
                        {item.skuCode}
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.categoryName ? (
                        <Badge variant="secondary" size="xs">
                          {item.categoryName}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {item.qtySold === 0 ? (
                        <Badge variant="destructive" size="xs">
                          No sales
                        </Badge>
                      ) : (
                        item.qtySold.toLocaleString("en-IN")
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground pr-6 text-right text-sm">
                      {formatDate(item.lastSoldAt)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
