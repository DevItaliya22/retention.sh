"use client";

import { CustomerLogoutButton } from "@/components/customer-portal/CustomerLogoutButton";
import { PageLayout, ScaffoldContainer } from "@/components/layouts";
import { fetcher } from "@/lib/fetcher";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DateDisplay,
} from "@reelo/ui/components";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

interface LoyaltyListResponse {
  items: {
    businessId: string;
    businessName: string;
    businessSlug: string;
    pointsBalance: number;
    nextExpiry?: { amount: number; expiresAt: string } | null;
    currencySymbol: string;
    currencyCode: string;
  }[];
  error?: string;
}

export default function LoyaltyListPage() {
  const { data, isLoading, isError } = useQuery<LoyaltyListResponse, Error>({
    queryKey: ["customer-loyalty-list"],
    queryFn: () => fetcher<LoyaltyListResponse>("/api/customer/loyalty"),
  });

  if (isLoading) {
    return <div className="p-6">Loading loyalty data...</div>;
  }

  if (isError || !data) {
    return <div className="p-6">Failed to load loyalty data.</div>;
  }

  return (
    <PageLayout
      title="Your Loyalty Accounts"
      subtitle="Track points across businesses"
      size="default"
      scaffoldSectionClassName="h-full w-full pt-2 pb-0"
      primaryActions={<CustomerLogoutButton />}
    >
      <ScaffoldContainer>
        <div className="space-y-4">
          {data.items.length === 0 && (
            <p className="text-muted-foreground">No loyalty accounts found.</p>
          )}
          {data.items.map((item) => (
            <Link key={item.businessId} href={`/loyalty/${item.businessSlug}`}>
              <Card className="transition hover:shadow-md">
                <CardHeader>
                  <CardTitle>{item.businessName}</CardTitle>
                  <CardDescription>
                    Balance: {item.pointsBalance} points
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {item.nextExpiry ? (
                    <p className="text-muted-foreground text-sm">
                      {item.nextExpiry.amount} points expire on{" "}
                      <DateDisplay date={item.nextExpiry.expiresAt} />
                    </p>
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      No points expiring soon
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </ScaffoldContainer>
    </PageLayout>
  );
}
