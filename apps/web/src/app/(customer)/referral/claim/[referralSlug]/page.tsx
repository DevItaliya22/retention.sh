import { ReferralClaimPageClient } from "@/components/referral/ReferralClaimPageClient";
import { generateRouteMetadata } from "@/lib/utils/route-metadata";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ referralSlug: string }>;
}): Promise<Metadata> {
  return generateRouteMetadata("/referral/claim/[referralSlug]");
}

export default async function ReferralClaimPage({
  params,
}: {
  params: Promise<{ referralSlug: string }>;
}) {
  const { referralSlug } = await params;
  return <ReferralClaimPageClient referralSlug={referralSlug} />;
}
