"use client";

import { useSkuTopItemsQuery } from "@/hooks/analytics/useAnalyticsQuery";
import { useCurrentBusiness } from "@/hooks/business/useCurrentBusiness";
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
import { TrendingUp } from "lucide-react";

interface TopSellingSkuTableProps {
  period?: AnalyticsPeriod;
}

export function TopSellingSkuTable({
  period = "30d",
}: TopSellingSkuTableProps) {
  const { data, isLoading } = useSkuTopItemsQuery(period);
  const { data: businessData } = useCurrentBusiness();
  const currencySymbol = businessData?.business?.defaultCurrencySymbol ?? "$";
  const items = data?.topSelling ?? [];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="text-primary size-4" />
          <CardTitle className="text-sm font-medium">
            Top Selling SKUs
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        <div className="overflow-hidden rounded-b-lg">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="w-10 pl-6">#</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Qty Sold</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="pr-6 text-right">Share</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={`skeleton-${i}`}>
                    <TableCell className="pl-6">
                      <Skeleton className="h-4 w-4" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-28" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="ml-auto h-4 w-12" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="ml-auto h-4 w-16" />
                    </TableCell>
                    <TableCell className="pr-6">
                      <Skeleton className="ml-auto h-4 w-12" />
                    </TableCell>
                  </TableRow>
                ))
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-muted-foreground py-8 text-center text-sm"
                  >
                    No sales data in this period
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item, idx) => (
                  <TableRow key={item.skuId}>
                    <TableCell className="text-muted-foreground pl-6 font-medium">
                      {idx + 1}
                    </TableCell>
                    <TableCell>
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
                      {item.qtySold.toLocaleString("en-IN")}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {currencySymbol}
                      {item.revenue.toLocaleString("en-IN", {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })}
                    </TableCell>
                    <TableCell className="pr-6 text-right tabular-nums">
                      {item.revenueShare}%
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
