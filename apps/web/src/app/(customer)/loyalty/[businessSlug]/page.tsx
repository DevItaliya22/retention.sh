"use client";

import { CustomerLogoutButton } from "@/components/customer/CustomerLogoutButton";
import { PageLayout, ScaffoldContainer } from "@/components/layouts";
import { fetcher } from "@/lib/fetcher";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DateDisplay,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@reelo/ui/components";
import { Gift, Receipt } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";

interface LoyaltyDetailResponse {
  loyalty: {
    business: {
      id: string;
      name: string;
      slug: string;
      currencySymbol: string;
    };
    settings: unknown | null;
    pointsBalance: number;
    buckets: { id: string; remainingAmount: number; expiresAt: string }[];
    transactions: {
      id: string;
      amount: number;
      type: string;
      source: string;
      createdAt: string;
      expiresAt: string | null;
      metadata: unknown;
    }[];
  } | null;
  error?: string;
}

export default function LoyaltyDetailPage() {
  const params = useParams();
  const businessSlug = params?.businessSlug as string | undefined;

  const { data, isLoading, isError, error } = useQuery<
    LoyaltyDetailResponse,
    Error
  >({
    queryKey: ["customer-loyalty-detail", businessSlug],
    queryFn: () =>
      fetcher<LoyaltyDetailResponse>(`/api/customer/loyalty/${businessSlug}`),
    enabled: !!businessSlug,
  });

  if (!businessSlug) {
    return (
      <PageLayout
        title="Loyalty"
        subtitle="Invalid link"
        size="default"
        scaffoldSectionClassName="h-full w-full pt-2 pb-0"
      >
        <ScaffoldContainer>
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-destructive text-sm font-medium">
              Missing business. Please use the link shared with you.
            </p>
          </div>
        </ScaffoldContainer>
      </PageLayout>
    );
  }

  if (isLoading) {
    return (
      <PageLayout
        title="Loyalty"
        subtitle="Loading..."
        size="default"
        scaffoldSectionClassName="h-full w-full pt-2 pb-0"
      >
        <ScaffoldContainer>
          <div className="space-y-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </ScaffoldContainer>
      </PageLayout>
    );
  }

  if (isError) {
    return (
      <PageLayout
        title="Loyalty"
        subtitle="Something went wrong"
        size="default"
        scaffoldSectionClassName="h-full w-full pt-2 pb-0"
      >
        <ScaffoldContainer>
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-destructive text-sm font-medium">
              Failed to load loyalty details
            </p>
            <p className="text-muted-foreground mt-1 text-sm">
              {error?.message ?? "Please try again later."}
            </p>
          </div>
        </ScaffoldContainer>
      </PageLayout>
    );
  }

  if (!data?.loyalty) {
    return (
      <PageLayout
        title="Loyalty"
        subtitle="Not found"
        size="default"
        scaffoldSectionClassName="h-full w-full pt-2 pb-0"
      >
        <ScaffoldContainer>
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground text-sm">
              Loyalty data not found. You may not have access to this business.
            </p>
          </div>
        </ScaffoldContainer>
      </PageLayout>
    );
  }

  const { loyalty } = data;

  return (
    <PageLayout
      title={loyalty.business.name}
      subtitle={`Points balance: ${loyalty.pointsBalance}`}
      size="default"
      scaffoldSectionClassName="h-full w-full pt-2 pb-0"
      primaryActions={
        <CustomerLogoutButton businessSlug={loyalty.business.slug} />
      }
    >
      <ScaffoldContainer>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Expiring Points</CardTitle>
            </CardHeader>
            <CardContent>
              {loyalty.buckets.length === 0 ? (
                <Empty className="py-8">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <Gift className="size-6" />
                    </EmptyMedia>
                    <EmptyTitle>No points expiring soon</EmptyTitle>
                    <EmptyDescription>
                      Your points are safe. Use them before they expire to get
                      the most value.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <ul className="space-y-1 text-sm">
                  {loyalty.buckets.map((bucket) => (
                    <li key={bucket.id}>
                      {bucket.remainingAmount} points expire on{" "}
                      <DateDisplay date={bucket.expiresAt} />
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {loyalty.transactions.length === 0 ? (
                <Empty className="py-8">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <Receipt className="size-6" />
                    </EmptyMedia>
                    <EmptyTitle>No transactions yet</EmptyTitle>
                    <EmptyDescription>
                      Your points history will appear here after you earn or
                      redeem points.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Source</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loyalty.transactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell>
                          <DateDisplay date={tx.createdAt} />
                        </TableCell>
                        <TableCell>{tx.type}</TableCell>
                        <TableCell>{tx.amount}</TableCell>
                        <TableCell>{tx.source}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </ScaffoldContainer>
    </PageLayout>
  );
}
