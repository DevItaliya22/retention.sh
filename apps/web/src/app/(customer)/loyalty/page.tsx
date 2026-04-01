"use client";

import { CustomerLogoutButton } from "@/components/customer-portal/CustomerLogoutButton";
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
import { MobileLayout } from "./[businessSlug]/_components/common/MobileLayout";

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

  return (
    <MobileLayout>
      <header className="bg-background/95 sticky top-0 z-10 flex items-center justify-between border-b px-4 py-3 backdrop-blur-sm">
        <h1 className="text-base font-semibold tracking-tight">
          Your Loyalty Accounts
        </h1>
        <CustomerLogoutButton />
      </header>

      <div className="space-y-3 p-4 pb-8">
        {isLoading && (
          <p className="text-muted-foreground py-8 text-center text-sm">
            Loading loyalty data...
          </p>
        )}

        {isError && (
          <p className="text-destructive py-8 text-center text-sm">
            Failed to load loyalty data.
          </p>
        )}

        {data && data.items.length === 0 && (
          <p className="text-muted-foreground py-8 text-center text-sm">
            No loyalty accounts found.
          </p>
        )}

        {data?.items.map((item) => (
          <Link key={item.businessId} href={`/loyalty/${item.businessSlug}`}>
            <Card className="transition hover:shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{item.businessName}</CardTitle>
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
    </MobileLayout>
  );
}
