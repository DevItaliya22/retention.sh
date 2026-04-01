"use client";

import { fetcher } from "@/lib/fetcher";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { AmountSpentView } from "./_components/amount-spent";
import { CashbackView } from "./_components/cashback";
import { LoadingView, StateView } from "./_components/common";
import type { LoyaltyDetailResponse } from "./_components/common/types";
import { TierView } from "./_components/tier";
import { VisitMadeView } from "./_components/visit-made";

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
      <StateView
        message="Invalid link. Please use the link shared with you."
        destructive
      />
    );
  }

  if (isLoading) return <LoadingView />;

  if (isError) {
    return (
      <StateView
        message={
          error?.message ?? "Failed to load loyalty details. Please try again."
        }
        destructive
      />
    );
  }

  if (!data?.loyalty) {
    return <StateView message="Loyalty data not found." />;
  }

  const { loyalty } = data;

  switch (loyalty.loyaltyType) {
    case "TIER":
      return <TierView data={loyalty} />;
    case "AMOUNT_SPENT":
      return <AmountSpentView data={loyalty} />;
    case "VISIT_MADE":
      return <VisitMadeView data={loyalty} />;
    case "CASHBACK":
    default:
      return <CashbackView data={loyalty} />;
  }
}
